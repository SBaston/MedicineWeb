using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicineBackend.Models;

/// <summary>
/// Entidad que representa notificaciones enviadas a los usuarios.
/// Incluye recordatorios de citas, mensajes del sistema, etc.
/// </summary>
public class Notification
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>
    /// ID del usuario destinatario
    /// </summary>
    [Required]
    public int UserId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Tipo de notificación: System, Appointment, Payment, Course, Review
    /// </summary>
    [MaxLength(50)]
    public string? Type { get; set; }

    /// <summary>
    /// URL de acción (hacia donde redirigir al hacer clic)
    /// </summary>
    [MaxLength(500)]
    public string? ActionUrl { get; set; }

    /// <summary>
    /// Indica si la notificación ha sido leída
    /// </summary>
    public bool IsRead { get; set; } = false;

    /// <summary>
    /// Fecha en que se leyó la notificación
    /// </summary>
    public DateTime? ReadAt { get; set; }

    /// <summary>
    /// Prioridad de la notificación: Low, Normal, High
    /// </summary>
    [MaxLength(20)]
    public string Priority { get; set; } = "Normal";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ============================================
    // RELACIONES
    // ============================================

    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
}