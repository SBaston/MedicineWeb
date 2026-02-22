using MedicineBackend.Data;
using MedicineBackend.Models;
using MedicineBackend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;



/// <summary>
/// Servicio para gestionar doctores con soporte de caché
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

    /// <summary>
    /// Obtiene todos los doctores (con caché)
    /// </summary>
    public async Task<List<Doctor>> GetAllDoctorsAsync()
    {
        // 1. Intentar obtener del caché
        var cachedDoctors = await _cache.GetAsync<List<Doctor>>(AllDoctorsCacheKey);

        if (cachedDoctors != null)
        {
            _logger.LogInformation("Doctores obtenidos desde caché");
            return cachedDoctors;
        }

        // 2. Si no está en caché, obtener de la base de datos
        _logger.LogInformation("Doctores obtenidos desde base de datos");
        var doctors = await _context.Doctors
            .Include(d => d.Specialties)
            .Include(d => d.User)
            .Where(d => d.IsVerified && d.IsAcceptingPatients)
            .OrderByDescending(d => d.AverageRating)
            .ToListAsync();

        // 3. Guardar en caché por 10 minutos
        await _cache.SetAsync(AllDoctorsCacheKey, doctors, TimeSpan.FromMinutes(10));

        return doctors;
    }

    /// <summary>
    /// Obtiene un doctor por ID (con caché)
    /// </summary>
    public async Task<Doctor?> GetDoctorByIdAsync(int id)
    {
        var cacheKey = $"{DoctorByIdCacheKeyPrefix}{id}";

        // 1. Intentar obtener del caché
        var cachedDoctor = await _cache.GetAsync<Doctor>(cacheKey);

        if (cachedDoctor != null)
        {
            _logger.LogInformation("Doctor {DoctorId} obtenido desde caché", id);
            return cachedDoctor;
        }

        // 2. Obtener de la base de datos
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
            // 3. Guardar en caché por 30 minutos
            await _cache.SetAsync(cacheKey, doctor, TimeSpan.FromMinutes(30));
        }

        return doctor;
    }

    /// <summary>
    /// Obtiene doctores por especialidad (con caché)
    /// </summary>
    public async Task<List<Doctor>> GetDoctorsBySpecialtyAsync(int specialtyId)
    {
        var cacheKey = $"{DoctorsBySpecialtyCacheKeyPrefix}{specialtyId}";

        // 1. Intentar obtener del caché
        var cachedDoctors = await _cache.GetAsync<List<Doctor>>(cacheKey);

        if (cachedDoctors != null)
        {
            _logger.LogInformation("Doctores de especialidad {SpecialtyId} obtenidos desde caché", specialtyId);
            return cachedDoctors;
        }

        // 2. Obtener de la base de datos
        _logger.LogInformation("Doctores de especialidad {SpecialtyId} obtenidos desde base de datos", specialtyId);
        var doctors = await _context.Doctors
            .Include(d => d.Specialties)
            .Include(d => d.User)
            .Where(d => d.Specialties.Any(s => s.Id == specialtyId)
                     && d.IsVerified
                     && d.IsAcceptingPatients)
            .OrderByDescending(d => d.AverageRating)
            .ToListAsync();

        // 3. Guardar en caché por 15 minutos
        await _cache.SetAsync(cacheKey, doctors, TimeSpan.FromMinutes(15));

        return doctors;
    }

    /// <summary>
    /// Actualiza un doctor e invalida el caché relacionado
    /// </summary>
    public async Task<Doctor> UpdateDoctorAsync(int id, Doctor updatedDoctor)
    {
        var doctor = await _context.Doctors.FindAsync(id);

        if (doctor == null)
        {
            throw new KeyNotFoundException($"Doctor con ID {id} no encontrado");
        }

        // Actualizar campos
        doctor.FirstName = updatedDoctor.FirstName;
        doctor.LastName = updatedDoctor.LastName;
        doctor.Description = updatedDoctor.Description;
        doctor.PricePerSession = updatedDoctor.PricePerSession;
        doctor.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // IMPORTANTE: Invalidar caché relacionado
        await InvalidateDoctorCache(id);

        _logger.LogInformation("Doctor {DoctorId} actualizado y caché invalidado", id);

        return doctor;
    }

    /// <summary>
    /// Invalida todo el caché relacionado con un doctor
    /// </summary>
    private async Task InvalidateDoctorCache(int doctorId)
    {
        // Eliminar caché específico del doctor
        await _cache.RemoveAsync($"{DoctorByIdCacheKeyPrefix}{doctorId}");

        // Eliminar caché de listado general
        await _cache.RemoveAsync(AllDoctorsCacheKey);

        // Opcional: Eliminar caché de especialidades
        // (requeriría conocer las especialidades del doctor)

        _logger.LogDebug("Caché invalidado para doctor {DoctorId}", doctorId);
    }
}

/// <summary>
/// Interfaz del servicio de doctores
/// </summary>
public interface IDoctorService
{
    Task<List<Doctor>> GetAllDoctorsAsync();
    Task<Doctor?> GetDoctorByIdAsync(int id);
    Task<List<Doctor>> GetDoctorsBySpecialtyAsync(int specialtyId);
    Task<Doctor> UpdateDoctorAsync(int id, Doctor updatedDoctor);
}