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
}
