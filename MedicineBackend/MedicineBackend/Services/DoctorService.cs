using MedicineBackend.Data;
using MedicineBackend.DTOs.Doctor;
using MedicineBackend.Models;
using MedicineBackend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MedicineBackend.Services;

/// <summary>
/// Servicio para gestionar doctores con soporte de caché
/// ✅ ACTUALIZADO: Con soporte para términos y redes sociales
/// </summary>
public class DoctorService : IDoctorService
{
    private readonly AppDbContext _context;
    private readonly ICacheService _cache;
    private readonly ILogger<DoctorService> _logger;

    // Claves de caché
    private const string AllDoctorsCacheKey = "doctors:all";
    private const string DoctorByIdCacheKeyPrefix = "doctor:";
    private const string DoctorsBySpecialtyCacheKeyPrefix = "doctors:specialty:";

    public DoctorService(
        AppDbContext context,
        ICacheService cache,
        ILogger<DoctorService> logger)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
    }

    // ✅ ACTUALIZADO: Recibe IP y UserAgent
    public async Task<Doctor> RegisterAsync(
        CreateDoctorRequest request,
        string ipAddress,
        string userAgent)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // ✅ NUEVO: Validar aceptación de términos
            if (!request.AcceptContentTerms)
            {
                throw new InvalidOperationException("Debes aceptar los términos de publicación de contenido para completar el registro");
            }

            // 1. Crear usuario
            var user = new User
            {
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = "Doctor",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // 2. Obtener especialidades
            var specialties = await _context.Specialties
                .Where(s => request.SpecialtyIds.Contains(s.Id))
                .ToListAsync();

            if (specialties.Count != request.SpecialtyIds.Count)
            {
                throw new InvalidOperationException("Una o más especialidades no son válidas");
            }

            // 3. Crear doctor
            var doctor = new Doctor
            {
                UserId = user.Id,
                FirstName = request.FirstName,
                LastName = request.LastName,
                ProfessionalLicense = request.ProfessionalLicense,
                YearsOfExperience = request.YearsOfExperience,
                PricePerSession = request.PricePerSession,
                Description = request.Description,
                PhoneNumber = request.PhoneNumber,
                ProfilePictureUrl = request.ProfilePictureUrl,
                Status = DoctorStatus.PendingReview,
                HasAcceptedContentTerms = true, // ✅ NUEVO

                // 6 IMÁGENES
                ProfessionalLicenseFrontImageUrl = request.ProfessionalLicenseFrontImageUrl,
                ProfessionalLicenseBackImageUrl = request.ProfessionalLicenseBackImageUrl,
                IdDocumentFrontImageUrl = request.IdDocumentFrontImageUrl,
                IdDocumentBackImageUrl = request.IdDocumentBackImageUrl,
                SpecialtyDegreeImageUrl = request.SpecialtyDegreeImageUrl,
                UniversityDegreeImageUrl = request.UniversityDegreeImageUrl,

                Specialties = specialties,
                CreatedAt = DateTime.UtcNow
            };

            _context.Doctors.Add(doctor);
            await _context.SaveChangesAsync();

            // ✅ NUEVO: Crear registro de consentimiento de contenido
            var consent = new DoctorContentConsent
            {
                DoctorId = doctor.Id,
                TermsVersion = request.TermsVersion,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                HasAccepted = true,
                AcceptedAt = DateTime.UtcNow
            };

            _context.DoctorContentConsents.Add(consent);
            await _context.SaveChangesAsync();

            // ✅ NUEVO: Crear redes sociales si las proporcionó
            if (request.SocialMediaLinks != null && request.SocialMediaLinks.Any())
            {
                foreach (var link in request.SocialMediaLinks)
                {
                    var socialMedia = new DoctorSocialMedia
                    {
                        DoctorId = doctor.Id,
                        Platform = link.Platform,
                        ProfileUrl = link.ProfileUrl,
                        FollowerCount = link.FollowerCount,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.DoctorSocialMedias.Add(socialMedia);
                }

                await _context.SaveChangesAsync();
            }

            await transaction.CommitAsync();

            _logger.LogInformation(
                "✅ Doctor registrado: {Name} ({Email}) - ID: {Id} - Estado: {Status} - " +
                "Términos v{TermsVersion} aceptados desde IP {IP} - Redes sociales: {SocialCount}",
                doctor.FullName, request.Email, doctor.Id, doctor.Status,
                request.TermsVersion, ipAddress, request.SocialMediaLinks?.Count ?? 0);

            return doctor;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "❌ Error al registrar doctor: {Email}", request.Email);
            throw;
        }
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        return await _context.Users
            .AnyAsync(u => u.Email.ToLower() == email.ToLower());
    }

    /// <summary>
    /// ✅ SISTEMA SIMPLIFICADO: Valida si un email está disponible
    /// Si el doctor fue rechazado y eliminado, el email estará disponible automáticamente
    /// </summary>
    public async Task<EmailAvailabilityResult> CheckEmailAvailabilityAsync(string email)
    {
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());

        // Email no existe → Disponible
        if (existingUser == null)
        {
            return EmailAvailabilityResult.Available();
        }

        // Email existe → No disponible
        // (Si fue rechazado y eliminado, el User ya no existe, así que no llegaría aquí)
        return EmailAvailabilityResult.Unavailable("El email ya está registrado");
    }

    public async Task<bool> ProfessionalLicenseExistsAsync(string professionalLicense)
    {
        return await _context.Doctors
            .AnyAsync(d => d.ProfessionalLicense == professionalLicense && d.DeletedAt == null);
    }

    public async Task<List<Doctor>> GetAllDoctorsAsync()
    {
        var cachedDoctors = await _cache.GetAsync<List<Doctor>>(AllDoctorsCacheKey);

        if (cachedDoctors != null)
        {
            _logger.LogInformation("Doctores obtenidos desde caché");
            return cachedDoctors;
        }

        _logger.LogInformation("Doctores obtenidos desde base de datos");
        var doctors = await _context.Doctors
            .Include(d => d.Specialties)
            .Include(d => d.User)
            .Where(d => d.Status == DoctorStatus.Active && d.DeletedAt == null && d.IsAcceptingPatients)
            .OrderByDescending(d => d.AverageRating)
            .ToListAsync();

        await _cache.SetAsync(AllDoctorsCacheKey, doctors, TimeSpan.FromMinutes(10));

        return doctors;
    }

    public async Task<Doctor?> GetDoctorByIdAsync(int id)
    {
        var cacheKey = $"{DoctorByIdCacheKeyPrefix}{id}";

        var cachedDoctor = await _cache.GetAsync<Doctor>(cacheKey);

        if (cachedDoctor != null)
        {
            _logger.LogInformation("Doctor {DoctorId} obtenido desde caché", id);
            return cachedDoctor;
        }

        _logger.LogInformation("Doctor {DoctorId} obtenido desde base de datos", id);
        var doctor = await _context.Doctors
            .Include(d => d.Specialties)
            .Include(d => d.User)
            .Include(d => d.SocialMediaVideos)
            .Include(d => d.Reviews)
            .Include(d => d.Availabilities)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (doctor != null)
        {
            await _cache.SetAsync(cacheKey, doctor, TimeSpan.FromMinutes(30));
        }

        return doctor;
    }

    public async Task<List<Doctor>> GetDoctorsBySpecialtyAsync(int specialtyId)
    {
        var cacheKey = $"{DoctorsBySpecialtyCacheKeyPrefix}{specialtyId}";

        var cachedDoctors = await _cache.GetAsync<List<Doctor>>(cacheKey);

        if (cachedDoctors != null)
        {
            _logger.LogInformation("Doctores de especialidad {SpecialtyId} obtenidos desde caché", specialtyId);
            return cachedDoctors;
        }

        _logger.LogInformation("Doctores de especialidad {SpecialtyId} obtenidos desde base de datos", specialtyId);
        var doctors = await _context.Doctors
            .Include(d => d.Specialties)
            .Include(d => d.User)
            .Where(d => d.Specialties.Any(s => s.Id == specialtyId)
                     && d.Status == DoctorStatus.Active
                     && d.DeletedAt == null
                     && d.IsAcceptingPatients)
            .OrderByDescending(d => d.AverageRating)
            .ToListAsync();

        await _cache.SetAsync(cacheKey, doctors, TimeSpan.FromMinutes(15));

        return doctors;
    }

    public async Task<Doctor> UpdateDoctorAsync(int id, Doctor updatedDoctor)
    {
        var doctor = await _context.Doctors.FindAsync(id);

        if (doctor == null)
        {
            throw new KeyNotFoundException($"Doctor con ID {id} no encontrado");
        }

        doctor.FirstName = updatedDoctor.FirstName;
        doctor.LastName = updatedDoctor.LastName;
        doctor.Description = updatedDoctor.Description;
        doctor.PricePerSession = updatedDoctor.PricePerSession;
        doctor.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await InvalidateDoctorCache(id);

        _logger.LogInformation("Doctor {DoctorId} actualizado y caché invalidado", id);

        return doctor;
    }

    private async Task InvalidateDoctorCache(int doctorId)
    {
        await _cache.RemoveAsync($"{DoctorByIdCacheKeyPrefix}{doctorId}");
        await _cache.RemoveAsync(AllDoctorsCacheKey);
        _logger.LogDebug("Caché invalidado para doctor {DoctorId}", doctorId);
    }
}