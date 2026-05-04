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
    /// Código de verificación de email (6 dígitos)
    /// </summary>
    [MaxLength(10)]
    public string? EmailVerificationToken { get; set; }

    /// <summary>
    /// Fecha de expiración del código de verificación de email
    /// </summary>
    public DateTime? EmailVerificationExpiry { get; set; }

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

    // ============================================
    // 2FA — TOTP (Google Authenticator / Authy)
    // ============================================

    /// <summary>Indica si el usuario tiene 2FA activado</summary>
    public bool TwoFactorEnabled { get; set; } = false;

    /// <summary>Clave secreta Base32 para generar códigos TOTP (cifrada en BD)</summary>
    [MaxLength(256)]
    public string? TwoFactorSecret { get; set; }

    /// <summary>
    /// Códigos de recuperación de un solo uso para acceder si se pierde el dispositivo 2FA.
    /// Almacenados como JSON array de hashes SHA-256.
    /// </summary>
    public string? RecoveryCodes { get; set; }

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