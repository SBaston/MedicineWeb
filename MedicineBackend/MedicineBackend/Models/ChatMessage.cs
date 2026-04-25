using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicineBackend.Models;

/// <summary>
/// Mensaje almacenado de chat entre paciente y médico.
/// El almacenamiento es obligatorio por requisito legal.
/// </summary>
public class ChatMessage
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    public int ChatSubscriptionId { get; set; }

    public int SenderUserId { get; set; }

    /// <summary>Rol del emisor: Patient / Doctor</summary>
    [Required]
    [MaxLength(20)]
    public string SenderRole { get; set; } = string.Empty;

    [Required]
    [MaxLength(4000)]
    public string Content { get; set; } = string.Empty;

    public bool IsRead { get; set; } = false;

    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    public DateTime? ReadAt { get; set; }

    // ── Navegación ────────────────────────────────────────────

    [ForeignKey("ChatSubscriptionId")]
    public ChatSubscription Subscription { get; set; } = null!;

    [ForeignKey("SenderUserId")]
    public User Sender { get; set; } = null!;
}
