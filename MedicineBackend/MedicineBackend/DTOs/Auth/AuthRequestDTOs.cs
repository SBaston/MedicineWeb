namespace MedicineBackend.DTOs.Auth;

public class SendVerificationRequest
{
    public string Email { get; set; } = string.Empty;
}

public class VerifyEmailRequest
{
    public string Email { get; set; } = string.Empty;
    public string Code  { get; set; } = string.Empty;
}

public class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    public string Token       { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

/// <summary>
/// Cuerpo del endpoint POST /auth/2fa/use-recovery-code
/// </summary>
public class UseRecoveryCodeRequest
{
    public int    UserId { get; set; }
    public string Code   { get; set; } = string.Empty;
}
