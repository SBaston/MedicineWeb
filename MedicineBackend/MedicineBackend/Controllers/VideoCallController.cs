// ═══════════════════════════════════════════════════════════════
// Controllers/VideoCallController.cs
// Puerta de acceso a las videollamadas WebRTC nativas.
// Valida que el usuario pertenece a la cita, que la cita es online
// y que se encuentra dentro de la ventana horaria permitida.
// La señalización P2P ocurre en VideoHub (SignalR).
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.Extensions.Logging;

namespace MedicineBackend.Controllers;

[ApiController]
[Route("api/appointments")]
[Authorize(Roles = "Doctor,Patient")]
public class VideoCallController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<VideoCallController> _logger;

    public VideoCallController(AppDbContext db, ILogger<VideoCallController> logger)
    {
        _db     = db;
        _logger = logger;
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/appointments/{id}/video-room
    // Valida acceso y devuelve los datos de la cita para la UI.
    // La sala SignalR se identifica directamente por appointmentId.
    // ─────────────────────────────────────────────────────────────
    [HttpPost("{id:int}/video-room")]
    public async Task<IActionResult> GetVideoRoom(int id)
    {
        try
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var role      = User.FindFirst(ClaimTypes.Role)?.Value;

            if (!int.TryParse(userIdStr, out var userId))
                return Unauthorized(new { message = "Usuario no autenticado" });

            // ── Cargar la cita ──────────────────────────────────
            var appointment = await _db.Appointments
                .Include(a => a.Doctor)
                .Include(a => a.Patient)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (appointment == null)
                return NotFound(new { message = "Cita no encontrada" });

            // ── Verificar que la cita sea online ────────────────
            // MeetingPlatform == null → cita presencial
            if (appointment.MeetingPlatform == null)
                return StatusCode(403, new { message = "Esta cita no es online" });

            // ── Verificar ventana de tiempo ──────────────────────
            // Permitir acceso desde 5 minutos antes hasta el fin de la cita
            var utcNow    = DateTime.UtcNow;
            var startUtc  = appointment.AppointmentDate.Kind == DateTimeKind.Utc
                            ? appointment.AppointmentDate
                            : DateTime.SpecifyKind(appointment.AppointmentDate, DateTimeKind.Utc);
            var earlyOpen = startUtc.AddMinutes(-5);
            var endTime   = startUtc.AddMinutes(appointment.DurationMinutes);

            if (utcNow < earlyOpen)
                return StatusCode(403, new
                {
                    message = $"La videollamada aún no está disponible. Podrás acceder a partir de las {earlyOpen:HH:mm} UTC.",
                    availableAt = earlyOpen,
                });

            if (utcNow > endTime)
                return StatusCode(410, new { message = "El tiempo de esta cita ya ha finalizado." });

            // ── Verificar estado de la cita ──────────────────────
            if (appointment.Status == "Cancelada")
                return StatusCode(403, new { message = "Esta cita ha sido cancelada." });

            // ── Verificar que el usuario pertenece a esta cita ──
            string displayName;

            if (role == "Doctor")
            {
                var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
                if (doctor == null || doctor.Id != appointment.DoctorId)
                    return StatusCode(403, new { message = "No tienes acceso a esta cita" });

                displayName = $"Dr. {doctor.FirstName} {doctor.LastName}";
            }
            else
            {
                var patient = await _db.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
                if (patient == null || patient.Id != appointment.PatientId)
                    return StatusCode(403, new { message = "No tienes acceso a esta cita" });

                displayName = $"{patient.FirstName} {patient.LastName}";
            }

            // La sala de señalización WebRTC se identifica por el appointmentId
            // directamente — no necesitamos generar ningún UUID ni URL externa.
            _logger.LogInformation(
                "Acceso a videollamada aprobado para cita {AppointmentId} por {Role} {UserId}",
                id, role, userId);

            return Ok(new
            {
                displayName,
                appointmentId   = appointment.Id,
                appointmentDate = appointment.AppointmentDate,
                durationMinutes = appointment.DurationMinutes,
                doctorName      = $"Dr. {appointment.Doctor.FirstName} {appointment.Doctor.LastName}",
                patientName     = $"{appointment.Patient.FirstName} {appointment.Patient.LastName}",
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al preparar videollamada para cita {AppointmentId}", id);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }
}
