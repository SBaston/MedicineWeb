using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicineBackend.Models;

/// <summary>
/// Registro de aceptación de términos de contenido
/// Obligatorio para doctores que quieran publicar contenido
/// </summary>
public class DoctorContentConsent
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int DoctorId { get; set; }

    /// <summary>
    /// Versión de los términos aceptados (ej: "v1.0", "v2.0")
    /// Permite trackear cambios en los términos
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string TermsVersion { get; set; } = "v1.0";

    /// <summary>
    /// IP desde la que aceptó (para validación legal)
    /// </summary>
    [MaxLength(50)]
    public string? IpAddress { get; set; }

    /// <summary>
    /// User Agent del navegador (para validación legal)
    /// </summary>
    [MaxLength(500)]
    public string? UserAgent { get; set; }

    /// <summary>
    /// Si ha aceptado los términos actuales
    /// </summary>
    public bool HasAccepted { get; set; } = true;

    public DateTime AcceptedAt { get; set; } = DateTime.UtcNow;

    // Relaciones
    [ForeignKey("DoctorId")]
    public Doctor Doctor { get; set; } = null!;
}