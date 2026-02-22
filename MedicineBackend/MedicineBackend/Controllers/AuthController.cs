using MedicineBackend.DTOs.Auth;
using MedicineBackend.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace MedicineBackend.Controllers;

/// <summary>
/// Controlador de autenticación y registro de usuarios
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
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
    /// <param name="email">Email a verificar</param>
    /// <returns>True si el email ya existe, False si está disponible</returns>
    [HttpGet("check-email")]
    [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckEmail([FromQuery] string email)
    {
        var exists = await _authService.EmailExistsAsync(email);
        return Ok(new { exists });
    }
}