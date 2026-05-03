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
