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
}
