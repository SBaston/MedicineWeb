using MedicineBackend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace MedicineBackend.Controllers;

/// <summary>
/// Controlador de citas médicas
/// </summary>
[ApiController]
[Route("api/appointments")]
public class AppointmentController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;
    private readonly ILogger<AppointmentController> _logger;

    public AppointmentController(IAppointmentService appointmentService, ILogger<AppointmentController> logger)
    {
        _appointmentService = appointmentService;
        _logger = logger;
    }

    // ─────────────────────────────────────────────────────────────
    // ENDPOINT PÚBLICO: Obtener slots disponibles de un doctor
    // GET /api/appointments/available-slots/{doctorId}?date=YYYY-MM-DD
    // ─────────────────────────────────────────────────────────────

    [HttpGet("available-slots/{doctorId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvailableSlots(int doctorId, [FromQuery] string date)
    {
        try
        {
            if (!DateTime.TryParse(date, out var parsedDate))
                return BadRequest(new { message = "Formato de fecha inválido. Usa YYYY-MM-DD" });

            if (parsedDate.Date < DateTime.UtcNow.Date)
                return BadRequest(new { message = "No puedes consultar fechas pasadas" });

            var slots = await _appointmentService.GetAvailableSlotsAsync(doctorId, parsedDate);
            return Ok(slots);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener slots disponibles del doctor {DoctorId}", doctorId);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    // ─────────────────────────────────────────────────────────────
    // RESERVAR CITA (solo Pacientes)
    // POST /api/appointments
    // ─────────────────────────────────────────────────────────────

    [HttpPost]
    [Authorize(Roles = "Patient")]
    public async Task<IActionResult> BookAppointment([FromBody] CreateAppointmentDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var appointment = await _appointmentService.BookAppointmentAsync(userId, dto);
            return Ok(appointment);
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
            _logger.LogError(ex, "Error al reservar cita");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    // ─────────────────────────────────────────────────────────────
    // MIS CITAS (Paciente)
    // GET /api/appointments/my
    // ─────────────────────────────────────────────────────────────

    [HttpGet("my")]
    [Authorize(Roles = "Patient")]
    public async Task<IActionResult> GetMyAppointments()
    {
        try
        {
            var userId = GetCurrentUserId();
            var appointments = await _appointmentService.GetPatientAppointmentsAsync(userId);
            return Ok(appointments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener citas del paciente");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    // ─────────────────────────────────────────────────────────────
    // CANCELAR CITA
    // PUT /api/appointments/{id}/cancel
    // ─────────────────────────────────────────────────────────────

    [HttpPut("{id}/cancel")]
    [Authorize(Roles = "Patient,Doctor")]
    public async Task<IActionResult> CancelAppointment(int id, [FromBody] CancelAppointmentRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "Patient";
            await _appointmentService.CancelAppointmentAsync(id, userId, role, request.Reason ?? "");
            return Ok(new { message = "Cita cancelada correctamente" });
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
            _logger.LogError(ex, "Error al cancelar cita {Id}", id);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    // ─────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out var userId))
            throw new UnauthorizedAccessException("Token inválido");
        return userId;
    }
}

public class CancelAppointmentRequest
{
    public string? Reason { get; set; }
}
