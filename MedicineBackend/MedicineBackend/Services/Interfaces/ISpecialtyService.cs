using MedicineBackend.DTOs;

namespace MedicineBackend.Services
{
    public interface ISpecialtyService
    {
        Task<List<SpecialtyDto>> GetAllAsync();
        Task<List<SpecialtyDto>> GetAllIncludingDeletedAsync(); // Admin: ver todas
        Task<List<SpecialtyDto>> GetActiveAsync();
        Task<SpecialtyDto?> GetByIdAsync(int id);
        Task<SpecialtyDto> CreateAsync(CreateSpecialtyDto dto);
        Task<SpecialtyDto> UpdateAsync(int id, UpdateSpecialtyDto dto);
        Task<SpecialtyDto> SoftDeleteAsync(int id);
        Task<SpecialtyDto> RestoreAsync(int id);
        Task<SpecialtyDto> ToggleActiveAsync(int id);
    }
}