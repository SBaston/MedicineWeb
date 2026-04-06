using MedicineBackend.DTOs.Doctor;
using MedicineBackend.Models;

namespace MedicineBackend.Services.Interfaces;

/// <summary>
/// Interfaz del servicio de gestión de doctores
/// </summary>
public interface IDoctorService
{
    /// <summary>
    /// Obtiene todos los doctores verificados y activos
    /// </summary>
    Task<List<Doctor>> GetAllDoctorsAsync();

    /// <summary>
    /// Verifica si un email ya está registrado
    /// </summary>
    Task<bool> EmailExistsAsync(string email);

    /// <summary>
    /// Verifica si un número de colegiado ya está registrado
    /// </summary>
    Task<bool> ProfessionalLicenseExistsAsync(string professionalLicense);

    /// <summary>
    /// Registra un nuevo doctor
    /// </summary>
    Task<Doctor> RegisterAsync(CreateDoctorRequest request);

    /// <summary>
    /// Obtiene un doctor por su ID
    /// </summary>
    Task<Doctor?> GetDoctorByIdAsync(int id);

    /// <summary>
    /// Obtiene doctores filtrados por especialidad
    /// </summary>
    Task<List<Doctor>> GetDoctorsBySpecialtyAsync(int specialtyId);

    /// <summary>
    /// Actualiza la información de un doctor
    /// </summary>
    Task<Doctor> UpdateDoctorAsync(int id, Doctor updatedDoctor);
}