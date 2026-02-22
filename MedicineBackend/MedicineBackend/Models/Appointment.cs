using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicineBackend.Models;

/// <summary>
/// Entidad que representa una cita médica entre un paciente y un doctor.
/// </summary>
public class Appointment
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>
    /// ID del doctor
    /// </summary>
    [Required]
    public int DoctorId { get; set; }

    /// <summary>
    /// ID del paciente
    /// </summary>
    [Required]
    public int PatientId { get; set; }

    /// <summary>
    /// Fecha y hora de la cita
    /// </summary>
    [Required]
    public DateTime AppointmentDate { get; set; }

    /// <summary>
    /// Duración de la cita en minutos (por defecto 60)
    /// </summary>
    public int DurationMinutes { get; set; } = 60;

    /// <summary>
    /// Estado de la cita: Pendiente, Confirmada, Completada, Cancelada, NoAsistio
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Pendiente";

    /// <summary>
    /// Precio de la cita
    /// </summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal Price { get; set; }

    /// <summary>
    /// Motivo de la consulta
    /// </summary>
    [MaxLength(1000)]
    public string? Reason { get; set; }

    /// <summary>
    /// Notas del doctor sobre la cita
    /// </summary>
    [MaxLength(2000)]
    public string? DoctorNotes { get; set; }

    /// <summary>
    /// Notas del paciente
    /// </summary>
    [MaxLength(1000)]
    public string? PatientNotes { get; set; }

    /// <summary>
    /// Enlace a la videoconferencia (Google Meet, Zoom, etc.)
    /// </summary>
    [MaxLength(500)]
    public string? MeetingLink { get; set; }

    /// <summary>
    /// Tipo de plataforma de videoconferencia: GoogleMeet, Zoom, Teams, Interno
    /// </summary>
    [MaxLength(50)]
    public string? MeetingPlatform { get; set; }

    /// <summary>
    /// Indica si se envió recordatorio al paciente
    /// </summary>
    public bool ReminderSent { get; set; } = false;

    /// <summary>
    /// Motivo de cancelación (si aplica)
    /// </summary>
    [MaxLength(500)]
    public string? CancellationReason { get; set; }

    /// <summary>
    /// Quién canceló la cita: Doctor, Patient, System
    /// </summary>
    [MaxLength(20)]
    public string? CancelledBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }

    // ============================================
    // RELACIONES
    // ============================================

    [ForeignKey("DoctorId")]
    public Doctor Doctor { get; set; } = null!;

    [ForeignKey("PatientId")]
    public Patient Patient { get; set; } = null!;
}