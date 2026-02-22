using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicineBackend.Models;

/// <summary>
/// Entidad que representa la disponibilidad horaria de un doctor.
/// Permite definir franjas horarias disponibles por día de la semana.
/// </summary>
public class DoctorAvailability
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
    /// Día de la semana (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
    /// </summary>
    [Required]
    [Range(0, 6)]
    public int DayOfWeek { get; set; }

    /// <summary>
    /// Hora de inicio de la disponibilidad
    /// </summary>
    [Required]
    public TimeSpan StartTime { get; set; }

    /// <summary>
    /// Hora de fin de la disponibilidad
    /// </summary>
    [Required]
    public TimeSpan EndTime { get; set; }

    /// <summary>
    /// Indica si este horario está disponible
    /// </summary>
    public bool IsAvailable { get; set; } = true;

    /// <summary>
    /// Notas adicionales sobre este horario
    /// </summary>
    [MaxLength(500)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // ============================================
    // RELACIONES
    // ============================================

    [ForeignKey("DoctorId")]
    public Doctor Doctor { get; set; } = null!;

    // ============================================
    // PROPIEDADES CALCULADAS
    // ============================================

    [NotMapped]
    public string DayName
    {
        get
        {
            return DayOfWeek switch
            {
                0 => "Domingo",
                1 => "Lunes",
                2 => "Martes",
                3 => "Miércoles",
                4 => "Jueves",
                5 => "Viernes",
                6 => "Sábado",
                _ => "Desconocido"
            };
        }
    }
}