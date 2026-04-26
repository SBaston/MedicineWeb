// ═══════════════════════════════════════════════════════════════
// Services/Interfaces/IReviewService.cs
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.DTOs.Reviews;

namespace MedicineBackend.Services.Interfaces;

public interface IReviewService
{
    /// <summary>Reseñas visibles de un profesional (público).</summary>
    Task<List<ReviewDto>> GetDoctorReviewsAsync(int doctorId);

    /// <summary>
    /// Citas completadas del paciente con este doctor que aún no tienen reseña.
    /// Si la lista está vacía, el paciente no puede escribir una reseña.
    /// </summary>
    Task<List<EligibleAppointmentDto>> GetEligibleAppointmentsAsync(int patientId, int doctorId);

    /// <summary>Crea una reseña. Lanza si el paciente no es elegible.</summary>
    Task<ReviewDto> CreateReviewAsync(int patientId, CreateReviewDto dto);
}
