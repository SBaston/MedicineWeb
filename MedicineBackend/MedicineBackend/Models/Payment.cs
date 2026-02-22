using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicineBackend.Models;

/// <summary>
/// Entidad que representa pagos realizados en la plataforma.
/// Registra tanto pagos de citas como de cursos.
/// </summary>
public class Payment
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>
    /// ID del paciente que realiza el pago
    /// </summary>
    [Required]
    public int PatientId { get; set; }

    /// <summary>
    /// ID del doctor que recibe el pago
    /// </summary>
    [Required]
    public int DoctorId { get; set; }

    /// <summary>
    /// ID de la cita (si el pago es por una cita)
    /// </summary>
    public int? AppointmentId { get; set; }

    /// <summary>
    /// ID del curso (si el pago es por un curso)
    /// </summary>
    public int? CourseId { get; set; }

    /// <summary>
    /// Monto total del pago
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal Amount { get; set; }

    /// <summary>
    /// Moneda del pago (EUR, USD, etc.)
    /// </summary>
    [MaxLength(3)]
    public string Currency { get; set; } = "EUR";

    /// <summary>
    /// Comisión de la plataforma
    /// </summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal PlatformFee { get; set; }

    /// <summary>
    /// Monto que recibe el doctor (Amount - PlatformFee)
    /// </summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal DoctorAmount { get; set; }

    /// <summary>
    /// Estado del pago: Pendiente, Completado, Fallido, Reembolsado
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Pendiente";

    /// <summary>
    /// Método de pago: Tarjeta, PayPal, Transferencia, etc.
    /// </summary>
    [MaxLength(50)]
    public string? PaymentMethod { get; set; }

    /// <summary>
    /// Tipo de pago: Cita, Curso
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string PaymentType { get; set; } = string.Empty;

    /// <summary>
    /// ID de la transacción en el procesador de pagos (Stripe, PayPal, etc.)
    /// </summary>
    [MaxLength(255)]
    public string? TransactionId { get; set; }

    /// <summary>
    /// Proveedor del servicio de pago: Stripe, PayPal, etc.
    /// </summary>
    [MaxLength(50)]
    public string? PaymentProvider { get; set; } = "Stripe";

    /// <summary>
    /// JSON con metadata adicional del pago
    /// </summary>
    [MaxLength(2000)]
    public string? Metadata { get; set; }

    /// <summary>
    /// Descripción del pago
    /// </summary>
    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// Motivo de reembolso (si aplica)
    /// </summary>
    [MaxLength(500)]
    public string? RefundReason { get; set; }

    /// <summary>
    /// Fecha del pago
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Fecha de procesamiento
    /// </summary>
    public DateTime? ProcessedAt { get; set; }

    /// <summary>
    /// Fecha de reembolso
    /// </summary>
    public DateTime? RefundedAt { get; set; }

    // ============================================
    // RELACIONES
    // ============================================

    [ForeignKey("PatientId")]
    public Patient Patient { get; set; } = null!;

    [ForeignKey("DoctorId")]
    public Doctor Doctor { get; set; } = null!;

    [ForeignKey("AppointmentId")]
    public Appointment? Appointment { get; set; }

    [ForeignKey("CourseId")]
    public Course? Course { get; set; }
}