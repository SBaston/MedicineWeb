using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicineBackend.Models;

/// <summary>
/// Entidad que representa la inscripción de un paciente en un curso.
/// Registra el progreso y completitud del curso.
/// </summary>
public class CourseEnrollment
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>
    /// ID del curso
    /// </summary>
    [Required]
    public int CourseId { get; set; }

    /// <summary>
    /// ID del paciente inscrito
    /// </summary>
    [Required]
    public int PatientId { get; set; }

    /// <summary>
    /// Progreso del curso en porcentaje (0-100)
    /// </summary>
    public int Progress { get; set; } = 0;

    /// <summary>
    /// Indica si el curso ha sido completado
    /// </summary>
    public bool IsCompleted { get; set; } = false;

    /// <summary>
    /// Calificación del estudiante (1-5 estrellas)
    /// </summary>
    public int? Rating { get; set; }

    /// <summary>
    /// Comentario/review del estudiante sobre el curso
    /// </summary>
    [MaxLength(1000)]
    public string? ReviewComment { get; set; }

    /// <summary>
    /// Fecha de inscripción
    /// </summary>
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Fecha de finalización del curso
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Último acceso al curso
    /// </summary>
    public DateTime? LastAccessedAt { get; set; }

    /// <summary>
    /// Tiempo total dedicado en minutos
    /// </summary>
    public int TotalTimeSpentMinutes { get; set; } = 0;

    // ============================================
    // RELACIONES
    // ============================================

    [ForeignKey("CourseId")]
    public Course Course { get; set; } = null!;

    [ForeignKey("PatientId")]
    public Patient Patient { get; set; } = null!;
}