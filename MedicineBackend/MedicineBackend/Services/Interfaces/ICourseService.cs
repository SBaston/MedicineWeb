// ═══════════════════════════════════════════════════════════════
// Services/Interfaces/ICourseService.cs
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.DTOs.DoctorDTO;
using Microsoft.AspNetCore.Http;

namespace MedicineBackend.Services.Interfaces
{
    public interface ICourseService
    {
        Task<List<CourseDto>> GetDoctorCoursesAsync(int doctorId);
        Task<CourseDto> GetCourseAsync(int courseId);
        Task<CourseDto> CreateCourseAsync(int doctorId, CreateCourseDto dto);
        Task<CourseDto> UpdateCourseAsync(int doctorId, int courseId, UpdateCourseDto dto);
        Task DeleteCourseAsync(int doctorId, int courseId);
        Task<CourseDto> PublishCourseAsync(int doctorId, int courseId);
        Task<CourseDto> UnpublishCourseAsync(int doctorId, int courseId);
        Task<string> UploadCoverImageAsync(int courseId, IFormFile file);
        Task<string> UploadCourseContentFileAsync(int courseId, IFormFile file);
        Task<CourseModuleDto> CreateModuleAsync(int doctorId, int courseId, CreateCourseModuleDto dto);
        Task<CourseModuleDto> UpdateModuleAsync(int doctorId, int courseId, int moduleId, UpdateCourseModuleDto dto);
        Task DeleteModuleAsync(int doctorId, int courseId, int moduleId);
    }
}