using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicineBackend.Models;

/// <summary>
/// Entidad que representa a un administrador de la plataforma.
/// Tiene permisos completos para gestionar doctores, pacientes, cursos, etc.
/// </summary>
public class Admin
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>
    /// Relación con User (FK)
    /// </summary>
    [Required]
    public int UserId { get; set; }

    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Nivel de permisos del admin (ej: SuperAdmin, Admin, Moderator)
    /// </summary>
    [MaxLength(50)]
    public string? PermissionLevel { get; set; } = "Admin";

    /// <summary>
    /// Departamento o área del admin
    /// </summary>
    [MaxLength(100)]
    public string? Department { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // ============================================
    // RELACIONES
    // ============================================

    /// <summary>
    /// Usuario asociado
    /// </summary>
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
}