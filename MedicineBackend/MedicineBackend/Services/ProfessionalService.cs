// ═══════════════════════════════════════════════════════════════
// Services/ProfessionalService.cs
// Servicio para búsqueda pública de profesionales
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.Data;
using MedicineBackend.DTOs.Professional;
using MedicineBackend.Models;
using MedicineBackend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MedicineBackend.Services;



public class ProfessionalService : IProfessionalService
{
    private readonly AppDbContext _context;

    public ProfessionalService(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Buscar profesionales con filtros
    /// </summary>
    public async Task<List<ProfessionalSearchDto>> SearchProfessionalsAsync(
        string? search,
        string? specialty,
        decimal? minRating,
        decimal? maxPrice,
        string sortBy)
    {
        var query = _context.Doctors
            .Include(d => d.User)
            .Include(d => d.Specialties) // ✅ Relación directa Specialties
            .Where(d => d.Status == DoctorStatus.Active && d.DeletedAt == null); // Solo doctores activos

        // Filtro por búsqueda de texto
        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(d =>
                d.FirstName.ToLower().Contains(searchLower) ||
                d.LastName.ToLower().Contains(searchLower) ||
                d.Description != null && d.Description.ToLower().Contains(searchLower) ||
                d.Specialties.Any(s => s.Name.ToLower().Contains(searchLower))
            );
        }

        // Filtro por especialidad
        if (!string.IsNullOrEmpty(specialty))
        {
            query = query.Where(d =>
                d.Specialties.Any(s => s.Name == specialty));
        }

        // Filtro por rating mínimo
        if (minRating.HasValue)
        {
            query = query.Where(d => d.AverageRating >= minRating.Value);
        }

        // Filtro por precio máximo
        if (maxPrice.HasValue)
        {
            query = query.Where(d => d.PricePerSession <= maxPrice.Value);
        }

        // Ordenamiento
        query = sortBy.ToLower() switch
        {
            "price_asc" => query.OrderBy(d => d.PricePerSession),
            "price_desc" => query.OrderByDescending(d => d.PricePerSession),
            "experience" => query.OrderByDescending(d => d.YearsOfExperience),
            "content" => query.OrderByDescending(d => d.SocialMediaVideos.Count), // Ordenar por cantidad de videos
            _ => query.OrderByDescending(d => d.AverageRating) // rating por defecto
        };

        var results = await query
            .Select(d => new ProfessionalSearchDto
            {
                Id = d.Id,
                FirstName = d.FirstName,
                LastName = d.LastName,
                ProfilePictureUrl = d.ProfilePictureUrl,
                Specialties = d.Specialties.Select(s => new SpecialtyDto
                {
                    Id = s.Id,
                    Name = s.Name
                }).ToList(),
                Description = d.Description,
                PricePerSession = d.PricePerSession,
                AverageRating = d.AverageRating,
                TotalReviews = d.TotalReviews,
                YearsOfExperience = d.YearsOfExperience ?? 0,
                IsAcceptingPatients = d.IsAcceptingPatients
            })
            .ToListAsync();

        return results;
    }

    /// <summary>
    /// Obtener detalles completos de un profesional
    /// </summary>
    public async Task<ProfessionalDetailDto?> GetProfessionalByIdAsync(int id)
    {
        var doctor = await _context.Doctors
            .Include(d => d.User)
            .Include(d => d.Specialties)
            .Include(d => d.SocialMediaAccounts)
            .Where(d => d.Id == id && d.Status == DoctorStatus.Active && d.DeletedAt == null)
            .Select(d => new ProfessionalDetailDto
            {
                Id = d.Id,
                FirstName = d.FirstName,
                LastName = d.LastName,
                Email = d.User.Email,
                ProfilePictureUrl = d.ProfilePictureUrl,
                PhoneNumber = d.PhoneNumber,
                Specialties = d.Specialties.Select(s => new SpecialtyDto
                {
                    Id = s.Id,
                    Name = s.Name
                }).ToList(),
                Description = d.Description,
                PricePerSession = d.PricePerSession,
                YearsOfExperience = d.YearsOfExperience ?? 0,
                AverageRating = d.AverageRating,
                TotalReviews = d.TotalReviews,
                IsAcceptingPatients = d.IsAcceptingPatients,
                SocialMedia = d.SocialMediaAccounts
                    .Where(s => s.IsActive)
                    .Select(s => new SocialMediaDto
                    {
                        Platform = s.Platform.ToString(),
                        ProfileUrl = s.ProfileUrl,
                        FollowerCount = s.FollowerCount,
                        IsActive = s.IsActive
                    }).ToList(),
                CreatedAt = d.CreatedAt
            })
            .FirstOrDefaultAsync();

        return doctor;
    }

    /// <summary>
    /// Obtener videos publicados de un profesional
    /// </summary>
    public async Task<List<ProfessionalVideoDto>> GetProfessionalVideosAsync(int doctorId)
    {
        var videos = await _context.SocialMediaVideos
            .Where(v => v.DoctorId == doctorId)
            .OrderByDescending(v => v.CreatedAt)
            .Select(v => new ProfessionalVideoDto
            {
                Id = v.Id,
                Title = v.Title,
                Description = v.Description,
                VideoUrl = v.VideoUrl,
                Platform = v.Platform.ToString(),
                CreatedAt = v.CreatedAt
            })
            .ToListAsync();

        return videos;
    }

    /// <summary>
    /// Obtener reseñas de un profesional (placeholder)
    /// </summary>
    public async Task<object> GetProfessionalReviewsAsync(int doctorId)
    {
        // TODO: Implementar cuando exista el modelo de reviews
        await Task.CompletedTask;
        return new List<object>();
    }

    /// <summary>
    /// Obtener disponibilidad de un profesional (placeholder)
    /// </summary>
    public async Task<object> GetProfessionalAvailabilityAsync(int doctorId)
    {
        // TODO: Implementar cuando exista el modelo de disponibilidad
        await Task.CompletedTask;
        return new { message = "Disponibilidad no implementada aún" };
    }

    /// <summary>
    /// Obtener redes sociales públicas activas de un profesional
    /// </summary>
    public async Task<List<SocialMediaDto>> GetProfessionalSocialMediaAsync(int doctorId)
    {
        return await _context.DoctorSocialMedias
            .Where(s => s.DoctorId == doctorId && s.IsActive)
            .OrderBy(s => s.Platform)
            .Select(s => new SocialMediaDto
            {
                Platform      = s.Platform,
                ProfileUrl    = s.ProfileUrl,
                FollowerCount = s.FollowerCount,
                IsActive      = s.IsActive
            })
            .ToListAsync();
    }
}