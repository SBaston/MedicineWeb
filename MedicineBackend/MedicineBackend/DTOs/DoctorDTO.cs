using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace MedicineBackend.DTOs.Doctor;

/// <summary>
/// DTO para registro de doctor - ACTUALIZADO con 6 imágenes
/// </summary>
public class DoctorRegisterDto
{
    // ═══════════════════════════════════════════════════════════════
    // CREDENCIALES
    // ═══════════════════════════════════════════════════════════════

    [Required(ErrorMessage = "El email es obligatorio")]
    [EmailAddress(ErrorMessage = "Email inválido")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria")]
    [MinLength(6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres")]
    public string Password { get; set; } = string.Empty;

    // ═══════════════════════════════════════════════════════════════
    // INFORMACIÓN PERSONAL
    // ═══════════════════════════════════════════════════════════════

    [Required(ErrorMessage = "El nombre es obligatorio")]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "El apellido es obligatorio")]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "El número de colegiado es obligatorio")]
    [MaxLength(200)]  // ✅ AUMENTADO de 100 a 200 - Sin límite estricto
    public string ProfessionalLicense { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    public int? YearsOfExperience { get; set; }

    [Required(ErrorMessage = "El precio por sesión es obligatorio")]
    [Range(0.01, 999999.99, ErrorMessage = "El precio debe ser mayor a 0")]
    public decimal PricePerSession { get; set; }

    // ═══════════════════════════════════════════════════════════════
    // ESPECIALIDADES
    // ═══════════════════════════════════════════════════════════════

    [Required(ErrorMessage = "Debe seleccionar al menos una especialidad")]
    [MinLength(1, ErrorMessage = "Debe seleccionar al menos una especialidad")]
    public List<int> SpecialtyIds { get; set; } = new();

    // ═══════════════════════════════════════════════════════════════
    // DOCUMENTACIÓN - 6 IMÁGENES OBLIGATORIAS
    // ═══════════════════════════════════════════════════════════════

    /// <summary>Carnet de colegiado - DELANTE (OBLIGATORIO)</summary>
    [Required(ErrorMessage = "La foto frontal del carnet de colegiado es obligatoria")]
    public IFormFile ProfessionalLicenseFront { get; set; } = null!;

    /// <summary>Carnet de colegiado - ATRÁS (OBLIGATORIO)</summary>
    [Required(ErrorMessage = "La foto trasera del carnet de colegiado es obligatoria")]
    public IFormFile ProfessionalLicenseBack { get; set; } = null!;

    /// <summary>DNI/Pasaporte - DELANTE (OBLIGATORIO)</summary>
    [Required(ErrorMessage = "La foto frontal del DNI es obligatoria")]
    public IFormFile IdDocumentFront { get; set; } = null!;

    /// <summary>DNI/Pasaporte - ATRÁS (OBLIGATORIO)</summary>
    [Required(ErrorMessage = "La foto trasera del DNI es obligatoria")]
    public IFormFile IdDocumentBack { get; set; } = null!;

    /// <summary>Título de especialidad (OBLIGATORIO)</summary>
    [Required(ErrorMessage = "El título de especialidad es obligatorio")]
    public IFormFile SpecialtyDegree { get; set; } = null!;

    /// <summary>Título universitario (OBLIGATORIO)</summary>
    [Required(ErrorMessage = "El título universitario es obligatorio")]
    public IFormFile UniversityDegree { get; set; } = null!;

    /// <summary>Foto de perfil (OPCIONAL)</summary>
    public IFormFile? ProfilePicture { get; set; }
}

/// <summary>
/// Request interno para crear un doctor (usado por DoctorService)
/// Contiene las URLs ya procesadas de las imágenes
/// </summary>
public class CreateDoctorRequest
{
    // CREDENCIALES
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;

    // INFORMACIÓN PERSONAL
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string ProfessionalLicense { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Description { get; set; }
    public int? YearsOfExperience { get; set; }
    public decimal PricePerSession { get; set; }

    // ESPECIALIDADES
    public List<int> SpecialtyIds { get; set; } = new();

    // ✅ IMÁGENES - 6 URLS (ya guardadas en almacenamiento)
    public string? ProfessionalLicenseFrontImageUrl { get; set; }
    public string? ProfessionalLicenseBackImageUrl { get; set; }
    public string? IdDocumentFrontImageUrl { get; set; }
    public string? IdDocumentBackImageUrl { get; set; }
    public string? SpecialtyDegreeImageUrl { get; set; }
    public string? UniversityDegreeImageUrl { get; set; }
    public string? ProfilePictureUrl { get; set; }
}

/// <summary>
/// DTO para la lista de doctores pendientes en el admin panel
/// </summary>
public class PendingDoctorDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string ProfessionalLicense { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Description { get; set; }
    public int? YearsOfExperience { get; set; }
    public decimal PricePerSession { get; set; }
    public List<string> Specialties { get; set; } = new();
    public string? ProfilePictureUrl { get; set; }

    // ═══════════════════════════════════════════════════════════════
    // DOCUMENTACIÓN - 6 IMÁGENES
    // ═══════════════════════════════════════════════════════════════

    /// <summary>URLs de las imágenes del carnet de colegiado</summary>
    public string? ProfessionalLicenseFrontImageUrl { get; set; }
    public string? ProfessionalLicenseBackImageUrl { get; set; }

    /// <summary>URLs de las imágenes del DNI/Pasaporte</summary>
    public string? IdDocumentFrontImageUrl { get; set; }
    public string? IdDocumentBackImageUrl { get; set; }

    /// <summary>URLs de los títulos</summary>
    public string? SpecialtyDegreeImageUrl { get; set; }
    public string? UniversityDegreeImageUrl { get; set; }

    public DateTime CreatedAt { get; set; }
}