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
    /// Determina si este admin es el SuperAdmin.
    /// Solo debe existir UN superadmin, creado automáticamente al iniciar la aplicación.
    /// El SuperAdmin puede crear y eliminar otros admins.
    /// </summary>
    public bool IsSuperAdmin { get; set; } = false;

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