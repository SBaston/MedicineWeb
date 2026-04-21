// ═══════════════════════════════════════════════════════════════
// Services/Interfaces/IPaymentService.cs
// ═══════════════════════════════════════════════════════════════

namespace MedicineBackend.Services.Interfaces;

public interface IPaymentService
{
    /// <summary>
    /// Crea una sesión de Stripe Checkout para pagar una cita.
    /// Guarda un Payment pendiente y devuelve la URL de Stripe.
    /// </summary>
    Task<string> CreateAppointmentCheckoutAsync(int patientUserId, int doctorId, int appointmentId, decimal price);

    /// <summary>
    /// Crea una sesión de Stripe Checkout para matricularse en un curso.
    /// Devuelve la URL de Stripe.
    /// </summary>
    Task<string> CreateCourseCheckoutAsync(int userId, string role, int courseId, decimal price);

    /// <summary>
    /// Procesa el evento de webhook de Stripe (checkout.session.completed).
    /// Marca el Payment como Completado y activa la cita o matrícula.
    /// </summary>
    Task HandleWebhookAsync(string payload, string stripeSignature);
}
