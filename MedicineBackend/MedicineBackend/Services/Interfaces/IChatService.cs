using MedicineBackend.DTOs.Chat;

namespace MedicineBackend.Services.Interfaces;

public interface IChatService
{
    // ── Planes (público / paciente) ───────────────────────────
    Task<List<ChatPlanDto>> GetActivePlansAsync();

    // ── Suscripciones ─────────────────────────────────────────
    Task<List<ChatSubscriptionDto>> GetPatientSubscriptionsAsync(int patientUserId);
    Task<ChatSubscriptionDto?> GetSubscriptionWithDoctorAsync(int patientUserId, int doctorId);

    // ── Mensajes ──────────────────────────────────────────────
    Task<List<ChatMessageDto>> GetMessagesAsync(int subscriptionId, int requestingUserId, int page = 1, int pageSize = 50);
    Task<ChatMessageDto> SendMessageAsync(int subscriptionId, int senderUserId, string senderRole, string content);
    Task MarkMessagesReadAsync(int subscriptionId, int readerUserId);

    // ── Checkout / Stripe ─────────────────────────────────────
    Task<string> CreateCheckoutAsync(int patientUserId, int doctorId, int planId, string successUrl, string cancelUrl);
    Task ActivateSubscriptionAsync(string stripeSessionId);

    // ── Admin ─────────────────────────────────────────────────
    Task<List<ChatPlanDto>> GetAllPlansAsync();
    Task<ChatPlanDto> CreatePlanAsync(CreateChatPlanDto dto);
    Task<ChatPlanDto> UpdatePlanAsync(int id, UpdateChatPlanDto dto);
    Task DeactivatePlanAsync(int id);

    // ── Tarea periódica ───────────────────────────────────────
    Task ExpireOldSubscriptionsAsync();
}
