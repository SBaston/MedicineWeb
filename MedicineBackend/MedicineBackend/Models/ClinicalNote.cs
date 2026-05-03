using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicineBackend.Models;

/// <summary>
/// Nota / historial clínico creado por un doctor sobre un paciente.
/// </summary>
public class ClinicalNote
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int DoctorId { get; set; }

    [Required]
    public int PatientId { get; set; }

    /// <summary>Título de la nota (auto-generado si no se especifica)</summary>
    [MaxLength(300)]
    public string Title { get; set; } = string.Empty;

    /// <summary>Plantilla usada (opcional, ej: "SOAP", "Seguimiento")</summary>
    [MaxLength(100)]
    public string? Template { get; set; }

    // ── Contenido por pestañas (HTML / texto rico) ──
    public string? TabTranscription   { get; set; }
    public string? TabClinicalHistory { get; set; }
    public string? TabSummary         { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // ── Relaciones ──
    [ForeignKey("DoctorId")]
    public Doctor Doctor { get; set; } = null!;

    [ForeignKey("PatientId")]
    public Patient Patient { get; set; } = null!;

    public ICollection<ClinicalNoteAttachment> Attachments { get; set; } = new List<ClinicalNoteAttachment>();
}

/// <summary>
/// Archivo adjunto a una nota clínica (PDF importado, imagen, Word, etc.)
/// </summary>
public class ClinicalNoteAttachment
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int ClinicalNoteId { get; set; }

    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string FileUrl { get; set; } = string.Empty;

    /// <summary>MIME type, ej: application/pdf</summary>
    [MaxLength(100)]
    public string FileType { get; set; } = string.Empty;

    public long FileSizeBytes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("ClinicalNoteId")]
    public ClinicalNote ClinicalNote { get; set; } = null!;
}
