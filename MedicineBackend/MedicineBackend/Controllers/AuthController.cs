using MedicineBackend.DTOs.Auth;
using MedicineBackend.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace MedicineBackend.Controllers;

/// <summary>
/// Controlador de autenticación y registro de usuarios
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, IEmailService emailService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _emailService = emailService;
        _logger = logger;
    }

    /// <summary>
    /// Endpoint de diagnóstico: envía un email de prueba para verificar la configuración SMTP
    /// </summary>
    [HttpPost("test-email")]
    [AllowAnonymous]
    public async Task<IActionResult> TestEmail([FromBody] SendVerificationRequest request)
    {
        try
        {
            await _emailService.SendEmailVerificationCodeAsync(request.Email, "Usuario Prueba", "123456");
            return Ok(new { message = $"Email de prueba enviado correctamente a {request.Email}" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Error al enviar email",
                error = ex.Message,
                inner = ex.InnerException?.Message
            });
        }
    }

    /// <summary>
    /// Registra un nuevo usuario en el sistema
    /// </summary>
    /// <param name="request">Datos del usuario a registrar</param>
    /// <returns>Token JWT y datos del usuario</returns>
    [HttpPost("register")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var response = await _authService.RegisterAsync(request);
            _logger.LogInformation("Usuario registrado exitosamente: {Email}", request.Email);
            return CreatedAtAction(nameof(Register), new { email = request.Email }, response);  //SE REGISTRA CON ÉXITO EL USUARIO Y DEVUELVE EL CÓDIGO 201 (CREADO)
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Error en registro: {Message}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado al registrar usuario");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Inicia sesión de un usuario
    /// </summary>
    /// <param name="request">Credenciales del usuario</param>
    /// <returns>Token JWT y datos del usuario</returns>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);
            _logger.LogInformation("Usuario autenticado exitosamente: {Email}", request.Email);
            return Ok(response);  //DEVUELVE EL CÓDIGO 200 (OK)
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Intento de login fallido: {Email}", request.Email);
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado al hacer login");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Verifica si un email está disponible
    /// </summary>
    [HttpGet("check-email")]
    [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckEmail([FromQuery] string email)
    {
        var exists = await _authService.EmailExistsAsync(email);
        return Ok(new { exists });
    }

    // ══════════════════════════════════════════════════════════════
    // VERIFICACIÓN DE EMAIL POR CÓDIGO
    // ══════════════════════════════════════════════════════════════

    /// <summary>
    /// Envía (o reenvía) el código de verificación de 6 dígitos al email indicado.
    /// </summary>
    [HttpPost("send-verification")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SendVerification([FromBody] SendVerificationRequest request)
    {
        try
        {
            await _authService.SendVerificationCodeAsync(request.Email);
            return Ok(new { message = "Código enviado correctamente" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al enviar código de verificación");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Verifica el código de 6 dígitos introducido por el usuario.
    /// </summary>
    [HttpPost("verify-email")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        try
        {
            await _authService.VerifyEmailCodeAsync(request.Email, request.Code);
            return Ok(new { message = "Email verificado correctamente" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al verificar email");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    // ══════════════════════════════════════════════════════════════
    // RECUPERACIÓN DE CONTRASEÑA
    // ══════════════════════════════════════════════════════════════

    /// <summary>
    /// Solicita el envío del enlace de recuperación de contraseña.
    /// Siempre responde 200 OK por seguridad (no revela si el email existe).
    /// </summary>
    [HttpPost("forgot-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        try
        {
            await _authService.ForgotPasswordAsync(request.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en forgot-password");
        }
        // Siempre OK para no revelar si el email está registrado
        return Ok(new { message = "Si el email existe en nuestro sistema, recibirás un enlace en breve" });
    }

    // ══════════════════════════════════════════════════════════════
    // 2FA — TOTP
    // ══════════════════════════════════════════════════════════════

    /// <summary>
    /// Paso 2 del login: verifica el código TOTP y devuelve el JWT real.
    /// </summary>
    [HttpPost("2fa/login-verify")]
    [AllowAnonymous]
    public async Task<IActionResult> TwoFactorLoginVerify([FromBody] TwoFactorLoginRequest request)
    {
        try
        {
            var response = await _authService.VerifyTwoFactorLoginAsync(request.UserId, request.Code);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en verificación 2FA de login");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Inicia la configuración de 2FA: devuelve QR URI + clave manual.
    /// Requiere estar autenticado.
    /// </summary>
    [HttpPost("2fa/setup")]
    [Authorize]
    public async Task<IActionResult> TwoFactorSetup()
    {
        try
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out var userId))
                return Unauthorized();

            var setup = await _authService.GenerateTwoFactorSetupAsync(userId);
            return Ok(setup);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al generar setup de 2FA");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Confirma la activación del 2FA verificando el primer código TOTP.
    /// Devuelve los 8 códigos de recuperación en texto plano (solo se muestran una vez).
    /// </summary>
    [HttpPost("2fa/enable")]
    [Authorize]
    public async Task<IActionResult> TwoFactorEnable([FromBody] TwoFactorVerifyRequest request)
    {
        try
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out var userId))
                return Unauthorized();

            var recoveryCodes = await _authService.EnableTwoFactorAsync(userId, request.Code);
            return Ok(new
            {
                message       = "Autenticación en dos factores activada correctamente",
                recoveryCodes = recoveryCodes
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al activar 2FA");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Paso 2 del login con recuperación: usa un código de recuperación en lugar del TOTP.
    /// Devuelve el JWT completo e invalida el código usado.
    /// </summary>
    [HttpPost("2fa/use-recovery-code")]
    [AllowAnonymous]
    public async Task<IActionResult> UseRecoveryCode([FromBody] UseRecoveryCodeRequest request)
    {
        try
        {
            var response = await _authService.UseRecoveryCodeAsync(request.UserId, request.Code);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al usar código de recuperación");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Desactiva el 2FA verificando el código TOTP actual.
    /// </summary>
    [HttpPost("2fa/disable")]
    [Authorize]
    public async Task<IActionResult> TwoFactorDisable([FromBody] TwoFactorVerifyRequest request)
    {
        try
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out var userId))
                return Unauthorized();

            await _authService.DisableTwoFactorAsync(userId, request.Code);
            return Ok(new { message = "Autenticación en dos factores desactivada" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al desactivar 2FA");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Restablece la contraseña usando el token del email.
    /// </summary>
    [HttpPost("reset-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            await _authService.ResetPasswordAsync(request.Token, request.NewPassword);
            return Ok(new { message = "Contraseña restablecida correctamente" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al resetear contraseña");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }
}