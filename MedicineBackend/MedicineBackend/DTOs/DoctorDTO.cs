using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace MedicineBackend.DTOs.Doctor;

/// <summary>
/// DTO para registro de doctor - ACTUALIZADO con 6 imágenes, términos y redes sociales
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
    [MaxLength(200)]
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
    // ✅ NUEVO: REDES SOCIALES (OPCIONAL)
    // ═══════════════════════════════════════════════════════════════

    /// <summary>Redes sociales del doctor (opcional)</summary>
    public List<SocialMediaLinkDto>? SocialMediaLinks { get; set; }

    // ═══════════════════════════════════════════════════════════════
    // ✅ NUEVO: TÉRMINOS DE CONTENIDO (OBLIGATORIO)
    // ═══════════════════════════════════════════════════════════════

    /// <summary>
    /// Aceptación de términos de publicación de contenido
    /// Obligatorio para completar el registro
    /// </summary>
    [Required(ErrorMessage = "Debes aceptar los términos de contenido")]
    public bool AcceptContentTerms { get; set; }

    /// <summary>Versión de los términos aceptados</summary>
    [MaxLength(20)]
    public string TermsVersion { get; set; } = "v1.0";

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

    /// <summary>
    /// Títulos de especialidad — uno por cada especialidad seleccionada.
    /// Mínimo 1 archivo obligatorio.
    /// </summary>
    public List<IFormFile> SpecialtyDegrees { get; set; } = new();

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

    // IMÁGENES - 6 URLS (ya guardadas en almacenamiento)
    public string? ProfessionalLicenseFrontImageUrl { get; set; }
    public string? ProfessionalLicenseBackImageUrl { get; set; }
    public string? IdDocumentFrontImageUrl { get; set; }
    public string? IdDocumentBackImageUrl { get; set; }
    /// <summary>URLs de los títulos de especialidad (JSON array serializado)</summary>
    public List<string> SpecialtyDegreeImageUrls { get; set; } = new();
    public string? UniversityDegreeImageUrl { get; set; }
    public string? ProfilePictureUrl { get; set; }

    // ✅ NUEVO: TÉRMINOS Y REDES SOCIALES
    public bool AcceptContentTerms { get; set; }
    public string TermsVersion { get; set; } = "v1.0";
    public List<SocialMediaLinkDto>? SocialMediaLinks { get; set; }
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

    // DOCUMENTACIÓN - 6 IMÁGENES
    public string? ProfessionalLicenseFrontImageUrl { get; set; }
    public string? ProfessionalLicenseBackImageUrl { get; set; }
    public string? IdDocumentFrontImageUrl { get; set; }
    public string? IdDocumentBackImageUrl { get; set; }
    /// <summary>URLs de los títulos de especialidad, deserializadas desde JSON</summary>
    public List<string> SpecialtyDegreeImageUrls { get; set; } = new();
    public string? UniversityDegreeImageUrl { get; set; }

    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO para enlaces de redes sociales en el registro
/// </summary>
public class SocialMediaLinkDto
{
    [Required]
    [MaxLength(50)]
    public string Platform { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string ProfileUrl { get; set; } = string.Empty;

    public int? FollowerCount { get; set; }
}