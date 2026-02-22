using MedicineBackend.Data;
using MedicineBackend.DTOs.Patient;
using MedicineBackend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MedicineBackend.Services;

/// <summary>
/// Servicio de gestión de pacientes
/// Encapsula toda la lógica de negocio relacionada con pacientes
/// </summary>
public class PatientService : IPatientService
{
    private readonly AppDbContext _context;
    private readonly ILogger<PatientService> _logger;

    public PatientService(AppDbContext context, ILogger<PatientService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene el perfil completo de un paciente por su UserId
    /// </summary>
    public async Task<PatientProfileResponse?> GetPatientByUserIdAsync(int userId)
    {
        try
        {
            var patient = await _context.Patients
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (patient == null)
            {
                _logger.LogWarning("Paciente no encontrado para UserId: {UserId}", userId);
                return null;
            }

            return MapToPatientProfileResponse(patient);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener paciente por UserId: {UserId}", userId);
            throw;
        }
    }

    /// <summary>
    /// Obtiene un paciente por su ID
    /// </summary>
    public async Task<PatientProfileResponse?> GetPatientByIdAsync(int patientId)
    {
        try
        {
            var patient = await _context.Patients
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == patientId);

            if (patient == null)
            {
                _logger.LogWarning("Paciente no encontrado: {PatientId}", patientId);
                return null;
            }

            return MapToPatientProfileResponse(patient);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener paciente: {PatientId}", patientId);
            throw;
        }
    }

