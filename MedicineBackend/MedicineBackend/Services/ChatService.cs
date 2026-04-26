// ═══════════════════════════════════════════════════════════════
// Services/ChatService.cs
// Servicio de suscripciones de chat premium entre pacientes y médicos
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.Data;
using MedicineBackend.DTOs.Chat;
using MedicineBackend.Models;
using MedicineBackend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Stripe;
using Stripe.Checkout;

namespace MedicineBackend.Services;

public class ChatService : IChatService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<ChatService> _logger;

    private readonly ISettingsService _settings;
    private readonly IInvoiceService _invoices;

    private readonly string _successUrl;
    private readonly string _cancelUrl;
    private readonly string _currency;

    public ChatService(
        AppDbContext db,
        IConfiguration config,
        ILogger<ChatService> logger,
        ISettingsService settings,
        IInvoiceService invoices)
    {
        _db       = db;
        _config   = config;
        _logger   = logger;
        _settings = settings;
        _invoices = invoices;

        var ps = config.GetSection("PaymentSettings");
        var secretKey = ps["StripeSecretKey"] ?? throw new InvalidOperationException("StripeSecretKey no configurada");
        StripeConfiguration.ApiKey = secretKey;

        _successUrl = ps["SuccessUrl"] ?? "http://localhost:5173/payment/success?session_id={CHECKOUT_SESSION_ID}";
        _cancelUrl  = ps["CancelUrl"]  ?? "http://localhost:5173/payment/cancel";
        _currency   = (ps["Currency"]  ?? "eur").ToLower();
    }

    // ─────────────────────────────────────────────────────────────
    // Planes
    // ─────────────────────────────────────────────────────────────

    public async Task<List<ChatPlanDto>> GetActivePlansAsync()
    {
        var plans = await _db.ChatPlans
            .Where(p => p.IsActive)
            .OrderBy(p => p.Price)
            .ToListAsync();

        return plans.Select(MapPlanToDto).ToList();
    }

    public async Task<List<ChatPlanDto>> GetAllPlansAsync()
    {
        var plans = await _db.ChatPlans
            .OrderBy(p => p.Id)
            .ToListAsync();

        return plans.Select(MapPlanToDto).ToList();
    }

    public async Task<ChatPlanDto> CreatePlanAsync(CreateChatPlanDto dto)
    {
        var plan = new ChatPlan
        {
            Name                     = dto.Name,
            Description              = dto.Description,
            Price                    = dto.Price,
            DurationDays             = dto.DurationDays,
            PlatformCommissionPercent = dto.PlatformCommissionPercent,
            IsVatExempt              = dto.IsVatExempt,
            IsActive                 = true,
            CreatedAt                = DateTime.UtcNow
        };

        _db.ChatPlans.Add(plan);
        await _db.SaveChangesAsync();
        return MapPlanToDto(plan);
    }

    public async Task<ChatPlanDto> UpdatePlanAsync(int id, UpdateChatPlanDto dto)
    {
        var plan = await _db.ChatPlans.FindAsync(id)
            ?? throw new KeyNotFoundException($"Plan {id} no encontrado");

        if (dto.Name != null)                     plan.Name = dto.Name;
        if (dto.Description != null)              plan.Description = dto.Description;
        if (dto.Price.HasValue)                   plan.Price = dto.Price.Value;
        if (dto.DurationDays.HasValue)            plan.DurationDays = dto.DurationDays.Value;
        if (dto.PlatformCommissionPercent.HasValue) plan.PlatformCommissionPercent = dto.PlatformCommissionPercent.Value;
        if (dto.IsActive.HasValue)                plan.IsActive = dto.IsActive.Value;
        plan.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return MapPlanToDto(plan);
    }

    public async Task DeactivatePlanAsync(int id)
    {
        var plan = await _db.ChatPlans.FindAsync(id)
            ?? throw new KeyNotFoundException($"Plan {id} no encontrado");

        plan.IsActive  = false;
        plan.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    // ─────────────────────────────────────────────────────────────
    // Suscripciones
    // ─────────────────────────────────────────────────────────────

    public async Task<List<ChatSubscriptionDto>> GetPatientSubscriptionsAsync(int patientUserId)
    {
        var subs = await _db.ChatSubscriptions
            .Include(s => s.Doctor).ThenInclude(d => d.User)
            .Include(s => s.Plan)
            .Where(s => s.PatientUserId == patientUserId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        var result = new List<ChatSubscriptionDto>();
        foreach (var sub in subs)
        {
            var dto = await MapSubscriptionToDtoAsync(sub, patientUserId);
            result.Add(dto);
        }
        return result;
    }

    public async Task<ChatSubscriptionDto?> GetSubscriptionWithDoctorAsync(int patientUserId, int doctorId)
    {
        var sub = await _db.ChatSubscriptions
            .Include(s => s.Doctor).ThenInclude(d => d.User)
            .Include(s => s.Plan)
            .Where(s => s.PatientUserId == patientUserId
                     && s.DoctorId == doctorId
                     && (s.Status == "Active" || s.Status == "Expired"))
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync();

        if (sub == null) return null;
        return await MapSubscriptionToDtoAsync(sub, patientUserId);
    }

    // ─────────────────────────────────────────────────────────────
    // Mensajes
    // ─────────────────────────────────────────────────────────────

    public async Task<List<ChatMessageDto>> GetMessagesAsync(
        int subscriptionId, int requestingUserId, int page = 1, int pageSize = 50)
    {
        // Verificar que el usuario pertenece a la suscripción
        var sub = await _db.ChatSubscriptions
            .Include(s => s.Doctor)
            .FirstOrDefaultAsync(s => s.Id == subscriptionId)
            ?? throw new KeyNotFoundException("Suscripción no encontrada");

        var isPatient = sub.PatientUserId == requestingUserId;
        var isDoctor  = sub.Doctor.UserId == requestingUserId;
        if (!isPatient && !isDoctor)
            throw new UnauthorizedAccessException("No tienes acceso a este chat");

        var messages = await _db.ChatMessages
            .Include(m => m.Sender)
            .Where(m => m.ChatSubscriptionId == subscriptionId)
            .OrderByDescending(m => m.SentAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return messages.Select(MapMessageToDto).ToList();
    }

    public async Task<ChatMessageDto> SendMessageAsync(
        int subscriptionId, int senderUserId, string senderRole, string content)
    {
        var sub = await _db.ChatSubscriptions
            .Include(s => s.Doctor)
            .Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.Id == subscriptionId)
            ?? throw new KeyNotFoundException("Suscripción no encontrada");

        if (sub.Status != "Active")
            throw new InvalidOperationException("La suscripción no está activa. No se puede enviar mensajes.");

        var sender = await _db.Users.FindAsync(senderUserId)
            ?? throw new KeyNotFoundException("Usuario no encontrado");

        var message = new ChatMessage
        {
            ChatSubscriptionId = subscriptionId,
            SenderUserId       = senderUserId,
            SenderRole         = senderRole,
            Content            = content,
            IsRead             = false,
            SentAt             = DateTime.UtcNow
        };

        _db.ChatMessages.Add(message);
        await _db.SaveChangesAsync();

        // Reload sender for navigation property
        message.Sender = sender;

        _logger.LogInformation("Mensaje enviado en suscripción {SubId} por usuario {UserId}", subscriptionId, senderUserId);

        return MapMessageToDto(message);
    }

    public async Task MarkMessagesReadAsync(int subscriptionId, int readerUserId)
    {
        var sub = await _db.ChatSubscriptions
            .Include(s => s.Doctor)
            .FirstOrDefaultAsync(s => s.Id == subscriptionId)
            ?? throw new KeyNotFoundException("Suscripción no encontrada");

        var isPatient = sub.PatientUserId == readerUserId;
        var isDoctor  = sub.Doctor.UserId == readerUserId;
        if (!isPatient && !isDoctor)
            throw new UnauthorizedAccessException("No tienes acceso a este chat");

        // Marcar como leídos los mensajes del OTRO participante
        var now = DateTime.UtcNow;
        await _db.ChatMessages
            .Where(m => m.ChatSubscriptionId == subscriptionId
                     && m.SenderUserId != readerUserId
                     && !m.IsRead)
            .ExecuteUpdateAsync(s => s
                .SetProperty(m => m.IsRead, true)
                .SetProperty(m => m.ReadAt, now));
    }

    // ─────────────────────────────────────────────────────────────
    // Checkout / Stripe
    // ─────────────────────────────────────────────────────────────

    public async Task<string> CreateCheckoutAsync(
        int patientUserId, int doctorId, int planId, string successUrl, string cancelUrl)
    {
        var plan = await _db.ChatPlans.FindAsync(planId)
            ?? throw new KeyNotFoundException("Plan no encontrado");

        if (!plan.IsActive)
            throw new InvalidOperationException("El plan seleccionado no está disponible");

        var doctor = await _db.Doctors
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == doctorId)
            ?? throw new KeyNotFoundException("Doctor no encontrado");

        // Verificar que no hay suscripción activa ya
        var existingActive = await _db.ChatSubscriptions
            .AnyAsync(s => s.PatientUserId == patientUserId
                        && s.DoctorId == doctorId
                        && s.Status == "Active");
        if (existingActive)
            throw new InvalidOperationException("Ya tienes una suscripción activa con este médico");

        // Precio base (neto) y precio final con IVA que paga el paciente (tipo desde BD)
        var ivaRate       = await _settings.GetIvaRateAsync();
        var priceNet      = plan.Price;
        var vatAmount     = Math.Round(priceNet * ivaRate, 2);
        var priceFinal    = priceNet + vatAmount;   // lo que cobra Stripe

        // Ganancias: se calculan sobre el precio neto (el IVA va al Estado)
        var platformEarnings = Math.Round(priceNet * (plan.PlatformCommissionPercent / 100m), 2);
        var doctorEarnings   = priceNet - platformEarnings;

        // Crear registro pendiente
        var subscription = new ChatSubscription
        {
            PatientUserId    = patientUserId,
            DoctorId         = doctorId,
            ChatPlanId       = planId,
            Status           = "Pending",
            AmountPaid       = priceFinal,   // total pagado por el paciente (IVA incluido)
            DoctorEarnings   = doctorEarnings,
            PlatformEarnings = platformEarnings,
            IsVatExempt      = false,        // el paciente siempre paga IVA
            StartDate        = DateTime.UtcNow,
            EndDate          = DateTime.UtcNow,
            CreatedAt        = DateTime.UtcNow
        };

        _db.ChatSubscriptions.Add(subscription);
        await _db.SaveChangesAsync();

        // Crear sesión Stripe Checkout — cargo precio con IVA
        var options = new SessionCreateOptions
        {
            PaymentMethodTypes = ["card"],
            LineItems =
            [
                new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency   = _currency,
                        UnitAmount = (long)(priceFinal * 100),   // céntimos, IVA incluido
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name        = $"Chat Premium con Dr. {doctor.FirstName} {doctor.LastName} — {plan.Name}",
                            Description = $"{plan.Description ?? $"Acceso de mensajería por {plan.DurationDays} días"} (IVA {ivaRate*100:F0}% incluido)"
                        }
                    },
                    Quantity = 1
                }
            ],
            Mode       = "payment",
            SuccessUrl = successUrl,
            CancelUrl  = cancelUrl,
            Metadata   = new Dictionary<string, string>
            {
                { "type",                 "chat_subscription" },
                { "chat_subscription_id", subscription.Id.ToString() }
            }
        };

        var service = new SessionService();
        var session = await service.CreateAsync(options);

        // Guardar session ID de Stripe
        subscription.StripeSessionId = session.Id;
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Stripe Checkout creado para chat (sub {SubId}, doctor {DoctorId}), session {SessionId}",
            subscription.Id, doctorId, session.Id);

        return session.Url;
    }

    public async Task ActivateSubscriptionAsync(string stripeSessionId)
    {
        var subscription = await _db.ChatSubscriptions
            .Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.StripeSessionId == stripeSessionId)
            ?? throw new KeyNotFoundException("Suscripción no encontrada para la sesión de Stripe");

        if (subscription.Status != "Pending") return;

        subscription.Status          = "Active";
        subscription.StartDate       = DateTime.UtcNow;
        subscription.EndDate         = DateTime.UtcNow.AddDays(subscription.Plan.DurationDays);
        subscription.DoctorEarnings  = subscription.AmountPaid * (1 - subscription.Plan.PlatformCommissionPercent / 100m);
        subscription.PlatformEarnings = subscription.AmountPaid * (subscription.Plan.PlatformCommissionPercent / 100m);

        await _db.SaveChangesAsync();
        _logger.LogInformation("Suscripción de chat {SubId} activada", subscription.Id);
    }

    // ─────────────────────────────────────────────────────────────
    // Tarea periódica — expirar suscripciones
    // ─────────────────────────────────────────────────────────────

    public async Task ExpireOldSubscriptionsAsync()
    {
        var now = DateTime.UtcNow;
        var expired = await _db.ChatSubscriptions
            .Where(s => s.Status == "Active" && s.EndDate < now)
            .ToListAsync();

        foreach (var sub in expired)
            sub.Status = "Expired";

        if (expired.Count > 0)
        {
            await _db.SaveChangesAsync();
            _logger.LogInformation("Se expiraron {Count} suscripciones de chat", expired.Count);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Helpers de mapeo
    // ─────────────────────────────────────────────────────────────

    private static ChatPlanDto MapPlanToDto(ChatPlan plan) => new()
    {
        Id                        = plan.Id,
        Name                      = plan.Name,
        Description               = plan.Description,
        Price                     = plan.Price,
        DurationDays              = plan.DurationDays,
        PlatformCommissionPercent = plan.PlatformCommissionPercent,
        IsActive                  = plan.IsActive,
        IsVatExempt               = plan.IsVatExempt
    };

    private async Task<ChatSubscriptionDto> MapSubscriptionToDtoAsync(
        ChatSubscription sub, int requestingUserId)
    {
        // Último mensaje
        var lastMsg = await _db.ChatMessages
            .Include(m => m.Sender)
            .Where(m => m.ChatSubscriptionId == sub.Id)
            .OrderByDescending(m => m.SentAt)
            .FirstOrDefaultAsync();

        // Mensajes no leídos para el usuario que consulta
        var unreadCount = await _db.ChatMessages
            .CountAsync(m => m.ChatSubscriptionId == sub.Id
                          && m.SenderUserId != requestingUserId
                          && !m.IsRead);

        return new ChatSubscriptionDto
        {
            Id                    = sub.Id,
            DoctorId              = sub.DoctorId,
            DoctorName            = $"{sub.Doctor.FirstName} {sub.Doctor.LastName}",
            DoctorProfilePictureUrl = sub.Doctor.ProfilePictureUrl,
            PlanName              = sub.Plan.Name,
            AmountPaid            = sub.AmountPaid,
            StartDate             = sub.StartDate,
            EndDate               = sub.EndDate,
            Status                = sub.Status,
            IsReadOnly            = sub.Status == "Expired",
            UnreadCount           = unreadCount,
            LastMessage           = lastMsg != null ? MapMessageToDto(lastMsg) : null
        };
    }

    private static ChatMessageDto MapMessageToDto(ChatMessage msg)
    {
        var senderName = string.Empty;
        if (msg.Sender != null)
        {
            // El nombre real está en Doctor/Patient; usamos el email como fallback
            senderName = msg.Sender.Email;
        }

        return new ChatMessageDto
        {
            Id           = msg.Id,
            SenderUserId = msg.SenderUserId,
            SenderRole   = msg.SenderRole,
            SenderName   = senderName,
            Content      = msg.Content,
            IsRead       = msg.IsRead,
            SentAt       = msg.SentAt
        };
    }
}
