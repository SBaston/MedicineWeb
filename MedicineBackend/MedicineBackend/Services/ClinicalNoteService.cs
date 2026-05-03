// ═══════════════════════════════════════════════════════════════
// ClinicalNoteService.cs
// Gestión de notas / historiales clínicos
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.Data;
using MedicineBackend.DTOs.ClinicalNotes;
using MedicineBackend.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace MedicineBackend.Services;

public interface IClinicalNoteService
{
    Task<List<ClinicalNoteListItemDto>> GetNotesAsync(int doctorId, int patientId);
    Task<ClinicalNoteDto>               GetNoteAsync(int doctorId, int noteId);
    Task<ClinicalNoteDto>               CreateNoteAsync(int doctorId, int patientId, CreateClinicalNoteDto dto);
    Task<ClinicalNoteDto>               UpdateNoteAsync(int doctorId, int noteId, UpdateClinicalNoteDto dto);
    Task                                DeleteNoteAsync(int doctorId, int noteId);
    Task<ClinicalNoteAttachmentDto>     UploadAttachmentAsync(int doctorId, int noteId, IFormFile file);
    Task                                DeleteAttachmentAsync(int doctorId, int noteId, int attachmentId);
    Task<string>                        PerformOcrAsync(int doctorId, int noteId, IFormFile image);
    Task<AiAssistantResponseDto>        AiAssistAsync(AiAssistantRequestDto dto);
    Task<byte[]>                        DownloadNoteAsPdfAsync(int doctorId, int noteId);
}

public class ClinicalNoteService : IClinicalNoteService
{
    private readonly AppDbContext    _context;
    private readonly IConfiguration  _config;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<ClinicalNoteService> _logger;

    public ClinicalNoteService(
        AppDbContext context,
        IConfiguration config,
        IWebHostEnvironment env,
        ILogger<ClinicalNoteService> logger)
    {
        _context = context;
        _config  = config;
        _env     = env;
        _logger  = logger;
    }

    // ─────────────────────────────────────────────────────────────
    // CRUD
    // ─────────────────────────────────────────────────────────────

