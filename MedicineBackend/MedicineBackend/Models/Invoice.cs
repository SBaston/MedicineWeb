// ═══════════════════════════════════════════════════════════════
// Models/Invoice.cs
// Factura conforme a RD 1619/2012 (Hacienda España)
// ═══════════════════════════════════════════════════════════════

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicineBackend.Models;

/// <summary>
/// Factura ordinaria conforme al Real Decreto 1619/2012
/// que regula las obligaciones de facturación en España.
/// Cada pago completado genera exactamente una factura.
/// </summary>
public class Invoice
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    // ─── Número de factura ─────────────────────────────────────
    /// <summary>
    /// Número secuencial: F-YYYY-NNNN (ej: F-2026-0001).
    /// Único por año, nunca debe reutilizarse ni tener huecos.
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string InvoiceNumber { get; set; } = string.Empty;

    /// <summary>Año al que pertenece la serie para la numeración correlativa.</summary>
    public int SeriesYear { get; set; }

    /// <summary>Número correlativo dentro del año (sin formato).</summary>
    public int SeriesSequence { get; set; }

    // ─── Fechas ────────────────────────────────────────────────
    /// <summary>Fecha de expedición de la factura (art. 9 RD 1619/2012).</summary>
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;

    // ─── Referencia al pago ────────────────────────────────────
    public int? PaymentId { get; set; }
    public int? ChatSubscriptionId { get; set; }

    // ─── Emisor (NexusSalud) ───────────────────────────────────
    [MaxLength(200)]
    public string IssuerName { get; set; } = "NexusSalud S.L.";

    [MaxLength(20)]
    public string IssuerNif { get; set; } = string.Empty;

    [MaxLength(500)]
    public string IssuerAddress { get; set; } = string.Empty;

    // ─── Receptor (comprador) ──────────────────────────────────
    [MaxLength(200)]
    public string RecipientName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? RecipientNif { get; set; }

    [MaxLength(500)]
    public string? RecipientAddress { get; set; }

    [Required]
    [MaxLength(255)]
    public string RecipientEmail { get; set; } = string.Empty;

    // ─── Concepto ──────────────────────────────────────────────
    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    /// <summary>Tipo de operación: Cita | Curso | ChatPremium</summary>
    [MaxLength(50)]
    public string OperationType { get; set; } = string.Empty;

    // ─── Importes (art. 6 RD 1619/2012) ───────────────────────
    /// <summary>Base imponible (precio neto antes de IVA).</summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal BaseImponible { get; set; }

    /// <summary>Tipo de IVA aplicado (ej: 0.21 para 21%).</summary>
    [Column(TypeName = "decimal(5,4)")]
    public decimal IvaRate { get; set; }

    /// <summary>Cuota de IVA = BaseImponible × IvaRate.</summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal CuotaIva { get; set; }

    /// <summary>Total factura = BaseImponible + CuotaIva.</summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal Total { get; set; }

    [MaxLength(3)]
    public string Currency { get; set; } = "EUR";

    // ─── Clasificación ─────────────────────────────────────────
    /// <summary>Ordinaria (>= 400 €) | Simplificada (< 400 €, art. 4 RD 1619).</summary>
    [MaxLength(20)]
    public string InvoiceType { get; set; } = "Simplificada";

    // ─── Estado y email ────────────────────────────────────────
    [MaxLength(20)]
    public string Status { get; set; } = "Emitida";

    public bool EmailSent { get; set; } = false;
    public DateTime? EmailSentAt { get; set; }

    // ─── Navegación ────────────────────────────────────────────
    [ForeignKey("PaymentId")]
    public Payment? Payment { get; set; }

    [ForeignKey("ChatSubscriptionId")]
    public ChatSubscription? ChatSubscription { get; set; }
}
