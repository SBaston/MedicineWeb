using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicineBackend.Models;

/// <summary>
/// Suscripción de chat entre paciente y médico.
/// Representa el acceso de mensajería por un período de tiempo.
/// </summary>
public class ChatSubscription
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>FK al usuario paciente (User.Id)</summary>
    public int PatientUserId { get; set; }

    /// <summary>FK al doctor (Doctor.Id)</summary>
    public int DoctorId { get; set; }

    public int ChatPlanId { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    /// <summary>Estado: Pending / Active / Expired / Cancelled</summary>
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Pending";

    [MaxLength(200)]
    public string? StripeSessionId { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal AmountPaid { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal DoctorEarnings { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal PlatformEarnings { get; set; }

    /// <summary>Exento de IVA — servicios médicos en España</summary>
    public bool IsVatExempt { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ── Navegación ────────────────────────────────────────────

    [ForeignKey("PatientUserId")]
    public User Patient { get; set; } = null!;

    [ForeignKey("DoctorId")]
    public Doctor Doctor { get; set; } = null!;

    [ForeignKey("ChatPlanId")]
    public ChatPlan Plan { get; set; } = null!;

    public List<ChatMessage> Messages { get; set; } = new();
}
