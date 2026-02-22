using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicineBackend.Models;

/// <summary>
/// Entidad que representa valoraciones y comentarios de pacientes sobre doctores.
/// </summary>
public class Review
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>
    /// ID del doctor valorado
    /// </summary>
    [Required]
    public int DoctorId { get; set; }

    /// <summary>
    /// ID del paciente que hace la valoración
    /// </summary>
    [Required]
    public int PatientId { get; set; }

    /// <summary>
    /// ID de la cita relacionada (opcional)
    /// </summary>
    public int? AppointmentId { get; set; }

    /// <summary>
    /// Calificación de 1 a 5 estrellas
    /// </summary>
    [Required]
    [Range(1, 5)]
    public int Rating { get; set; }

    /// <summary>
    /// Comentario del paciente
    /// </summary>
    [MaxLength(1000)]
    public string? Comment { get; set; }

    /// <summary>
    /// Indica si la review está verificada (paciente tuvo cita real)
    /// </summary>
    public bool IsVerified { get; set; } = false;

    /// <summary>
    /// Indica si la review es visible públicamente
    /// </summary>
    public bool IsVisible { get; set; } = true;

    /// <summary>
    /// Respuesta del doctor a la review
    /// </summary>
    [MaxLength(1000)]
    public string? DoctorResponse { get; set; }

    /// <summary>
    /// Fecha de la respuesta del doctor
    /// </summary>
    public DateTime? DoctorResponseDate { get; set; }

    /// <summary>
    /// Número de "me gusta" de otros usuarios
    /// </summary>
    public int HelpfulCount { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // ============================================
    // RELACIONES
    // ============================================

    [ForeignKey("DoctorId")]
    public Doctor Doctor { get; set; } = null!;

    [ForeignKey("PatientId")]
    public Patient Patient { get; set; } = null!;

    [ForeignKey("AppointmentId")]
    public Appointment? Appointment { get; set; }
}