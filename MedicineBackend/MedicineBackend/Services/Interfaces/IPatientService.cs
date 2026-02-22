using MedicineBackend.DTOs.Patient;

namespace MedicineBackend.Services.Interfaces;

/// <summary>
/// Interfaz del servicio de gestión de pacientes
/// </summary>
public interface IPatientService
{
    /// <summary>
    /// Obtiene el perfil completo de un paciente por su UserId
    /// </summary>
    Task<PatientProfileResponse?> GetPatientByUserIdAsync(int userId);

    /// <summary>
    /// Obtiene un paciente por su ID
    /// </summary>
    Task<PatientProfileResponse?> GetPatientByIdAsync(int patientId);

    /// <summary>
    /// Actualiza el perfil de un paciente
    /// </summary>
    Task<PatientProfileResponse> UpdatePatientProfileAsync(int userId, UpdatePatientProfileRequest request);

    /// <summary>
    /// Calcula el porcentaje de completitud del perfil
    /// </summary>
    int CalculateProfileCompletion(PatientProfileResponse patient);

    /// <summary>
    /// Obtiene las citas del paciente
    /// </summary>
    Task<List<object>> GetPatientAppointmentsAsync(int userId);

    /// <summary>
    /// Obtiene los cursos en los que está inscrito el paciente
    /// </summary>
    Task<List<object>> GetPatientCoursesAsync(int userId);

    /// <summary>
    /// Verifica si un paciente existe
    /// </summary>
    Task<bool> PatientExistsAsync(int userId);
}