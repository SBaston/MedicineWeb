using System.ComponentModel.DataAnnotations;

namespace MedicineBackend.DTOs.Patient;

/// <summary>
/// DTO para actualizar el perfil del paciente
/// </summary>
public class UpdatePatientProfileRequest
{
    [Phone(ErrorMessage = "El formato del teléfono no es válido")]
    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(10)]
    public string? PostalCode { get; set; }

    [MaxLength(100)]
    public string? Country { get; set; }

    [MaxLength(20)]
    public string? Gender { get; set; }

    [MaxLength(500)]
    public string? EmergencyContact { get; set; }

    public string? MedicalHistory { get; set; }

    [Url(ErrorMessage = "La URL de la foto de perfil no es válida")]
    [MaxLength(500)]
    public string? ProfilePictureUrl { get; set; }
}

/// <summary>
/// DTO para la respuesta del perfil del paciente
/// </summary>
public class PatientProfileResponse
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}";
    public DateTime DateOfBirth { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public string? Gender { get; set; }
    public string? EmergencyContact { get; set; }
    public string? MedicalHistory { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}