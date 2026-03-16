// ═══════════════════════════════════════════════════════════════
// Services/CourseService.cs
// Servicio para gestionar cursos del doctor
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.Data;
using MedicineBackend.DTOs.DoctorDTO;
using MedicineBackend.Models;
using Microsoft.AspNetCore.Hosting;
using MedicineBackend.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace MedicineBackend.Services;


public class CourseService : ICourseService
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public CourseService(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    public async Task<List<CourseDto>> GetDoctorCoursesAsync(int doctorId)
    {
        var courses = await _context.Courses
            .Include(c => c.Modules)
            .Include(c => c.Enrollments)
            .Where(c => c.DoctorId == doctorId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return courses.Select(c => MapToDto(c)).ToList();
    }

    public async Task<CourseDto> GetCourseAsync(int courseId)
    {
        var course = await _context.Courses
            .Include(c => c.Modules.OrderBy(m => m.OrderIndex))
            .Include(c => c.Enrollments)
            .FirstOrDefaultAsync(c => c.Id == courseId)
            ?? throw new KeyNotFoundException("Curso no encontrado");

        return MapToDto(course);
    }

    public async Task<CourseDto> CreateCourseAsync(int doctorId, CreateCourseDto dto)
    {
        var course = new Course
        {
            DoctorId = doctorId,
            Title = dto.Title,
            Description = dto.Description,
            Price = dto.Price,
            Level = dto.Level,
            Category = dto.Category,
            DurationHours = dto.DurationHours,
            Language = dto.Language ?? "Español",
            Prerequisites = dto.Prerequisites,
            LearningObjectives = dto.LearningObjectives,
            IsPublished = false,
            IsVerified = false
        };

        _context.Courses.Add(course);
        await _context.SaveChangesAsync();

        return MapToDto(course);
    }

    public async Task<CourseDto> UpdateCourseAsync(int doctorId, int courseId, UpdateCourseDto dto)
    {
        var course = await _context.Courses
            .FirstOrDefaultAsync(c => c.Id == courseId && c.DoctorId == doctorId)
            ?? throw new KeyNotFoundException("Curso no encontrado");

        course.Title = dto.Title;
        course.Description = dto.Description;
        course.Price = dto.Price;
        course.Level = dto.Level;
        course.Category = dto.Category;
        course.DurationHours = dto.DurationHours;
        course.Prerequisites = dto.Prerequisites;
        course.LearningObjectives = dto.LearningObjectives;
        course.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetCourseAsync(courseId);
    }

    public async Task DeleteCourseAsync(int doctorId, int courseId)
    {
        var course = await _context.Courses
            .Include(c => c.Modules)
            .FirstOrDefaultAsync(c => c.Id == courseId && c.DoctorId == doctorId)
            ?? throw new KeyNotFoundException("Curso no encontrado");

        var hasEnrollments = await _context.CourseEnrollments
            .AnyAsync(e => e.CourseId == courseId);

        if (hasEnrollments)
        {
            throw new InvalidOperationException("No se puede eliminar un curso con estudiantes inscritos");
        }

        _context.Courses.Remove(course);
        await _context.SaveChangesAsync();
    }

    public async Task<CourseDto> PublishCourseAsync(int doctorId, int courseId)
    {
        var course = await _context.Courses
            .Include(c => c.Modules)
            .FirstOrDefaultAsync(c => c.Id == courseId && c.DoctorId == doctorId)
            ?? throw new KeyNotFoundException("Curso no encontrado");

        if (!course.Modules.Any())
        {
            throw new InvalidOperationException("El curso debe tener al menos un módulo");
        }

        course.IsPublished = true;
        course.PublishedAt = DateTime.UtcNow;
        course.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(course);
    }

    public async Task<string> UploadCoverImageAsync(int courseId, IFormFile file)
    {
        var course = await _context.Courses.FindAsync(courseId)
            ?? throw new KeyNotFoundException("Curso no encontrado");

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(extension))
        {
            throw new InvalidOperationException("Formato de archivo no permitido");
        }

        if (file.Length > 5 * 1024 * 1024)
        {
            throw new InvalidOperationException("El archivo es demasiado grande (máx 5MB)");
        }

        var uploadsPath = Path.Combine(_env.WebRootPath, "uploads", "courses", "covers");
        Directory.CreateDirectory(uploadsPath);

        var fileName = $"{courseId}_{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsPath, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        if (!string.IsNullOrEmpty(course.CoverImageUrl))
        {
            var oldFilePath = Path.Combine(_env.WebRootPath, course.CoverImageUrl.TrimStart('/'));
            if (File.Exists(oldFilePath))
            {
                File.Delete(oldFilePath);
            }
        }

        course.CoverImageUrl = $"/uploads/courses/covers/{fileName}";
        course.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return course.CoverImageUrl;
    }

    public async Task<CourseModuleDto> CreateModuleAsync(int doctorId, int courseId, CreateCourseModuleDto dto)
    {
        var course = await _context.Courses
            .FirstOrDefaultAsync(c => c.Id == courseId && c.DoctorId == doctorId)
            ?? throw new KeyNotFoundException("Curso no encontrado");

        var maxOrder = await _context.CourseModules
            .Where(m => m.CourseId == courseId)
            .MaxAsync(m => (int?)m.OrderIndex) ?? -1;

        var module = new CourseModule
        {
            CourseId = courseId,
            Title = dto.Title,
            Content = dto.Content,
            VideoUrl = dto.VideoUrl,
            VideoDurationMinutes = dto.VideoDurationMinutes,
            OrderIndex = maxOrder + 1,
            IsFree = dto.IsFree,
            IsPublished = true
        };

        _context.CourseModules.Add(module);
        await _context.SaveChangesAsync();

        return new CourseModuleDto
        {
            Id = module.Id,
            Title = module.Title,
            Content = module.Content,
            VideoUrl = module.VideoUrl,
            VideoDurationMinutes = module.VideoDurationMinutes,
            OrderIndex = module.OrderIndex,
            IsFree = module.IsFree
        };
    }

    public async Task<CourseModuleDto> UpdateModuleAsync(int doctorId, int courseId, int moduleId, UpdateCourseModuleDto dto)
    {
        var module = await _context.CourseModules
            .Include(m => m.Course)
            .FirstOrDefaultAsync(m => m.Id == moduleId && m.CourseId == courseId && m.Course.DoctorId == doctorId)
            ?? throw new KeyNotFoundException("Módulo no encontrado");

        module.Title = dto.Title;
        module.Content = dto.Content;
        module.VideoUrl = dto.VideoUrl;
        module.VideoDurationMinutes = dto.VideoDurationMinutes;
        module.IsFree = dto.IsFree;
        module.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new CourseModuleDto
        {
            Id = module.Id,
            Title = module.Title,
            Content = module.Content,
            VideoUrl = module.VideoUrl,
            VideoDurationMinutes = module.VideoDurationMinutes,
            OrderIndex = module.OrderIndex,
            IsFree = module.IsFree
        };
    }

    public async Task DeleteModuleAsync(int doctorId, int courseId, int moduleId)
    {
        var module = await _context.CourseModules
            .Include(m => m.Course)
            .FirstOrDefaultAsync(m => m.Id == moduleId && m.CourseId == courseId && m.Course.DoctorId == doctorId)
            ?? throw new KeyNotFoundException("Módulo no encontrado");

        _context.CourseModules.Remove(module);
        await _context.SaveChangesAsync();
    }

    private CourseDto MapToDto(Course course)
    {
        return new CourseDto
        {
            Id = course.Id,
            Title = course.Title,
            Description = course.Description,
            Price = course.Price,
            CoverImageUrl = course.CoverImageUrl,
            Level = course.Level,
            Category = course.Category,
            DurationHours = course.DurationHours,
            Language = course.Language,
            Prerequisites = course.Prerequisites,
            LearningObjectives = course.LearningObjectives,
            IsPublished = course.IsPublished,
            IsVerified = course.IsVerified,
            TotalEnrollments = course.TotalEnrollments,
            AverageRating = course.AverageRating,
            TotalRatings = course.TotalRatings,
            CreatedAt = course.CreatedAt.ToString("yyyy-MM-dd"),
            PublishedAt = course.PublishedAt?.ToString("yyyy-MM-dd"),
            Modules = course.Modules?.Select(m => new CourseModuleDto
            {
                Id = m.Id,
                Title = m.Title,
                Content = m.Content,
                VideoUrl = m.VideoUrl,
                VideoDurationMinutes = m.VideoDurationMinutes,
                OrderIndex = m.OrderIndex,
                IsFree = m.IsFree
            }).ToList() ?? new List<CourseModuleDto>()
        };
    }
}