using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicineBackend.Models;

/// <summary>
/// Entidad que representa cursos de formación creados por doctores.
/// Los doctores pueden monetizar su conocimiento mediante cursos.
/// </summary>
public class Course
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>
    /// ID del doctor que creó el curso
    /// </summary>
    [Required]
    public int DoctorId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    /// <summary>
    /// Precio del curso en euros
    /// </summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal Price { get; set; }

    /// <summary>
    /// URL de la imagen de portada del curso
    /// </summary>
    [MaxLength(500)]
    public string? CoverImageUrl { get; set; }

    /// <summary>
    /// Nivel del curso: Principiante, Intermedio, Avanzado
    /// </summary>
    [MaxLength(20)]
    public string? Level { get; set; }

    /// <summary>
    /// Categoría del curso
    /// </summary>
    [MaxLength(100)]
    public string? Category { get; set; }

    /// <summary>
    /// Duración total estimada en horas
    /// </summary>
    public int? DurationHours { get; set; }

    /// <summary>
    /// Idioma del curso
    /// </summary>
    [MaxLength(20)]
    public string Language { get; set; } = "Español";

    /// <summary>
    /// Requisitos previos del curso
    /// </summary>
    [MaxLength(1000)]
    public string? Prerequisites { get; set; }

    /// <summary>
    /// Objetivos de aprendizaje
    /// </summary>
    [MaxLength(2000)]
    public string? LearningObjectives { get; set; }

    /// <summary>
    /// Indica si el curso está publicado y visible
    /// </summary>
    public bool IsPublished { get; set; } = false;

    /// <summary>
    /// Indica si el curso está verificado por admin
    /// </summary>
    public bool IsVerified { get; set; } = false;

    /// <summary>
    /// Total de estudiantes inscritos
    /// </summary>
    public int TotalEnrollments { get; set; } = 0;

    /// <summary>
    /// Calificación promedio del curso (1-5 estrellas)
    /// </summary>
    [Column(TypeName = "decimal(3,2)")]
    public decimal AverageRating { get; set; } = 0;

    /// <summary>
    /// Total de valoraciones
    /// </summary>
    public int TotalRatings { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }

    // ============================================
    // RELACIONES
    // ============================================

    [ForeignKey("DoctorId")]
    public Doctor Doctor { get; set; } = null!;

    /// <summary>
    /// Módulos/lecciones del curso
    /// </summary>
    public ICollection<CourseModule> Modules { get; set; } = new List<CourseModule>();

    /// <summary>
    /// Inscripciones al curso
    /// </summary>
    public ICollection<CourseEnrollment> Enrollments { get; set; } = new List<CourseEnrollment>();
}