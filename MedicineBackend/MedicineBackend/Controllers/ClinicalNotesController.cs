// ═══════════════════════════════════════════════════════════════
// ClinicalNotesController.cs
// Gestión de historiales / notas clínicas del doctor
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.Data;
using MedicineBackend.DTOs.ClinicalNotes;
using MedicineBackend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace MedicineBackend.Controllers;

[ApiController]
[Route("api/doctor")]
[Authorize(Roles = "Doctor")]
public class ClinicalNotesController : ControllerBase
{
    private readonly IClinicalNoteService _service;
    private readonly AppDbContext         _context;
    private readonly ILogger<ClinicalNotesController> _logger;

    public ClinicalNotesController(IClinicalNoteService service, AppDbContext context, ILogger<ClinicalNotesController> logger)
    {
        _service = service;
        _context = context;
        _logger  = logger;
    }

    private async Task<int> GetDoctorIdAsync()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == userId)
            ?? throw new UnauthorizedAccessException("Doctor no encontrado");
        return doctor.Id;
    }

    // ── Lista de pacientes únicos del doctor ─────────────────────
    /// <summary>
    /// Devuelve todos los pacientes distintos vinculados al doctor:
    /// - Los que han tenido al menos una cita
    /// - Los que tienen una suscripción de chat activa (aunque no hayan tenido cita)
    /// </summary>
    [HttpGet("patients")]
    public async Task<IActionResult> GetMyPatients([FromQuery] string? search)
    {
        try
        {
            var doctorId = await GetDoctorIdAsync();

            // ── 1. Pacientes por citas ──────────────────────────────
            var fromAppointments = await _context.Appointments
                .Where(a => a.DoctorId == doctorId)
                .GroupBy(a => a.PatientId)
                .Select(g => new
                {
                    patientId         = g.Key,
                    firstName         = g.First().Patient.FirstName,
                    lastName          = g.First().Patient.LastName,
                    email             = g.First().Patient.User.Email,
                    totalAppointments = g.Count(),
                    lastAppointment   = (DateTime?)g.Max(a => a.AppointmentDate),
                })
                .ToListAsync();

            // ── 2. Pacientes solo por suscripción de chat ───────────
            // ChatSubscription usa PatientUserId (User.Id), hay que cruzar con Patient
            var appointmentPatientIds = fromAppointments.Select(p => p.patientId).ToHashSet();

            var fromChat = await _context.ChatSubscriptions
                .Where(s => s.DoctorId == doctorId)
                .Join(_context.Patients,
                    s => s.PatientUserId,
                    p => p.UserId,
                    (s, p) => new { s, p })
                .GroupBy(x => x.p.Id)
                .Where(g => !appointmentPatientIds.Contains(g.Key)) // evitar duplicados
                .Select(g => new
                {
                    patientId         = g.Key,
                    firstName         = g.First().p.FirstName,
                    lastName          = g.First().p.LastName,
                    email             = g.First().p.User.Email,
                    totalAppointments = 0,
                    lastAppointment   = (DateTime?)null,
                })
                .ToListAsync();

            // ── 3. Combinar, filtrar y ordenar ──────────────────────
            var combined = fromAppointments.Concat(fromChat).ToList();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.ToLower();
                combined = combined.Where(p =>
                    (p.firstName + " " + p.lastName).ToLower().Contains(s) ||
                    p.email.ToLower().Contains(s)).ToList();
            }

            combined = combined.OrderBy(p => p.firstName).ThenBy(p => p.lastName).ToList();

            // ── 4. Detectar nombres duplicados → mostrar email ──────
            var duplicateNames = combined
                .GroupBy(p => (p.firstName + " " + p.lastName).Trim().ToLower())
                .Where(g => g.Count() > 1)
                .Select(g => g.Key)
                .ToHashSet();

            var result = combined.Select(p => new
            {
                p.patientId,
                fullName    = $"{p.firstName} {p.lastName}".Trim(),
                displayName = duplicateNames.Contains((p.firstName + " " + p.lastName).Trim().ToLower())
                    ? $"{p.firstName} {p.lastName} ({p.email})"
                    : $"{p.firstName} {p.lastName}".Trim(),
                p.email,
                p.totalAppointments,
                p.lastAppointment,
            }).ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetMyPatients");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // ── Datos básicos de un paciente (para el doctor) ────────────
    /// <summary>
    /// Devuelve nombre, email y fecha de nacimiento de un paciente
    /// vinculado al doctor (por cita o por suscripción de chat).
    /// </summary>
    [HttpGet("patients/{patientId:int}")]
    public async Task<IActionResult> GetPatientBasicInfo(int patientId)
    {
        try
        {
            var doctorId = await GetDoctorIdAsync();

            // Verificar vínculo: cita o suscripción de chat
            var hasAppointment = await _context.Appointments
                .AnyAsync(a => a.DoctorId == doctorId && a.PatientId == patientId);

            var hasChatSub = !hasAppointment && await _context.ChatSubscriptions
                .Join(_context.Patients,
                    s => s.PatientUserId,
                    p => p.UserId,
                    (s, p) => new { s.DoctorId, PatientId = p.Id })
                .AnyAsync(x => x.DoctorId == doctorId && x.PatientId == patientId);

            if (!hasAppointment && !hasChatSub)
                return NotFound(new { message = "Paciente no encontrado o sin vínculo con este doctor" });

            var patient = await _context.Patients
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == patientId);

            if (patient == null)
                return NotFound(new { message = "Paciente no encontrado" });

            return Ok(new
            {
                patientId   = patient.Id,
                fullName    = $"{patient.FirstName} {patient.LastName}".Trim(),
                email       = patient.User.Email,
                dateOfBirth = patient.DateOfBirth,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetPatientBasicInfo patientId={PatientId}", patientId);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // ── Listar notas de un paciente ──────────────────────────────
    [HttpGet("patients/{patientId:int}/clinical-notes")]
    public async Task<IActionResult> GetNotes(int patientId)
    {
        try
        {
            var doctorId = await GetDoctorIdAsync();
            var notes    = await _service.GetNotesAsync(doctorId, patientId);
            return Ok(notes);
        }
        catch (Exception ex) { _logger.LogError(ex, "GetNotes"); return StatusCode(500, new { message = ex.Message }); }
    }

    // ── Obtener nota concreta ────────────────────────────────────
    [HttpGet("clinical-notes/{noteId:int}")]
    public async Task<IActionResult> GetNote(int noteId)
    {
        try
        {
            var doctorId = await GetDoctorIdAsync();
            var note     = await _service.GetNoteAsync(doctorId, noteId);
            return Ok(note);
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (Exception ex) { _logger.LogError(ex, "GetNote"); return StatusCode(500, new { message = ex.Message }); }
    }

    // ── Crear nota ───────────────────────────────────────────────
    [HttpPost("patients/{patientId:int}/clinical-notes")]
    public async Task<IActionResult> CreateNote(int patientId, [FromBody] CreateClinicalNoteDto dto)
    {
        try
        {
            var doctorId = await GetDoctorIdAsync();
            var note     = await _service.CreateNoteAsync(doctorId, patientId, dto);
            return CreatedAtAction(nameof(GetNote), new { noteId = note.Id }, note);
        }
        catch (Exception ex) { _logger.LogError(ex, "CreateNote"); return StatusCode(500, new { message = ex.Message }); }
    }

    // ── Actualizar nota ──────────────────────────────────────────
    [HttpPut("clinical-notes/{noteId:int}")]
    public async Task<IActionResult> UpdateNote(int noteId, [FromBody] UpdateClinicalNoteDto dto)
    {
        try
        {
            var doctorId = await GetDoctorIdAsync();
            var note     = await _service.UpdateNoteAsync(doctorId, noteId, dto);
            return Ok(note);
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (Exception ex) { _logger.LogError(ex, "UpdateNote"); return StatusCode(500, new { message = ex.Message }); }
    }

    // ── Eliminar nota ────────────────────────────────────────────
    [HttpDelete("clinical-notes/{noteId:int}")]
    public async Task<IActionResult> DeleteNote(int noteId)
    {
        try
        {
            var doctorId = await GetDoctorIdAsync();
            await _service.DeleteNoteAsync(doctorId, noteId);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (Exception ex) { _logger.LogError(ex, "DeleteNote"); return StatusCode(500, new { message = ex.Message }); }
    }

    // ── Subir adjunto ────────────────────────────────────────────
    [HttpPost("clinical-notes/{noteId:int}/attachments")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadAttachment(int noteId, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No se ha enviado ningún archivo" });

        try
        {
            var doctorId = await GetDoctorIdAsync();
            var att      = await _service.UploadAttachmentAsync(doctorId, noteId, file);
            return Ok(att);
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (Exception ex) { _logger.LogError(ex, "UploadAttachment"); return StatusCode(500, new { message = ex.Message }); }
    }

    // ── Eliminar adjunto ─────────────────────────────────────────
    [HttpDelete("clinical-notes/{noteId:int}/attachments/{attachmentId:int}")]
    public async Task<IActionResult> DeleteAttachment(int noteId, int attachmentId)
    {
        try
        {
            var doctorId = await GetDoctorIdAsync();
            await _service.DeleteAttachmentAsync(doctorId, noteId, attachmentId);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (Exception ex) { _logger.LogError(ex, "DeleteAttachment"); return StatusCode(500, new { message = ex.Message }); }
    }

    // ── OCR: imagen → texto ──────────────────────────────────────
    [HttpPost("clinical-notes/{noteId:int}/ocr")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> OcrImage(int noteId, IFormFile image)
    {
        if (image == null || image.Length == 0)
            return BadRequest(new { message = "No se ha enviado ninguna imagen" });

        try
        {
            var doctorId = await GetDoctorIdAsync();
            var text     = await _service.PerformOcrAsync(doctorId, noteId, image);
            return Ok(new { text });
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (Exception ex) { _logger.LogError(ex, "OCR"); return StatusCode(500, new { message = ex.Message }); }
    }

    // ── Asistente IA ─────────────────────────────────────────────
    [HttpPost("clinical-notes/ai-assist")]
    public async Task<IActionResult> AiAssist([FromBody] AiAssistantRequestDto dto)
    {
        try
        {
            var result = await _service.AiAssistAsync(dto);
            return Ok(result);
        }
        catch (Exception ex) { _logger.LogError(ex, "AiAssist"); return StatusCode(500, new { message = ex.Message }); }
    }

    // ── Descargar nota como PDF ──────────────────────────────────
    [HttpGet("clinical-notes/{noteId:int}/download")]
    public async Task<IActionResult> DownloadPdf(int noteId)
    {
        try
        {
            var doctorId = await GetDoctorIdAsync();
            var pdf      = await _service.DownloadNoteAsPdfAsync(doctorId, noteId);
            return File(pdf, "application/pdf", $"nota-clinica-{noteId}.pdf");
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (Exception ex) { _logger.LogError(ex, "DownloadPdf"); return StatusCode(500, new { message = ex.Message }); }
    }
}
