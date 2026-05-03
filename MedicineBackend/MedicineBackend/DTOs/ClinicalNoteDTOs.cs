namespace MedicineBackend.DTOs.ClinicalNotes;

// ── Lista (sidebar) ──────────────────────────────────────────
public class ClinicalNoteListItemDto
{
    public int    Id        { get; set; }
    public string Title     { get; set; } = string.Empty;
    public string? Template { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int AttachmentsCount { get; set; }
}

// ── Detalle completo ──────────────────────────────────────────
public class ClinicalNoteDto
{
    public int    Id        { get; set; }
    public int    DoctorId  { get; set; }
    public int    PatientId { get; set; }
    public string Title     { get; set; } = string.Empty;
    public string? Template { get; set; }
    public string? TabTranscription   { get; set; }
    public string? TabClinicalHistory { get; set; }
    public string? TabSummary         { get; set; }
    public DateTime  CreatedAt  { get; set; }
    public DateTime? UpdatedAt  { get; set; }
    public List<ClinicalNoteAttachmentDto> Attachments { get; set; } = new();
}

// ── Crear ──────────────────────────────────────────────────────
public class CreateClinicalNoteDto
{
    public string  Title    { get; set; } = string.Empty;
    public string? Template { get; set; }
    public string? TabTranscription   { get; set; }
    public string? TabClinicalHistory { get; set; }
    public string? TabSummary         { get; set; }
}

// ── Actualizar ──────────────────────────────────────────────────
public class UpdateClinicalNoteDto
{
    public string  Title    { get; set; } = string.Empty;
    public string? Template { get; set; }
    public string? TabTranscription   { get; set; }
    public string? TabClinicalHistory { get; set; }
    public string? TabSummary         { get; set; }
}

// ── Adjunto ────────────────────────────────────────────────────
public class ClinicalNoteAttachmentDto
{
    public int    Id           { get; set; }
    public string FileName     { get; set; } = string.Empty;
    public string FileUrl      { get; set; } = string.Empty;
    public string FileType     { get; set; } = string.Empty;
    public long   FileSizeBytes { get; set; }
    public DateTime CreatedAt  { get; set; }
}

// ── Asistente IA ──────────────────────────────────────────────
public class AiAssistantRequestDto
{
    /// <summary>Modo: "summary" | "recommendations" | "differential" | "custom"</summary>
    public string Mode    { get; set; } = "summary";
    /// <summary>Contenido a analizar (texto plano)</summary>
    public string Content { get; set; } = string.Empty;
    /// <summary>Pregunta libre cuando mode = "custom"</summary>
    public string? CustomPrompt { get; set; }
}

public class AiAssistantResponseDto
{
    public string Result { get; set; } = string.Empty;
}
