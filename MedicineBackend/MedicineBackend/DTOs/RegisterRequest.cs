using System.ComponentModel.DataAnnotations;

namespace MedicineBackend.DTOs.Auth;

/// <summary>
/// DTO para registro de nuevos usuarios
/// </summary>
public class RegisterRequest
{
    [Required(ErrorMessage = "El email es obligatorio")]
    [EmailAddress(ErrorMessage = "El formato del email no es válido")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria")]
    [MinLength(8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$",
        ErrorMessage = "La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "El rol es obligatorio")]
    [RegularExpression("^(Patient|Doctor|Admin)$", ErrorMessage = "El rol debe ser Patient, Doctor o Admin")]
    public string Role { get; set; } = string.Empty;

    // Datos específicos según el rol
    [Required(ErrorMessage = "El nombre es obligatorio")]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "El apellido es obligatorio")]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    // Solo para Doctor
    public string? ProfessionalLicense { get; set; }

    // Solo para Patient
    public DateTime? DateOfBirth { get; set; }

    // Solo para Admin
    public string? Department { get; set; }
}