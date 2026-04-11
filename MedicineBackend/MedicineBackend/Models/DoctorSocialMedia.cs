using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicineBackend.Models;

/// <summary>
/// Redes sociales del doctor - OPCIONAL
/// El doctor las gestiona libremente desde su dashboard
/// </summary>
public class DoctorSocialMedia
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int DoctorId { get; set; }

    /// <summary>
    /// Plataforma: YouTube, Instagram, TikTok, Facebook, Twitter, LinkedIn
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Platform { get; set; } = string.Empty;

    /// <summary>
    /// Usuario o URL completo
    /// Ejemplos: "@drjuanperez", "youtube.com/@drjuanperez", "https://instagram.com/drjuanperez"
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string ProfileUrl { get; set; } = string.Empty;

    /// <summary>
    /// Número de seguidores (opcional, puede actualizar manualmente)
    /// </summary>
    public int? FollowerCount { get; set; }

    /// <summary>
    /// Si está activo y visible en el perfil público
    /// </summary>
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Relaciones
    [ForeignKey("DoctorId")]
    public Doctor Doctor { get; set; } = null!;
}