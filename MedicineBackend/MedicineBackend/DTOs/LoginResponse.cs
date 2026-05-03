namespace MedicineBackend.DTOs.Auth;

/// <summary>
/// DTO para respuesta de login exitoso
/// </summary>
public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }

    // 2FA: si es true, el cliente debe pedir el código TOTP antes de recibir el JWT real
    public bool RequiresTwoFactor { get; set; } = false;

    // 2FA: si es true, el usuario es Admin y debe configurar 2FA antes de acceder
    // Se devuelve Token temporal para poder llamar a los endpoints de setup
    public bool RequiresTwoFactorSetup { get; set; } = false;
}

/// <summary>Solicitud de verificación TOTP durante el login (paso 2)</summary>
public class TwoFactorLoginRequest
{
    public int UserId   { get; set; }
    public string Code  { get; set; } = string.Empty;
}

/// <summary>Solicitud para activar o verificar la configuración de 2FA</summary>
public class TwoFactorVerifyRequest
{
    public string Code { get; set; } = string.Empty;
}

/// <summary>Respuesta con los datos para configurar 2FA (QR + clave manual)</summary>
public class TwoFactorSetupResponse
{
    /// <summary>URI otpauth:// para generar el QR</summary>
    public string OtpAuthUri    { get; set; } = string.Empty;
    /// <summary>Clave secreta en Base32 para introducción manual</summary>
    public string ManualEntryKey { get; set; } = string.Empty;
}