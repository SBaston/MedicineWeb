// ═══════════════════════════════════════════════════════════════
// Controllers/VideoCallController.cs
// Videollamadas con Jitsi Meet — gratis, sin límites, WebRTC.
// Seguridad: nombre de sala = UUID aleatorio almacenado en BD,
// imposible de adivinar sin tener acceso a la cita.
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

    // Servidor Jitsi público — gratuito y sin límites
    private const string JitsiServer = "https://meet.jit.si";

    public VideoCallController(AppDbContext db, ILogger<VideoCallController> logger)
    {
        _db     = db;
        _logger = logger;
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/appointments/{id}/video-room
    // Devuelve (o genera) la sala Jitsi para la cita.
    // El nombre de sala es un UUID que solo conocen doctor y paciente.
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

            // ── Generar nombre de sala si no existe ya ──────────
            // Formato: nexussalud-{uuid corto} → imposible de adivinar
            if (string.IsNullOrEmpty(appointment.MeetingLink) ||
                appointment.MeetingPlatform != "Jitsi")
            {
                var roomId  = Guid.NewGuid().ToString("N")[..16]; // 16 hex chars
                var roomUrl = $"{JitsiServer}/nexussalud-{roomId}";

                appointment.MeetingLink     = roomUrl;
                appointment.MeetingPlatform = "Jitsi";
                appointment.UpdatedAt       = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                _logger.LogInformation(
                    "Sala Jitsi creada para cita {AppointmentId}: {RoomUrl}", id, roomUrl);
            }

            return Ok(new
            {
                roomUrl         = appointment.MeetingLink,
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
