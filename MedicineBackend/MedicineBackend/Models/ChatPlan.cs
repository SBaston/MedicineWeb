using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicineBackend.Models;

/// <summary>
/// Plan de suscripción de chat configurable por el admin.
/// Los servicios médicos están exentos de IVA en España.
/// </summary>
public class ChatPlan
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal Price { get; set; }

    /// <summary>Duración de la suscripción en días</summary>
    public int DurationDays { get; set; }

    /// <summary>Porcentaje de comisión de la plataforma (0-100)</summary>
    [Column(TypeName = "decimal(5,2)")]
    public decimal PlatformCommissionPercent { get; set; }

    public bool IsActive { get; set; } = true;

    /// <summary>Exento de IVA — servicios médicos en España</summary>
    public bool IsVatExempt { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
