// ═══════════════════════════════════════════════════════════════
// Controllers/ChatController.cs
// Chat premium — suscripciones, mensajes y checkout
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.Data;
using MedicineBackend.DTOs.Chat;
using MedicineBackend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;

namespace MedicineBackend.Controllers;

[ApiController]
[Route("api/chat")]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public ChatController(IChatService chatService, AppDbContext db, IConfiguration config)
    {
        _chatService = chatService;
        _db = db;
        _config = config;
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/chat/plans  — público
    // ─────────────────────────────────────────────────────────────
    [HttpGet("plans")]
    [AllowAnonymous]
    public async Task<IActionResult> GetActivePlans()
    {
        var plans = await _chatService.GetActivePlansAsync();
        return Ok(plans);
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/chat/subscriptions  — paciente autenticado
    // ─────────────────────────────────────────────────────────────
    [HttpGet("subscriptions")]
    [Authorize(Roles = "Patient")]
    public async Task<IActionResult> GetMySubscriptions()
    {
        var userId = GetUserId();
        var subs = await _chatService.GetPatientSubscriptionsAsync(userId);
        return Ok(subs);
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/chat/subscriptions/doctor/{doctorId}  — paciente
    // ─────────────────────────────────────────────────────────────
    [HttpGet("subscriptions/doctor/{doctorId:int}")]
    [Authorize(Roles = "Patient")]
    public async Task<IActionResult> GetSubscriptionWithDoctor(int doctorId)
    {
        var userId = GetUserId();
        var sub = await _chatService.GetSubscriptionWithDoctorAsync(userId, doctorId);
        // Devolver 200 null en lugar de 404 para evitar errores en consola del frontend
        // cuando el paciente simplemente no tiene suscripción con este médico
        return Ok(sub);
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/chat/checkout  — paciente
    // ─────────────────────────────────────────────────────────────
    [HttpPost("checkout")]
    [Authorize(Roles = "Patient")]
    public async Task<IActionResult> CreateCheckout([FromBody] CreateChatCheckoutDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = GetUserId();

        var ps = _config.GetSection("PaymentSettings");
        var successUrl = ps["SuccessUrl"] ?? "http://localhost:5173/payment/success?session_id={CHECKOUT_SESSION_ID}";
        var cancelUrl  = ps["CancelUrl"]  ?? "http://localhost:5173/payment/cancel";

        try
        {
            var url = await _chatService.CreateCheckoutAsync(userId, dto.DoctorId, dto.ChatPlanId, successUrl, cancelUrl);
            return Ok(new { checkoutUrl = url });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/chat/messages/{subscriptionId}?page=1  — auth
    // ─────────────────────────────────────────────────────────────
    [HttpGet("messages/{subscriptionId:int}")]
    [Authorize]
    public async Task<IActionResult> GetMessages(int subscriptionId, [FromQuery] int page = 1)
    {
        var userId = GetUserId();
        try
        {
            var messages = await _chatService.GetMessagesAsync(subscriptionId, userId, page);
            return Ok(messages);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/chat/messages/{subscriptionId}  — auth (REST fallback)
    // ─────────────────────────────────────────────────────────────
    [HttpPost("messages/{subscriptionId:int}")]
    [Authorize]
    public async Task<IActionResult> SendMessage(int subscriptionId, [FromBody] SendMessageDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = GetUserId();
        var role   = GetUserRole();

        try
        {
            var message = await _chatService.SendMessageAsync(subscriptionId, userId, role, dto.Content);
            return Ok(message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/chat/messages/{subscriptionId}/read  — auth
    // ─────────────────────────────────────────────────────────────
    [HttpPost("messages/{subscriptionId:int}/read")]
    [Authorize]
    public async Task<IActionResult> MarkRead(int subscriptionId)
    {
        var userId = GetUserId();
        try
        {
            await _chatService.MarkMessagesReadAsync(subscriptionId, userId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/chat/session/{sessionId}  — verificar estado tras pago Stripe
    // ─────────────────────────────────────────────────────────────
    [HttpGet("session/{sessionId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetChatSession(string sessionId)
    {
        var sub = await _db.ChatSubscriptions
            .Include(s => s.Plan)
            .Include(s => s.Doctor)
            .FirstOrDefaultAsync(s => s.StripeSessionId == sessionId);

        if (sub == null)
            return NotFound(new { message = "Sesión no encontrada" });

        return Ok(new
        {
            type           = "chat_subscription",
            status         = sub.Status == "Active" ? "Completado" : sub.Status,
            subscriptionId = sub.Id,
            doctorName     = $"{sub.Doctor.FirstName} {sub.Doctor.LastName}",
            planName       = sub.Plan.Name,
            durationDays   = sub.Plan.DurationDays,
            amountPaid     = sub.AmountPaid,
            endDate        = sub.EndDate
        });
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/chat/doctor/subscriptions  — doctor autenticado
    // ─────────────────────────────────────────────────────────────
    [HttpGet("doctor/subscriptions")]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> GetDoctorSubscriptions()
    {
        var userId = GetUserId();

        var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
        if (doctor == null) return NotFound(new { message = "Doctor no encontrado" });

        var subs = await _db.ChatSubscriptions
            .Include(s => s.Plan)
            .Include(s => s.Patient)   // User (para email fallback)
            .Where(s => s.DoctorId == doctor.Id
                     && (s.Status == "Active" || s.Status == "Expired"))
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        // Obtener perfiles de pacientes para nombres reales
        var patientUserIds = subs.Select(s => s.PatientUserId).Distinct().ToList();
        var patientProfiles = await _db.Patients
            .Where(p => patientUserIds.Contains(p.UserId))
            .ToDictionaryAsync(p => p.UserId);

        // Mensajes no leídos por el doctor (enviados por el paciente)
        var subIds = subs.Select(s => s.Id).ToList();
        var unreadCounts = await _db.ChatMessages
            .Where(m => subIds.Contains(m.ChatSubscriptionId)
                     && m.SenderUserId != userId
                     && !m.IsRead)
            .GroupBy(m => m.ChatSubscriptionId)
            .Select(g => new { SubId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.SubId, x => x.Count);

        var result = subs.Select(s =>
        {
            patientProfiles.TryGetValue(s.PatientUserId, out var profile);
            var patientName = profile != null
                ? $"{profile.FirstName} {profile.LastName}"
                : s.Patient.Email;

            return new
            {
                s.Id,
                s.PatientUserId,
                PatientName = patientName,
                PlanName = s.Plan.Name,
                s.AmountPaid,
                s.StartDate,
                s.EndDate,
                s.Status,
                IsReadOnly = s.Status == "Expired",
                UnreadCount = unreadCounts.TryGetValue(s.Id, out var c) ? c : 0
            };
        });

        return Ok(result);
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/chat/doctor/subscriptions/{subscriptionId}  — doctor
    // Permite al doctor acceder a una suscripción específica para abrir el chat
    // ─────────────────────────────────────────────────────────────
    [HttpGet("doctor/subscriptions/{subscriptionId:int}")]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> GetDoctorSubscriptionById(int subscriptionId)
    {
        var userId = GetUserId();

        var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
        if (doctor == null) return NotFound(new { message = "Doctor no encontrado" });

        var sub = await _db.ChatSubscriptions
            .Include(s => s.Plan)
            .Include(s => s.Patient)   // User
            .FirstOrDefaultAsync(s => s.Id == subscriptionId && s.DoctorId == doctor.Id);

        if (sub == null)
            return NotFound(new { message = "Suscripción no encontrada o no pertenece a este doctor" });

        // Nombre real del paciente
        var patientProfile = await _db.Patients.FirstOrDefaultAsync(p => p.UserId == sub.PatientUserId);
        var patientName = patientProfile != null
            ? $"{patientProfile.FirstName} {patientProfile.LastName}"
            : sub.Patient.Email;

        // Mensajes no leídos por el doctor
        var unreadCount = await _db.ChatMessages
            .CountAsync(m => m.ChatSubscriptionId == subscriptionId
                          && m.SenderUserId != userId
                          && !m.IsRead);

        return Ok(new
        {
            sub.Id,
            sub.DoctorId,
            DoctorName       = $"{doctor.FirstName} {doctor.LastName}",
            sub.PatientUserId,
            PatientName      = patientName,
            PlanName         = sub.Plan.Name,
            sub.AmountPaid,
            sub.StartDate,
            sub.EndDate,
            sub.Status,
            IsReadOnly       = sub.Status == "Expired",
            UnreadCount      = unreadCount
        });
    }

    // ─── Helpers ─────────────────────────────────────────────

    private int GetUserId()
    {
        var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(value, out var id))
            throw new UnauthorizedAccessException("No autenticado");
        return id;
    }

    private string GetUserRole()
    {
        return User.FindFirst(ClaimTypes.Role)?.Value ?? "Patient";
    }
}
