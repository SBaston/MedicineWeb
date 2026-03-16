using MedicineBackend.DTOs.DoctorDTO;
using Microsoft.AspNetCore.Http;

namespace MedicineBackend.Services.Interfaces
{
    public interface IDoctorDashboardService
    {
        Task<DoctorDashboardStatsDto> GetDashboardStatsAsync(int doctorId);
        Task<DoctorProfileDto> GetProfileAsync(int doctorId);
        Task<DoctorProfileDto> UpdateProfileAsync(int doctorId, UpdateDoctorProfileDto dto);
        Task<string> UploadProfilePictureAsync(int doctorId, IFormFile file);
        Task<List<DoctorAvailabilityDto>> GetAvailabilitiesAsync(int doctorId);
        Task<DoctorAvailabilityDto> CreateAvailabilityAsync(int doctorId, CreateAvailabilityDto dto);
        Task<DoctorAvailabilityDto> UpdateAvailabilityAsync(int doctorId, int availabilityId, UpdateAvailabilityDto dto);
        Task DeleteAvailabilityAsync(int doctorId, int availabilityId);
        Task<List<SocialMediaVideoDto>> GetVideosAsync(int doctorId);
        Task<SocialMediaVideoDto> CreateVideoAsync(int doctorId, CreateVideoDto dto);
        Task<SocialMediaVideoDto> UpdateVideoAsync(int doctorId, int videoId, UpdateVideoDto dto);
        Task DeleteVideoAsync(int doctorId, int videoId);
        Task<SocialMediaVideoDto> ToggleVideoStatusAsync(int doctorId, int videoId);
        Task<DoctorEarningsDto> GetEarningsAsync(int doctorId, string timeRange, string filterType);
        Task<DoctorPricingDto> GetPricingAsync(int doctorId);
        Task<DoctorPricingDto> UpdatePricingAsync(int doctorId, UpdatePricingDto dto);
    }
}