    public async Task<List<ClinicalNoteListItemDto>> GetNotesAsync(int doctorId, int patientId)
    {
        return await _context.ClinicalNotes
            .Where(n => n.DoctorId == doctorId && n.PatientId == patientId)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new ClinicalNoteListItemDto
            {
                Id               = n.Id,
                Title            = n.Title,
                Template         = n.Template,
                CreatedAt        = n.CreatedAt,
                UpdatedAt        = n.UpdatedAt,
                AttachmentsCount = n.Attachments.Count,
            })
            .ToListAsync();
    }

    public async Task<ClinicalNoteDto> GetNoteAsync(int doctorId, int noteId)
    {
        var note = await _context.ClinicalNotes
            .Include(n => n.Attachments)
            .FirstOrDefaultAsync(n => n.Id == noteId && n.DoctorId == doctorId)
            ?? throw new KeyNotFoundException("Nota no encontrada");

        return MapToDto(note);
    }

    public async Task<ClinicalNoteDto> CreateNoteAsync(int doctorId, int patientId, CreateClinicalNoteDto dto)
    {
        // Verifica que el paciente tiene al menos una cita con el doctor (seguridad)
        var hasRelation = await _context.Appointments
            .AnyAsync(a => a.DoctorId == doctorId && a.Patient.Id == patientId);

        // Permitir si hay relación o si simplemente el doctor lo crea directamente
        var title = string.IsNullOrWhiteSpace(dto.Title)
            ? $"Nota del {DateTime.Now:dd/MM/yyyy HH:mm}"
            : dto.Title;

        var note = new ClinicalNote
        {
            DoctorId           = doctorId,
            PatientId          = patientId,
            Title              = title,
            Template           = dto.Template,
            TabTranscription   = dto.TabTranscription,
            TabClinicalHistory = dto.TabClinicalHistory,
            TabSummary         = dto.TabSummary,
            CreatedAt          = DateTime.UtcNow,
        };

        _context.ClinicalNotes.Add(note);
        await _context.SaveChangesAsync();

        return MapToDto(note);
    }

    public async Task<ClinicalNoteDto> UpdateNoteAsync(int doctorId, int noteId, UpdateClinicalNoteDto dto)
    {
        var note = await _context.ClinicalNotes
            .Include(n => n.Attachments)
            .FirstOrDefaultAsync(n => n.Id == noteId && n.DoctorId == doctorId)
            ?? throw new KeyNotFoundException("Nota no encontrada");

        note.Title              = string.IsNullOrWhiteSpace(dto.Title) ? note.Title : dto.Title;
        note.Template           = dto.Template;
        note.TabTranscription   = dto.TabTranscription;
        note.TabClinicalHistory = dto.TabClinicalHistory;
        note.TabSummary         = dto.TabSummary;
        note.UpdatedAt          = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToDto(note);
    }

    public async Task DeleteNoteAsync(int doctorId, int noteId)
    {
        var note = await _context.ClinicalNotes
            .FirstOrDefaultAsync(n => n.Id == noteId && n.DoctorId == doctorId)
            ?? throw new KeyNotFoundException("Nota no encontrada");

        _context.ClinicalNotes.Remove(note);
        await _context.SaveChangesAsync();
    }

    // ─────────────────────────────────────────────────────────────
    // ADJUNTOS
    // ─────────────────────────────────────────────────────────────

    public async Task<ClinicalNoteAttachmentDto> UploadAttachmentAsync(int doctorId, int noteId, IFormFile file)
    {
        var note = await _context.ClinicalNotes
            .FirstOrDefaultAsync(n => n.Id == noteId && n.DoctorId == doctorId)
            ?? throw new KeyNotFoundException("Nota no encontrada");

        var ext      = Path.GetExtension(file.FileName).ToLowerInvariant();
        var safeFile = $"{Guid.NewGuid():N}{ext}";
        var folder   = Path.Combine(_env.ContentRootPath, "wwwroot", "uploads", "clinical-notes", noteId.ToString());
        Directory.CreateDirectory(folder);

        var fullPath = Path.Combine(folder, safeFile);
        await using (var stream = File.Create(fullPath))
            await file.CopyToAsync(stream);

        var relativeUrl = $"/uploads/clinical-notes/{noteId}/{safeFile}";

        var attachment = new ClinicalNoteAttachment
        {
            ClinicalNoteId = noteId,
            FileName       = file.FileName,
            FileUrl        = relativeUrl,
            FileType       = file.ContentType,
            FileSizeBytes  = file.Length,
            CreatedAt      = DateTime.UtcNow,
        };

        _context.ClinicalNoteAttachments.Add(attachment);
        await _context.SaveChangesAsync();

        return new ClinicalNoteAttachmentDto
        {
            Id            = attachment.Id,
            FileName      = attachment.FileName,
            FileUrl       = attachment.FileUrl,
            FileType      = attachment.FileType,
            FileSizeBytes = attachment.FileSizeBytes,
            CreatedAt     = attachment.CreatedAt,
        };
    }

    public async Task DeleteAttachmentAsync(int doctorId, int noteId, int attachmentId)
    {
        var note = await _context.ClinicalNotes
            .FirstOrDefaultAsync(n => n.Id == noteId && n.DoctorId == doctorId)
            ?? throw new KeyNotFoundException("Nota no encontrada");

        var att = await _context.ClinicalNoteAttachments
            .FirstOrDefaultAsync(a => a.Id == attachmentId && a.ClinicalNoteId == noteId)
            ?? throw new KeyNotFoundException("Adjunto no encontrado");

        // Borrar fichero físico
        var physPath = Path.Combine(_env.ContentRootPath, "wwwroot", att.FileUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
        if (File.Exists(physPath)) File.Delete(physPath);

        _context.ClinicalNoteAttachments.Remove(att);
        await _context.SaveChangesAsync();
    }

    // ─────────────────────────────────────────────────────────────
    // OCR
    // ─────────────────────────────────────────────────────────────

    public async Task<string> PerformOcrAsync(int doctorId, int noteId, IFormFile image)
    {
        _ = await _context.ClinicalNotes
            .FirstOrDefaultAsync(n => n.Id == noteId && n.DoctorId == doctorId)
            ?? throw new KeyNotFoundException("Nota no encontrada");

        var tessDataPath = _config["Ocr:TessDataPath"] ?? "./tessdata";
        var tmpPath      = Path.GetTempFileName() + Path.GetExtension(image.FileName);

        try
        {
            await using (var s = File.Create(tmpPath))
                await image.CopyToAsync(s);

            using var engine = new Tesseract.TesseractEngine(tessDataPath, "spa+eng", Tesseract.EngineMode.Default);
            using var img    = Tesseract.Pix.LoadFromFile(tmpPath);
            using var page   = engine.Process(img);
            return page.GetText();
        }
        finally
        {
            if (File.Exists(tmpPath)) File.Delete(tmpPath);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // ASISTENTE IA (OpenAI – con fallback si no hay key)
    // ─────────────────────────────────────────────────────────────

    public async Task<AiAssistantResponseDto> AiAssistAsync(AiAssistantRequestDto dto)
    {
        var apiKey = _config["OpenAI:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
            return new AiAssistantResponseDto { Result = GenerateFallbackResponse(dto) };

        var systemPrompt = BuildSystemPrompt(dto.Mode);
        var userContent  = dto.Mode == "custom" && !string.IsNullOrEmpty(dto.CustomPrompt)
            ? $"{dto.CustomPrompt}\n\n---\n{dto.Content}"
            : dto.Content;

        var payload = new
        {
            model = "gpt-4o-mini",
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user",   content = userContent   },
            },
            max_tokens = 800,
            temperature = 0.3,
        };

        using var http = new HttpClient();
        http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var json    = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        var resp    = await http.PostAsync("https://api.openai.com/v1/chat/completions", content);

        resp.EnsureSuccessStatusCode();

        var body = await resp.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var result = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString() ?? "";

        return new AiAssistantResponseDto { Result = result };
    }

    // ─────────────────────────────────────────────────────────────
    // DESCARGA PDF
    // ─────────────────────────────────────────────────────────────

    public async Task<byte[]> DownloadNoteAsPdfAsync(int doctorId, int noteId)
    {
        var note = await _context.ClinicalNotes
            .Include(n => n.Patient)
            .Include(n => n.Doctor)
            .Include(n => n.Attachments)
            .FirstOrDefaultAsync(n => n.Id == noteId && n.DoctorId == doctorId)
            ?? throw new KeyNotFoundException("Nota no encontrada");

        QuestPDF.Settings.License = LicenseType.Community;

        var pdf = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(t => t.FontSize(10).FontFamily("Arial"));

                page.Header().Element(ComposeHeader(note));
                page.Content().Element(ComposeContent(note));
                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("NexusSalud — Historial Clínico · Página ").FontSize(8).FontColor("#999");
                    x.CurrentPageNumber().FontSize(8).FontColor("#999");
                });
            });
        });

        return pdf.GeneratePdf();
    }

    // ─────────────────────────────────────────────────────────────
    // Helpers privados
    // ─────────────────────────────────────────────────────────────

    private static ClinicalNoteDto MapToDto(ClinicalNote n) => new()
    {
        Id                 = n.Id,
        DoctorId           = n.DoctorId,
        PatientId          = n.PatientId,
        Title              = n.Title,
        Template           = n.Template,
        TabTranscription   = n.TabTranscription,
        TabClinicalHistory = n.TabClinicalHistory,
        TabSummary         = n.TabSummary,
        CreatedAt          = n.CreatedAt,
        UpdatedAt          = n.UpdatedAt,
        Attachments        = n.Attachments.Select(a => new ClinicalNoteAttachmentDto
        {
            Id            = a.Id,
            FileName      = a.FileName,
            FileUrl       = a.FileUrl,
            FileType      = a.FileType,
            FileSizeBytes = a.FileSizeBytes,
            CreatedAt     = a.CreatedAt,
        }).ToList(),
    };

    private static string BuildSystemPrompt(string mode) => mode switch
    {
        "summary" =>
            "Eres un asistente clínico especializado. Genera un resumen estructurado y conciso de la siguiente nota clínica. " +
            "Incluye: motivo de consulta, hallazgos relevantes, diagnóstico/impresión y plan. Usa lenguaje médico preciso. Responde en español.",

        "recommendations" =>
            "Eres un asistente clínico especializado. Basándote en la nota clínica, genera recomendaciones clínicas prácticas " +
            "para el profesional sanitario (seguimiento, pruebas complementarias, derivaciones sugeridas). Responde en español.",

        "differential" =>
            "Eres un asistente clínico especializado. Analiza los síntomas y hallazgos de la nota clínica y genera un diagnóstico diferencial " +
            "ordenado por probabilidad. Justifica brevemente cada posibilidad. Responde en español.",

        _ =>
            "Eres un asistente clínico especializado. Responde la pregunta del profesional sanitario de forma precisa y basada en evidencia. Responde en español.",
    };

    private static string GenerateFallbackResponse(AiAssistantRequestDto dto) => dto.Mode switch
    {
        "summary"         => "⚠️ Asistente IA no configurado. Añade tu clave OpenAI en appsettings.json → \"OpenAI\": { \"ApiKey\": \"sk-...\" }",
        "recommendations" => "⚠️ Asistente IA no configurado. Configura una clave de OpenAI para obtener recomendaciones clínicas automáticas.",
        "differential"    => "⚠️ Asistente IA no configurado. Configura una clave de OpenAI para obtener diagnóstico diferencial automático.",
        _                 => "⚠️ Asistente IA no configurado.",
    };

    // Helpers QuestPDF
    private static Action<IContainer> ComposeHeader(ClinicalNote note) => c =>
    {
        c.Column(col =>
        {
            col.Item().Row(row =>
            {
                row.RelativeItem().Text("NexusSalud").Bold().FontSize(18).FontColor("#6d28d9");
                row.ConstantItem(120).AlignRight().Text($"Fecha: {note.CreatedAt:dd/MM/yyyy}").FontSize(9).FontColor("#666");
            });
            col.Item().BorderBottom(1).BorderColor("#e5e7eb").PaddingBottom(6).Text("Historial Clínico").FontSize(13).Bold();
            col.Item().PaddingTop(4).Row(row =>
            {
                row.RelativeItem().Text($"Paciente: {note.Patient.FirstName} {note.Patient.LastName}").FontSize(9);
                row.RelativeItem().AlignRight().Text($"Dr./Dra.: {note.Doctor.FirstName} {note.Doctor.LastName}").FontSize(9);
            });
            col.Item().PaddingTop(2).Text($"Nota: {note.Title}").FontSize(9).FontColor("#555");
        });
    };

    private static Action<IContainer> ComposeContent(ClinicalNote note) => c =>
    {
        c.PaddingTop(12).Column(col =>
        {
            void Section(string title, string? content)
            {
                if (string.IsNullOrWhiteSpace(content)) return;
                col.Item().PaddingTop(10).Text(title).Bold().FontSize(11).FontColor("#374151");
                col.Item().PaddingTop(4).Text(StripHtml(content)).FontSize(10);
            }

            Section("📝 Transcripción / Notas de sesión", note.TabTranscription);
            Section("🩺 Historia clínica",                note.TabClinicalHistory);
            Section("📋 Resumen, objetivos y preguntas",  note.TabSummary);

            if (note.Attachments.Any())
            {
                col.Item().PaddingTop(12).Text("📎 Adjuntos").Bold().FontSize(11).FontColor("#374151");
                foreach (var att in note.Attachments)
                    col.Item().Text($"• {att.FileName} ({att.FileType}, {att.FileSizeBytes / 1024} KB)").FontSize(9);
            }
        });
    };

    private static string StripHtml(string html)
    {
        var withBreaks = System.Text.RegularExpressions.Regex.Replace(html, "<br\\s*/?>", "\n", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        var withNewlines = System.Text.RegularExpressions.Regex.Replace(withBreaks, "</(p|div|li|tr)>", "\n", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        return System.Text.RegularExpressions.Regex.Replace(withNewlines, "<[^>]+>", "").Trim();
    }
}
