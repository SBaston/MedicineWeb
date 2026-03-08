using MedicineBackend.DTOs;

namespace MedicineBackend.Services
{
    public interface ISpecialtyService
    {
        Task<List<SpecialtyDto>> GetAllAsync();
        Task<List<SpecialtyDto>> GetActiveAsync();
        Task<SpecialtyDto?> GetByIdAsync(int id);
        Task<SpecialtyDto> CreateAsync(CreateSpecialtyDto dto);
        Task<SpecialtyDto> UpdateAsync(int id, UpdateSpecialtyDto dto);
        Task<bool> DeleteAsync(int id);
        Task<SpecialtyDto> ToggleActiveAsync(int id);
    }
}