using MedicineBackend.DTOs.Auth;

namespace MedicineBackend.Services.Interfaces;

/// <summary>
/// Interfaz del servicio de autenticación
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Registra un nuevo usuario en el sistema
    /// </summary>
    Task<LoginResponse> RegisterAsync(RegisterRequest request);

    /// <summary>
    /// Autentica a un usuario y retorna un token JWT
    /// </summary>
    Task<LoginResponse> LoginAsync(LoginRequest request);

    /// <summary>
    /// Verifica si un email ya está registrado
    /// </summary>
    Task<bool> EmailExistsAsync(string email);

    /// <summary>
    /// Envía (o reenvía) el código de verificación de 6 dígitos al email del usuario
    /// </summary>
    Task SendVerificationCodeAsync(string email);

    /// <summary>
    /// Verifica el código de 6 dígitos introducido por el usuario
    /// </summary>
    Task VerifyEmailCodeAsync(string email, string code);

    /// <summary>
    /// Genera un token de reset de contraseña y lo envía por email
    /// </summary>
    Task ForgotPasswordAsync(string email);

    /// <summary>
    /// Restablece la contraseña usando el token recibido por email
    /// </summary>
    Task ResetPasswordAsync(string token, string newPassword);

    // ── 2FA ──────────────────────────────────────────────────────────

    /// <summary>Genera el secreto TOTP y devuelve la URI para el QR + la clave manual</summary>
    Task<TwoFactorSetupResponse> GenerateTwoFactorSetupAsync(int userId);

    /// <summary>Verifica el código TOTP, activa el 2FA y devuelve los 8 códigos de recuperación en texto plano</summary>
    Task<string[]> EnableTwoFactorAsync(int userId, string code);

    /// <summary>Desactiva el 2FA tras verificar el código TOTP actual</summary>
    Task DisableTwoFactorAsync(int userId, string code);

    /// <summary>Verifica el código TOTP en el paso 2 del login y devuelve el JWT completo</summary>
    Task<LoginResponse> VerifyTwoFactorLoginAsync(int userId, string code);

    /// <summary>Valida un código de recuperación (en lugar del TOTP) y devuelve el JWT completo. Invalida el código usado.</summary>
    Task<LoginResponse> UseRecoveryCodeAsync(int userId, string recoveryCode);

    /// <summary>Desactiva el 2FA de cualquier usuario (acción de Admin, sin verificación TOTP)</summary>
    Task AdminDisableTwoFactorAsync(int targetUserId);
}
