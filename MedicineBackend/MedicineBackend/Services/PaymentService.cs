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

namespace MedicineBackend.Services;

public class PaymentService : IPaymentService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;
    private readonly ILogger<PaymentService> _logger;

    // ─── Configuración de Stripe ───────────────────────────────
    private readonly string _secretKey;
    private readonly string _webhookSecret;
    private readonly string _successUrl;
    private readonly string _cancelUrl;
    private readonly decimal _commissionPct;
    private readonly string _currency;

    public PaymentService(AppDbContext context, IConfiguration config, ILogger<PaymentService> logger)
    {
        _context = context;
        _config  = config;
        _logger  = logger;

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

        var fee       = Math.Round(price * (_commissionPct / 100m), 2);
        var doctorNet = price - fee;

        var payment = new Payment
        {
            PatientId      = patientId ?? 0,   // 0 cuando paga un doctor (la FK requiere valor)
            DoctorId       = doctorId,
            CourseId       = courseId,
            Amount         = price,
            Currency       = _currency.ToUpper(),
            PlatformFee    = fee,
            DoctorAmount   = doctorNet,
            Status         = "Pendiente",
            PaymentMethod  = "Stripe",
            PaymentType    = "Curso",
            PaymentProvider= "Stripe",
            Description    = $"Matrícula en curso: {course.Title}"
        };
        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

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
                        UnitAmount  = (long)(price * 100),
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name        = course.Title,
                            Description = course.Description?.Length > 150
                                ? course.Description[..150] + "…"
                                : course.Description ?? "Curso en NexusSalud",
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

            if (!meta.TryGetValue("payment_id", out var payIdStr) || !int.TryParse(payIdStr, out var paymentId))
            {
                _logger.LogWarning("Webhook sin payment_id en metadata");
                return;
            }

            var payment = await _context.Payments.FindAsync(paymentId);
            if (payment == null || payment.Status == "Completado") return;

            // Marcar pago como completado
            // NOTA: no sobreescribimos TransactionId porque es el session.Id
            // que usa GetSessionStatus para buscar el pago desde la página de éxito.
            payment.Status      = "Completado";
            payment.ProcessedAt = DateTime.UtcNow;

            // ── Activar CITA ────────────────────────────────────
            if (meta.TryGetValue("type", out var type) && type == "appointment"
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
                var course = await _context.Courses.FindAsync(cId);
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
                    if (course != null) course.TotalEnrollments++;
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Pago {PaymentId} completado vía webhook", paymentId);
        }
    }
}
