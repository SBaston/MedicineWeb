// ═══════════════════════════════════════════════════════════════
// Services/IProfessionalService.cs
// Interfaz para búsqueda pública de profesionales
// ═══════════════════════════════════════════════════════════════


using MedicineBackend.Data;
using MedicineBackend.DTOs.Professional;

namespace MedicineBackend.Services.Interfaces;

public interface IProfessionalService
{
    Task<List<ProfessionalSearchDto>> SearchProfessionalsAsync(
        string? search, string? specialty, decimal? minRating, decimal? maxPrice, string sortBy);
    Task<ProfessionalDetailDto?> GetProfessionalByIdAsync(int id);
    Task<List<ProfessionalVideoDto>> GetProfessionalVideosAsync(int doctorId);
    Task<object> GetProfessionalReviewsAsync(int doctorId);
    Task<object> GetProfessionalAvailabilityAsync(int doctorId);
}





