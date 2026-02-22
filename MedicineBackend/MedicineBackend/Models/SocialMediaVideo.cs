using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicineBackend.Models;

/// <summary>
/// Entidad que representa videos de redes sociales (TikTok, Instagram) del doctor.
/// Esta es una de las características distintivas de la plataforma.
/// </summary>
public class SocialMediaVideo
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>
    /// ID del doctor que subió el video
    /// </summary>
    [Required]
    public int DoctorId { get; set; }

    /// <summary>
    /// Plataforma de origen: TikTok, Instagram, YouTube
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string Platform { get; set; } = string.Empty;

    /// <summary>
    /// URL del video en la plataforma original
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string VideoUrl { get; set; } = string.Empty;

    /// <summary>
    /// ID del video en la plataforma (para embeds)
    /// </summary>
    [MaxLength(200)]
    public string? VideoId { get; set; }

    /// <summary>
    /// Título del video
    /// </summary>
    [MaxLength(200)]
    public string? Title { get; set; }

    /// <summary>
    /// Descripción del video
    /// </summary>
    [MaxLength(1000)]
    public string? Description { get; set; }

    /// <summary>
    /// Miniatura del video
    /// </summary>
    [MaxLength(500)]
    public string? ThumbnailUrl { get; set; }

    /// <summary>
    /// Número de vistas (si está disponible)
    /// </summary>
    public int? ViewCount { get; set; }

    /// <summary>
    /// Número de likes (si está disponible)
    /// </summary>
    public int? LikeCount { get; set; }

    /// <summary>
    /// Tags o categorías del video
    /// </summary>
    [MaxLength(500)]
    public string? Tags { get; set; }

    /// <summary>
    /// Indica si el video está activo/visible
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Indica si el video ha sido verificado por un admin
    /// </summary>
    public bool IsVerified { get; set; } = false;

    /// <summary>
    /// Orden de visualización en el perfil
    /// </summary>
    public int DisplayOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // ============================================
    // RELACIONES
    // ============================================

    [ForeignKey("DoctorId")]
    public Doctor Doctor { get; set; } = null!;
}