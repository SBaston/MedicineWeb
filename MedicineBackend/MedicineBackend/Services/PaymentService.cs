// ═══════════════════════════════════════════════════════════════
// Services/PaymentService.cs
// Integración con Stripe Checkout para citas y cursos
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.Data;
using MedicineBackend.Models;
using MedicineBackend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Stripe;
using Stripe.Checkout;
using System.Data;

namespace MedicineBackend.Services;

public class PaymentService : IPaymentService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;
    private readonly ILogger<PaymentService> _logger;
    private readonly ISettingsService _settings;
    private readonly IInvoiceService _invoices;

    // ─── Configuración de Stripe ───────────────────────────────
    private readonly string _secretKey;
    private readonly string _webhookSecret;
    private readonly string _successUrl;
    private readonly string _cancelUrl;
    private readonly decimal _commissionPct;
    private readonly string _currency;

    public PaymentService(
        AppDbContext context,
        IConfiguration config,
        ILogger<PaymentService> logger,
        ISettingsService settings,
        IInvoiceService invoices)
    {
        _context  = context;
        _config   = config;
        _logger   = logger;
        _settings = settings;
        _invoices = invoices;

        var ps = config.GetSection("PaymentSettings");
        _secretKey     = ps["StripeSecretKey"]     ?? throw new InvalidOperationException("StripeSecretKey no configurada");
        _webhookSecret = ps["StripeWebhookSecret"] ?? throw new InvalidOperationException("StripeWebhookSecret no configurada");
        _successUrl    = ps["SuccessUrl"]           ?? "http://localhost:5173/payment/success?session_id={CHECKOUT_SESSION_ID}";
        _cancelUrl     = ps["CancelUrl"]            ?? "http://localhost:5173/payment/cancel";
        _commissionPct = decimal.TryParse(ps["PlatformCommissionPercentage"], out var c) ? c : 15m;
        _currency      = (ps["Currency"] ?? "eur").ToLower();

        StripeConfiguration.ApiKey = _secretKey;
    }

    // ─────────────────────────────────────────────────────────────
    // Checkout para CITAS
    // ─────────────────────────────────────────────────────────────
    public async Task<string> CreateAppointmentCheckoutAsync(
        int patientUserId, int doctorId, int appointmentId, decimal price)
    {
        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == patientUserId)
            ?? throw new KeyNotFoundException("Paciente no encontrado");

        var doctor = await _context.Doctors.FindAsync(doctorId)
            ?? throw new KeyNotFoundException("Doctor no encontrado");

        var appointment = await _context.Appointments.FindAsync(appointmentId)
            ?? throw new KeyNotFoundException("Cita no encontrada");

        // Calcular comisión
        var fee        = Math.Round(price * (_commissionPct / 100m), 2);
        var doctorNet  = price - fee;

        // Guardar Payment pendiente
        var payment = new Payment
        {
            PatientId      = patient.Id,
            DoctorId       = doctorId,
            AppointmentId  = appointmentId,
            Amount         = price,
            Currency       = _currency.ToUpper(),
            PlatformFee    = fee,
            DoctorAmount   = doctorNet,
            Status         = "Pendiente",
            PaymentMethod  = "Stripe",
            PaymentType    = "Cita",
            PaymentProvider= "Stripe",
            Description    = $"Cita #{appointmentId} con Dr. {doctor.FirstName} {doctor.LastName}"
        };
        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        // Crear sesión de Stripe Checkout
        var options = new SessionCreateOptions
        {
            PaymentMethodTypes = ["card"],
            LineItems =
            [
                new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency    = _currency,
                        UnitAmount  = (long)(price * 100), // en céntimos
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name        = $"Consulta con Dr. {doctor.FirstName} {doctor.LastName}",
                            Description = $"Cita médica el {appointment.AppointmentDate:dd/MM/yyyy} a las {appointment.AppointmentDate:HH:mm}",
                        }
                    },
                    Quantity = 1
                }
            ],
            Mode       = "payment",
            SuccessUrl = _successUrl,
            CancelUrl  = _cancelUrl,
            Metadata   = new Dictionary<string, string>
            {
                { "payment_id",    payment.Id.ToString() },
                { "type",          "appointment" },
                { "appointment_id", appointmentId.ToString() }
            }
        };

        var service = new SessionService();
        var session = await service.CreateAsync(options);

        // Guardar el Stripe session ID
        payment.TransactionId = session.Id;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Stripe Checkout creado para cita {AppointmentId}, session {SessionId}", appointmentId, session.Id);

        return session.Url;
    }

    // ─────────────────────────────────────────────────────────────
    // Checkout para CURSOS
    // ─────────────────────────────────────────────────────────────
    public async Task<string> CreateCourseCheckoutAsync(
        int userId, string role, int courseId, decimal price)
    {
        var course = await _context.Courses
            .Include(c => c.Doctor)
            .FirstOrDefaultAsync(c => c.Id == courseId)
            ?? throw new KeyNotFoundException("Curso no encontrado");

        // Resolver doctorId y patientId para el Payment
        int doctorId  = course.DoctorId;
        int? patientId = null;
        int? enrollDoctorId = null;

        if (role == "Patient")
        {
            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId)
                ?? throw new KeyNotFoundException("Paciente no encontrado");
            patientId = patient.Id;
        }
        else if (role == "Doctor")
        {
            var enrollingDoctor = await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == userId)
                ?? throw new KeyNotFoundException("Doctor no encontrado");
            enrollDoctorId = enrollingDoctor.Id;
        }

        // Los pacientes pagan IVA (tipo configurado en BD); los profesionales están exentos
        bool patientPays  = role == "Patient";
        var ivaRate       = patientPays ? await _settings.GetIvaRateAsync() : 0m;
        var vatAmount     = patientPays ? Math.Round(price * ivaRate, 2) : 0m;
        var priceFinal    = price + vatAmount;   // precio que cobra Stripe

        // Comisión y ganancias se calculan sobre el precio neto (sin IVA)
        var fee       = Math.Round(price * (_commissionPct / 100m), 2);
        var doctorNet = price - fee;

        var payment = new Payment
        {
            PatientId      = patientId ?? 0,
            DoctorId       = doctorId,
            CourseId       = courseId,
            Amount         = priceFinal,    // total cobrado al comprador (IVA incluido si aplica)
            Currency       = _currency.ToUpper(),
            PlatformFee    = fee,
            DoctorAmount   = doctorNet,
            Status         = "Pendiente",
            PaymentMethod  = "Stripe",
            PaymentType    = "Curso",
            PaymentProvider= "Stripe",
            Description    = $"Matrícula en curso: {course.Title}{(patientPays ? $" (IVA {ivaRate*100:F0}% incluido)" : " (exento IVA)")}"
        };
        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        var courseDesc = course.Description?.Length > 150
            ? course.Description[..150] + "…"
            : course.Description ?? "Curso en NexusSalud";

        var options = new SessionCreateOptions
        {
            PaymentMethodTypes = ["card"],
            LineItems =
            [
                new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency    = _currency,
                        UnitAmount  = (long)(priceFinal * 100),   // céntimos
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name        = course.Title,
                            Description = patientPays
                                ? $"{courseDesc} (IVA {ivaRate*100:F0}% incluido)"
                                : $"{courseDesc} (exento de IVA)",
                            Images = course.CoverImageUrl != null
                                ? [$"http://localhost:5000{course.CoverImageUrl}"]
                                : null
                        }
                    },
                    Quantity = 1
                }
            ],
            Mode       = "payment",
            SuccessUrl = _successUrl,
            CancelUrl  = _cancelUrl,
            Metadata   = new Dictionary<string, string>
            {
                { "payment_id",  payment.Id.ToString() },
                { "type",        "course" },
                { "course_id",   courseId.ToString() },
                { "user_id",     userId.ToString() },
                { "role",        role },
                { "enroll_doctor_id", enrollDoctorId?.ToString() ?? "" }
            }
        };

        var service = new SessionService();
        var session = await service.CreateAsync(options);

        payment.TransactionId = session.Id;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Stripe Checkout creado para curso {CourseId}, session {SessionId}", courseId, session.Id);

        return session.Url;
    }

    // ─────────────────────────────────────────────────────────────
    // Webhook de Stripe
    // ─────────────────────────────────────────────────────────────
    public async Task HandleWebhookAsync(string payload, string stripeSignature)
    {
        Event stripeEvent;
        try
        {
            stripeEvent = EventUtility.ConstructEvent(payload, stripeSignature, _webhookSecret);
        }
        catch (StripeException ex)
        {
            _logger.LogWarning("Webhook inválido: {Message}", ex.Message);
            throw;
        }

        if (stripeEvent.Type == EventTypes.CheckoutSessionCompleted)
        {
            var session = stripeEvent.Data.Object as Session;
            if (session == null) return;

            var meta = session.Metadata;
            meta.TryGetValue("type", out var eventType);

            // ── SUSCRIPCIÓN DE CHAT ────────────────────────────────
            if (eventType == "chat_subscription")
            {
                if (meta.TryGetValue("chat_subscription_id", out var subIdStr)
                    && int.TryParse(subIdStr, out var subId))
                {
                    await ActivateChatSubscriptionAsync(subId);
                }
                else
                {
                    _logger.LogWarning("Webhook chat_subscription sin chat_subscription_id");
                }
                return;
            }

            if (!meta.TryGetValue("payment_id", out var payIdStr) || !int.TryParse(payIdStr, out var paymentId))
            {
                _logger.LogWarning("Webhook sin payment_id en metadata (type: {Type})", eventType);
                return;
            }

            // Transacción RepeatableRead: si Stripe reintenta el webhook y llegan dos
            // llamadas simultáneas, solo una pasará el check status != "Completado".
            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.RepeatableRead);
            try
            {
                var payment = await _context.Payments.FindAsync(paymentId);
                if (payment == null || payment.Status == "Completado")
                {
                    await transaction.RollbackAsync();
                    return;
                }

                // Marcar pago como completado
                // NOTA: no sobreescribimos TransactionId porque es el session.Id
                // que usa GetSessionStatus para buscar el pago desde la página de éxito.
                payment.Status      = "Completado";
                payment.ProcessedAt = DateTime.UtcNow;

                meta.TryGetValue("type", out var type);

                // ── Activar CITA ──────────────────────────────────────
                if (type == "appointment"
                    && meta.TryGetValue("appointment_id", out var apptIdStr)
                    && int.TryParse(apptIdStr, out var apptId))
                {
                    var appt = await _context.Appointments.FindAsync(apptId);
                    if (appt != null && appt.Status == "PendientePago")
                        appt.Status = "Pendiente";
                }

                // ── Crear MATRÍCULA ─────────────────────────────────
                if (type == "course"
                    && meta.TryGetValue("course_id", out var cIdStr)
                    && int.TryParse(cIdStr, out var cId)
                    && meta.TryGetValue("user_id", out var uIdStr)
                    && int.TryParse(uIdStr, out var uId)
                    && meta.TryGetValue("role", out var role))
                {
                    CourseEnrollment? enrollment = null;

                    if (role == "Patient")
                    {
                        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == uId);
                        if (patient != null)
                        {
                            var exists = await _context.CourseEnrollments
                                .AnyAsync(e => e.CourseId == cId && e.PatientId == patient.Id);
                            if (!exists)
                                enrollment = new CourseEnrollment { CourseId = cId, PatientId = patient.Id, EnrolledAt = DateTime.UtcNow };
                        }
                    }
                    else if (role == "Doctor"
                        && meta.TryGetValue("enroll_doctor_id", out var edStr)
                        && int.TryParse(edStr, out var edId))
                    {
                        var exists = await _context.CourseEnrollments
                            .AnyAsync(e => e.CourseId == cId && e.DoctorId == edId);
                        if (!exists)
                            enrollment = new CourseEnrollment { CourseId = cId, DoctorId = edId, EnrolledAt = DateTime.UtcNow };
                    }

                    if (enrollment != null)
                    {
                        _context.CourseEnrollments.Add(enrollment);
                        // Incremento atómico en BD para evitar carreras en el contador
                        await _context.Courses
                            .Where(c => c.Id == cId)
                            .ExecuteUpdateAsync(s => s.SetProperty(c => c.TotalEnrollments, c => c.TotalEnrollments + 1));
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                _logger.LogInformation("Pago {PaymentId} completado vía webhook", paymentId);

                // Generar factura (fuera de la transacción para no bloquearla)
                _ = Task.Run(async () =>
                {
                    try { await _invoices.GenerateForPaymentAsync(paymentId); }
                    catch (Exception ex) { _logger.LogError(ex, "Error generando factura para pago {PaymentId}", paymentId); }
                });
            }
            catch (DbUpdateException ex)
            {
                await transaction.RollbackAsync();
                // El índice único de BD evitó una matrícula duplicada — es idempotente, no es error
                _logger.LogWarning(ex, "Webhook duplicado para pago {PaymentId} — ignorado (constraint único)", paymentId);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Activar suscripción de chat tras pago completado
    // ─────────────────────────────────────────────────────────────
    private async Task ActivateChatSubscriptionAsync(int subscriptionId)
    {
        await using var tx = await _context.Database.BeginTransactionAsync(IsolationLevel.RepeatableRead);
        try
        {
            var sub = await _context.ChatSubscriptions
                .Include(s => s.Plan)
                .FirstOrDefaultAsync(s => s.Id == subscriptionId);

            if (sub == null || sub.Status != "Pending")
            {
                await tx.RollbackAsync();
                return;
            }

            var now = DateTime.UtcNow;
            sub.Status           = "Active";
            sub.StartDate        = now;
            sub.EndDate          = now.AddDays(sub.Plan.DurationDays);
            sub.DoctorEarnings   = Math.Round(sub.AmountPaid * (1 - sub.Plan.PlatformCommissionPercent / 100m), 2);
            sub.PlatformEarnings = Math.Round(sub.AmountPaid * (sub.Plan.PlatformCommissionPercent / 100m), 2);

            // Actualizar ganancias del doctor
            await _context.Doctors
                .Where(d => d.Id == sub.DoctorId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    d => d.TotalEarnings,
                    d => d.TotalEarnings + sub.DoctorEarnings));

            await _context.SaveChangesAsync();
            await tx.CommitAsync();
            _logger.LogInformation("Suscripción de chat {SubId} activada vía webhook", subscriptionId);

            // Generar factura fuera de la transacción
            _ = Task.Run(async () =>
            {
                try { await _invoices.GenerateForChatSubscriptionAsync(subscriptionId); }
                catch (Exception ex) { _logger.LogError(ex, "Error generando factura para chat sub {SubId}", subscriptionId); }
            });
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }
}
