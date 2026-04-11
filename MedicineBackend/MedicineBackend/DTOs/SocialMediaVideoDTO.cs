using System.ComponentModel.DataAnnotations;

namespace MedicineBackend.DTOs.Doctor;

// ═══════════════════════════════════════════════════════════════
// DTOs PARA REDES SOCIALES
// ═══════════════════════════════════════════════════════════════

/// <summary>
/// DTO para crear una red social
/// </summary>
public class CreateSocialMediaRequest
{
    [Required(ErrorMessage = "La plataforma es obligatoria")]
    [MaxLength(50)]
    public string Platform { get; set; } = string.Empty;

    [Required(ErrorMessage = "La URL del perfil es obligatoria")]
    [MaxLength(500)]
    public string ProfileUrl { get; set; } = string.Empty;

    public int? FollowerCount { get; set; }
}

/// <summary>
/// DTO para actualizar una red social
/// </summary>
public class UpdateSocialMediaRequest
{
    [Required(ErrorMessage = "La URL del perfil es obligatoria")]
    [MaxLength(500)]
    public string ProfileUrl { get; set; } = string.Empty;

    public int? FollowerCount { get; set; }

    public bool IsActive { get; set; } = true;
}

/// <summary>
/// DTO de respuesta para red social
/// </summary>
public class SocialMediaDto
{
    public int Id { get; set; }
    public string Platform { get; set; } = string.Empty;
    public string ProfileUrl { get; set; } = string.Empty;
    public int? FollowerCount { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

// ═══════════════════════════════════════════════════════════════
// DTOs PARA TÉRMINOS DE CONTENIDO
// ═══════════════════════════════════════════════════════════════

/// <summary>
/// DTO para aceptar términos de contenido
/// </summary>
public class AcceptContentTermsRequest
{
    [Required]
    public bool AcceptTerms { get; set; }

    [Required]
    [MaxLength(20)]
    public string TermsVersion { get; set; } = "v1.0";
}

/// <summary>
/// DTO de respuesta para términos de contenido
/// </summary>
public class ContentConsentDto
{
    public bool HasAccepted { get; set; }
    public string TermsVersion { get; set; } = string.Empty;
    public DateTime AcceptedAt { get; set; }
}

// ═══════════════════════════════════════════════════════════════
// DTOs PARA VIDEOS (SIMPLIFICADOS)
// ═══════════════════════════════════════════════════════════════

/// <summary>
/// DTO para crear un video
/// </summary>
public class CreateVideoRequest
{
    [Required(ErrorMessage = "El título es obligatorio")]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required(ErrorMessage = "La plataforma es obligatoria")]
    [MaxLength(50)]
    public string Platform { get; set; } = string.Empty;

    [Required(ErrorMessage = "La URL del video es obligatoria")]
    [MaxLength(500)]
    public string VideoUrl { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? ThumbnailUrl { get; set; }

    public int ViewCount { get; set; } = 0;
    public int LikeCount { get; set; } = 0;
}

/// <summary>
/// DTO para actualizar un video
/// </summary>
public class UpdateVideoRequest
{
    [Required(ErrorMessage = "El título es obligatorio")]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? ThumbnailUrl { get; set; }

    public int ViewCount { get; set; } = 0;
    public int LikeCount { get; set; } = 0;

    public bool IsActive { get; set; } = true;
}

/// <summary>
/// DTO de respuesta para video
/// </summary>
public class VideoDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Platform { get; set; } = string.Empty;
    public string VideoUrl { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public int ViewCount { get; set; }
    public int LikeCount { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}