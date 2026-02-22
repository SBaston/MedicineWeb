using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicineBackend.Models;

/// <summary>
/// Entidad base para todos los usuarios del sistema.
/// Contiene información de autenticación y rol.
/// </summary>
public class User
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Hash de la contraseña (nunca almacenar en texto plano)
    /// Se usará BCrypt o similar para hashear
    /// </summary>
    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// Rol del usuario: Admin, Doctor, Patient
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string Role { get; set; } = string.Empty;

    /// <summary>
    /// Indica si el usuario está activo en el sistema
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Indica si el email ha sido verificado
    /// </summary>
    public bool IsEmailVerified { get; set; } = false;

    /// <summary>
    /// Token de verificación de email
    /// </summary>
    [MaxLength(500)]
    public string? EmailVerificationToken { get; set; }

    /// <summary>
    /// Token para resetear contraseña
    /// </summary>
    [MaxLength(500)]
    public string? PasswordResetToken { get; set; }

    /// <summary>
    /// Fecha de expiración del token de reset
    /// </summary>
    public DateTime? PasswordResetTokenExpiry { get; set; }

    /// <summary>
    /// Último inicio de sesión
    /// </summary>
    public DateTime? LastLogin { get; set; }

    /// <summary>
    /// Fecha de creación del usuario
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Fecha de última actualización
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    // ============================================
    // RELACIONES
    // ============================================

    /// <summary>
    /// Relación 1:1 con Doctor (si el rol es Doctor)
    /// </summary>
    public Doctor? Doctor { get; set; }

    /// <summary>
    /// Relación 1:1 con Patient (si el rol es Patient)
    /// </summary>
    public Patient? Patient { get; set; }

    /// <summary>
    /// Relación 1:1 con Admin (si el rol es Admin)
    /// </summary>
    public Admin? Admin { get; set; }
}