    /// <summary>
    /// Actualiza el perfil de un paciente
    /// </summary>
    public async Task<PatientProfileResponse> UpdatePatientProfileAsync(int userId, UpdatePatientProfileRequest request)
    {
        try
        {
            var patient = await _context.Patients
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (patient == null)
            {
                throw new KeyNotFoundException($"Paciente no encontrado para UserId: {userId}");
            }

            // Validaciones de negocio
            ValidatePatientUpdate(request);

            // Actualizar campos
            patient.PhoneNumber = request.PhoneNumber;
            patient.Address = request.Address;
            patient.City = request.City;
            patient.PostalCode = request.PostalCode;
            patient.Country = request.Country ?? "España";
            patient.Gender = request.Gender;
            patient.EmergencyContact = request.EmergencyContact;
            patient.MedicalHistory = request.MedicalHistory;
            patient.ProfilePictureUrl = request.ProfilePictureUrl;
            patient.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Perfil actualizado para paciente {PatientId} (UserId: {UserId})",
                patient.Id, userId);

            return MapToPatientProfileResponse(patient);
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar perfil del paciente UserId: {UserId}", userId);
            throw;
        }
    }

    /// <summary>
    /// Calcula el porcentaje de completitud del perfil
    /// </summary>
    public int CalculateProfileCompletion(PatientProfileResponse patient)
    {
        var fields = new[]
        {
            !string.IsNullOrWhiteSpace(patient.PhoneNumber),
            !string.IsNullOrWhiteSpace(patient.Address),
            !string.IsNullOrWhiteSpace(patient.City),
            !string.IsNullOrWhiteSpace(patient.PostalCode),
            !string.IsNullOrWhiteSpace(patient.Gender),
            !string.IsNullOrWhiteSpace(patient.ProfilePictureUrl),
        };

        var completed = fields.Count(f => f);
        var total = fields.Length;

        return (int)Math.Round((completed / (double)total) * 100);
    }

    /// <summary>
    /// Obtiene las citas del paciente
    /// </summary>
    public async Task<List<object>> GetPatientAppointmentsAsync(int userId)
    {
        try
        {
            var patient = await _context.Patients
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (patient == null)
            {
                return new List<object>();
            }

            var appointments = await _context.Appointments
                .Include(a => a.Doctor)
                    .ThenInclude(d => d.Specialties)
                .Where(a => a.PatientId == patient.Id)
                .OrderByDescending(a => a.AppointmentDate)
                .Take(10)
                .Select(a => new
                {
                    a.Id,
                    a.AppointmentDate,
                    a.Status,
                    a.Price,
                    a.Reason,
                    Doctor = new
                    {
                        a.Doctor.Id,
                        a.Doctor.FullName,
                        a.Doctor.ProfilePictureUrl,
                        Specialty = a.Doctor.Specialties.FirstOrDefault()!.Name
                    }
                })
                .ToListAsync<object>();

            return appointments;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener citas del paciente UserId: {UserId}", userId);
            return new List<object>();
        }
    }

    /// <summary>
    /// Obtiene los cursos en los que está inscrito el paciente
    /// </summary>
    public async Task<List<object>> GetPatientCoursesAsync(int userId)
    {
        try
        {
            var patient = await _context.Patients
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (patient == null)
            {
                return new List<object>();
            }

            var courses = await _context.CourseEnrollments
                .Include(ce => ce.Course)
                    .ThenInclude(c => c.Doctor)
                .Where(ce => ce.PatientId == patient.Id)
                .OrderByDescending(ce => ce.EnrolledAt)
                .Select(ce => new
                {
                    ce.Id,
                    ce.Progress,
                    ce.IsCompleted,
                    ce.EnrolledAt,
                    Course = new
                    {
                        ce.Course.Id,
                        ce.Course.Title,
                        ce.Course.Description,
                        ce.Course.CoverImageUrl,
                        ce.Course.Price,
                        Doctor = new
                        {
                            ce.Course.Doctor.Id,
                            ce.Course.Doctor.FullName
                        }
                    }
                })
                .ToListAsync<object>();

            return courses;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener cursos del paciente UserId: {UserId}", userId);
            return new List<object>();
        }
    }

    /// <summary>
    /// Verifica si un paciente existe
    /// </summary>
    public async Task<bool> PatientExistsAsync(int userId)
    {
        return await _context.Patients.AnyAsync(p => p.UserId == userId);
    }

    #region Métodos privados

    /// <summary>
    /// Mapea una entidad Patient a PatientProfileResponse
    /// </summary>
    private PatientProfileResponse MapToPatientProfileResponse(Models.Patient patient)
    {
        return new PatientProfileResponse
        {
            Id = patient.Id,
            Email = patient.User.Email,
            FirstName = patient.FirstName,
            LastName = patient.LastName,
            DateOfBirth = patient.DateOfBirth,
            PhoneNumber = patient.PhoneNumber,
            Address = patient.Address,
            City = patient.City,
            PostalCode = patient.PostalCode,
            Country = patient.Country,
            Gender = patient.Gender,
            EmergencyContact = patient.EmergencyContact,
            MedicalHistory = patient.MedicalHistory,
            ProfilePictureUrl = patient.ProfilePictureUrl,
            CreatedAt = patient.CreatedAt
        };
    }

    /// <summary>
    /// Validaciones de negocio para actualización de perfil
    /// </summary>
    private void ValidatePatientUpdate(UpdatePatientProfileRequest request)
    {
        // Validar código postal español si se proporciona
        if (!string.IsNullOrWhiteSpace(request.PostalCode) &&
            request.Country?.Equals("España", StringComparison.OrdinalIgnoreCase) == true)
        {
            if (!System.Text.RegularExpressions.Regex.IsMatch(request.PostalCode, @"^\d{5}$"))
            {
                throw new InvalidOperationException("El código postal español debe tener 5 dígitos");
            }
        }

        // Validar teléfono español si se proporciona
        if (!string.IsNullOrWhiteSpace(request.PhoneNumber) &&
            !System.Text.RegularExpressions.Regex.IsMatch(request.PhoneNumber, @"^(\+34|0034)?[6-9]\d{8}$"))
        {
            throw new InvalidOperationException("El formato del teléfono no es válido. Debe ser un número español válido");
        }

        // Más validaciones de negocio según sea necesario...
    }

    #endregion
}