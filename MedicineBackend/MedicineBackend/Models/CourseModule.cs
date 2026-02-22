using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicineBackend.Models;

/// <summary>
/// Entidad que representa un módulo o lección dentro de un curso.
/// </summary>
public class CourseModule
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>
    /// ID del curso al que pertenece
    /// </summary>
    [Required]
    public int CourseId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(5000)]
    public string? Content { get; set; }

    /// <summary>
    /// URL del video de la lección
    /// </summary>
    [MaxLength(500)]
    public string? VideoUrl { get; set; }

    /// <summary>
    /// Duración del video en minutos
    /// </summary>
    public int? VideoDurationMinutes { get; set; }

    /// <summary>
    /// Orden del módulo en el curso
    /// </summary>
    public int OrderIndex { get; set; }

    /// <summary>
    /// Tipo de contenido: Video, Texto, Quiz, Archivo
    /// </summary>
    [MaxLength(20)]
    public string? ContentType { get; set; } = "Video";

    /// <summary>
    /// URL de recursos adicionales (PDFs, etc.)
    /// </summary>
    [MaxLength(500)]
    public string? ResourceUrl { get; set; }

    /// <summary>
    /// Indica si el módulo es gratuito (preview)
    /// </summary>
    public bool IsFree { get; set; } = false;

    /// <summary>
    /// Indica si el módulo está publicado
    /// </summary>
    public bool IsPublished { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // ============================================
    // RELACIONES
    // ============================================

    [ForeignKey("CourseId")]
    public Course Course { get; set; } = null!;
}