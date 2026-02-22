using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicineBackend.Models;
/// <summary>
/// Entidad que representa especialidades médicas.
/// Relación muchos-a-muchos con Doctor.
/// </summary>
public class Specialty
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// URL del icono de la especialidad
    /// </summary>
    [MaxLength(500)]
    public string? IconUrl { get; set; }

    /// <summary>
    /// Indica si la especialidad está activa
    /// </summary>
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ============================================
    // RELACIONES
    // ============================================

    /// <summary>
    /// Doctores que tienen esta especialidad
    /// </summary>
    public ICollection<Doctor> Doctors { get; set; } = new List<Doctor>();
}