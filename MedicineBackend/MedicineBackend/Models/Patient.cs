using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicineBackend.Models;

/// <summary>
/// Entidad que representa a un paciente en la plataforma.
/// Almacena información personal y médica del paciente.
/// </summary>
public class Patient
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>
    /// Relación con User (FK)
    /// </summary>
    [Required]
    public int UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    /// <summary>
    /// Teléfono de contacto
    /// </summary>
    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Fecha de nacimiento (para calcular edad)
    /// </summary>
    [Required]
    public DateTime DateOfBirth { get; set; }

    /// <summary>
    /// Género del paciente
    /// </summary>
    [MaxLength(20)]
    public string? Gender { get; set; }

    /// <summary>
    /// Dirección del paciente
    /// </summary>
    [MaxLength(500)]
    public string? Address { get; set; }

    /// <summary>
    /// Ciudad
    /// </summary>
    [MaxLength(100)]
    public string? City { get; set; }

    /// <summary>
    /// Código postal
    /// </summary>
    [MaxLength(10)]
    public string? PostalCode { get; set; }

    /// <summary>
    /// País
    /// </summary>
    [MaxLength(100)]
    public string? Country { get; set; } = "España";

    /// <summary>
    /// URL de la foto de perfil
    /// </summary>
    [MaxLength(500)]
    public string? ProfilePictureUrl { get; set; }

    /// <summary>
    /// Historial médico relevante (alergias, enfermedades crónicas, etc.)
    /// </summary>
    [MaxLength(2000)]
    public string? MedicalHistory { get; set; }

    /// <summary>
    /// Información de contacto de emergencia
    /// </summary>
    [MaxLength(500)]
    public string? EmergencyContact { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // ============================================
    // RELACIONES
    // ============================================

    /// <summary>
    /// Usuario asociado
    /// </summary>
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;

    /// <summary>
    /// Citas médicas del paciente
    /// </summary>
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();

    /// <summary>
    /// Inscripciones a cursos
    /// </summary>
    public ICollection<CourseEnrollment> CourseEnrollments { get; set; } = new List<CourseEnrollment>();

    /// <summary>
    /// Valoraciones realizadas
    /// </summary>
    public ICollection<Review> Reviews { get; set; } = new List<Review>();

    /// <summary>
    /// Pagos realizados
    /// </summary>
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();

    // ============================================
    // PROPIEDADES CALCULADAS
    // ============================================

    [NotMapped]
    public string FullName => $"{FirstName} {LastName}";

    [NotMapped]
    public int Age
    {
        get
        {
            var today = DateTime.Today;
            var age = today.Year - DateOfBirth.Year;
            if (DateOfBirth.Date > today.AddYears(-age)) age--;
            return age;
        }
    }
}