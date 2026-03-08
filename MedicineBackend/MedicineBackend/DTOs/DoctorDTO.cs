// ═══════════════════════════════════════════════════════════════
// Backend/DTOs/DoctorDtos.cs
// DTOs para registro y gestión de doctores
// ═══════════════════════════════════════════════════════════════

using System.ComponentModel.DataAnnotations;

namespace MedicineBackend.DTOs
{
    // ═══════════════════════════════════════════════════════════
    // DTO PARA REGISTRO DE DOCTOR (desde formulario)
    // ═══════════════════════════════════════════════════════════
    public class DoctorRegistrationDto
    {
        [Required(ErrorMessage = "El nombre es obligatorio")]
        [StringLength(50, MinimumLength = 2)]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Los apellidos son obligatorios")]
        [StringLength(50, MinimumLength = 2)]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "El email es obligatorio")]
        [EmailAddress(ErrorMessage = "Email no válido")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "La contraseña es obligatoria")]
        [StringLength(100, MinimumLength = 8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "El número de colegiado es obligatorio")]
        [RegularExpression(@"^\d{8,10}$", ErrorMessage = "Número de colegiado inválido (8-10 dígitos)")]
        public string ProfessionalLicense { get; set; } = string.Empty;

        [Required(ErrorMessage = "Debe seleccionar al menos una especialidad")]
        [MinLength(1, ErrorMessage = "Debe tener al menos una especialidad")]
        public List<int> SpecialtyIds { get; set; } = new(); // IDs de especialidades

        [Range(0, 50, ErrorMessage = "Los años de experiencia deben estar entre 0 y 50")]
        public int YearsOfExperience { get; set; }

        [Required(ErrorMessage = "El precio por sesión es obligatorio")]
        [Range(20, 500, ErrorMessage = "El precio debe estar entre 20€ y 500€")]
        public decimal PricePerSession { get; set; }

        [StringLength(1000, ErrorMessage = "La descripción no puede superar 1000 caracteres")]
        public string? Description { get; set; }

        [Phone(ErrorMessage = "Número de teléfono inválido")]
        public string? PhoneNumber { get; set; }

        // ═══════════════════════════════════════════════════════════
        // IMÁGENES EN BASE64
        // ═══════════════════════════════════════════════════════════

        /// <summary>Imagen del carnet de colegiado en Base64</summary>
        [Required(ErrorMessage = "La imagen del carnet de colegiado es obligatoria")]
        public string ProfessionalLicenseImage { get; set; } = string.Empty;

        /// <summary>Imagen del DNI/Pasaporte en Base64 (opcional)</summary>
        public string? IdDocumentImage { get; set; }

        /// <summary>Imagen del título universitario en Base64 (opcional)</summary>
        public string? DegreeImage { get; set; }
    }

    public class UpdateDoctorRequest
    {
        public string? Description { get; set; }
        public decimal? PricePerSession { get; set; }
        public string? PhoneNumber { get; set; }
        public string? ProfilePictureUrl { get; set; }
    }

    // ═══════════════════════════════════════════════════════════
    // DTO PARA RESPUESTA DE REGISTRO
    // ═══════════════════════════════════════════════════════════
    public class DoctorRegistrationResponse
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public decimal OcrConfidence { get; set; }
        public bool DocumentVerified { get; set; }
    }

    // ═══════════════════════════════════════════════════════════
    // DTO PARA VALIDAR DOCUMENTO (OCR)
    // ═══════════════════════════════════════════════════════════
    public class ValidateDocumentRequest
    {
        [Required]
        public string ImageBase64 { get; set; } = string.Empty;
    }

    // ═══════════════════════════════════════════════════════════
    // DTO INTERNO: CreateDoctorRequest (para DoctorService)
    // ═══════════════════════════════════════════════════════════
    public class CreateDoctorRequest
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string ProfessionalLicense { get; set; } = string.Empty;
        public List<int> SpecialtyIds { get; set; } = new();
        public int YearsOfExperience { get; set; }
        public decimal PricePerSession { get; set; }
        public string? Description { get; set; }
        public string? PhoneNumber { get; set; }

        // URLs de imágenes guardadas
        public string ProfessionalLicenseImageUrl { get; set; } = string.Empty;
        public string? IdDocumentImageUrl { get; set; }
        public string? DegreeImageUrl { get; set; }

        // Datos del OCR
        public string? OcrData { get; set; }
        public bool IsDocumentVerified { get; set; }
    }

    // ═══════════════════════════════════════════════════════════
    // DTO PARA MOSTRAR DOCTOR
    // ═══════════════════════════════════════════════════════════
    public class DoctorDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string ProfessionalLicense { get; set; } = string.Empty;
        public List<string> Specialties { get; set; } = new();
        public int YearsOfExperience { get; set; }
        public decimal PricePerSession { get; set; }
        public string? Description { get; set; }
        public string? PhoneNumber { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool IsDocumentVerified { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // ═══════════════════════════════════════════════════════════
    // DTO PARA RESULTADO DE OCR
    // ═══════════════════════════════════════════════════════════
    public class OcrResultDto
    {
        public bool Success { get; set; }
        public string? ExtractedText { get; set; }
        public string? ProfessionalLicense { get; set; }
        public string? FullName { get; set; }
        public string? Specialty { get; set; }
        public decimal Confidence { get; set; }
        public List<string> Errors { get; set; } = new();
    }
}