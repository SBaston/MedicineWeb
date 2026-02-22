using MedicineBackend.DTOs.Patient;
using MedicineBackend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace MedicineBackend.Controllers;

/// <summary>
/// Controlador para la gestión de pacientes
/// Responsabilidad: Solo manejo de HTTP (request/response)
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Patient")]
public class PatientsController : ControllerBase
{
    private readonly IPatientService _patientService;
    private readonly ILogger<PatientsController> _logger;

    public PatientsController(IPatientService patientService, ILogger<PatientsController> logger)
    {
        _patientService = patientService;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene el perfil del paciente actual autenticado
    /// </summary>
    /// <returns>Perfil del paciente con % de completitud</returns>
    [HttpGet("me")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyProfile()
    {
        try
        {
            var userId = GetCurrentUserId();
            var patient = await _patientService.GetPatientByUserIdAsync(userId);

            if (patient == null)
            {
                return NotFound(new { message = "Paciente no encontrado" });
            }

            // Calcular completitud del perfil
            var profileCompletion = _patientService.CalculateProfileCompletion(patient);

            // Respuesta enriquecida con metadata
            var response = new
            {
                patient,
                profileCompletion,
                isProfileComplete = profileCompletion == 100
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener perfil del paciente");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Actualiza el perfil del paciente actual
    /// </summary>
    /// <param name="request">Datos a actualizar</param>
    [HttpPut("me")]
    [ProducesResponseType(typeof(PatientProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdatePatientProfileRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var updatedPatient = await _patientService.UpdatePatientProfileAsync(userId, request);

            return Ok(updatedPatient);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar perfil del paciente");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Obtiene las próximas citas del paciente
    /// </summary>
    [HttpGet("me/appointments")]
    [ProducesResponseType(typeof(List<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyAppointments()
    {
        try
        {
            var userId = GetCurrentUserId();
            var appointments = await _patientService.GetPatientAppointmentsAsync(userId);

            return Ok(appointments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener citas del paciente");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Obtiene los cursos en los que está inscrito el paciente
    /// </summary>
    [HttpGet("me/courses")]
    [ProducesResponseType(typeof(List<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyCourses()
    {
        try
        {
            var userId = GetCurrentUserId();
            var courses = await _patientService.GetPatientCoursesAsync(userId);

            return Ok(courses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener cursos del paciente");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    #region Métodos auxiliares

    /// <summary>
    /// Obtiene el UserId del usuario autenticado actual
    /// </summary>
    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Usuario no autenticado correctamente");
        }

        return userId;
    }

    #endregion
}