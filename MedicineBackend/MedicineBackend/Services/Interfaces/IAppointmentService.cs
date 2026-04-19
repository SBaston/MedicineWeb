namespace MedicineBackend.Services.Interfaces;

public interface IAppointmentService
{
    /// <summary>
    /// Obtiene los slots disponibles de un doctor para una fecha concreta
    /// </summary>
    Task<List<AvailableSlotDto>> GetAvailableSlotsAsync(int doctorId, DateTime date);

    /// <summary>
    /// Reserva una cita (solo pacientes autenticados)
    /// </summary>
    Task<AppointmentResponseDto> BookAppointmentAsync(int patientUserId, CreateAppointmentDto dto);

    /// <summary>
    /// Obtiene las citas de un doctor (por DoctorId)
    /// </summary>
    Task<List<AppointmentResponseDto>> GetDoctorAppointmentsAsync(int doctorId);

    /// <summary>
    /// Obtiene las citas de un paciente (por UserId)
    /// </summary>
    Task<List<AppointmentResponseDto>> GetPatientAppointmentsAsync(int patientUserId);

    /// <summary>
    /// El doctor añade el enlace de videollamada a una cita online
    /// </summary>
    Task<AppointmentResponseDto> AddMeetingLinkAsync(int doctorId, int appointmentId, AddMeetingLinkDto dto);

    /// <summary>
    /// Cancela una cita
    /// </summary>
    Task CancelAppointmentAsync(int appointmentId, int userId, string role, string reason);
}

// ─────────────────────────────────────────────────────────────
// DTOs
// ─────────────────────────────────────────────────────────────

public class AvailableSlotDto
{
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
    public string Label { get; set; } = "";
}

public class CreateAppointmentDto
{
    public int DoctorId { get; set; }
    public DateTime AppointmentDate { get; set; }
    public string AppointmentType { get; set; } = "presencial"; // "presencial" | "online"
    public string? Reason { get; set; }
}

public class AddMeetingLinkDto
{
    public string MeetingLink { get; set; } = "";
    public string Platform { get; set; } = ""; // Zoom, Teams, Meet, etc.
}

public class AppointmentResponseDto
{
    public int Id { get; set; }
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = "";
    public string DoctorProfilePicture { get; set; } = "";
    public int PatientId { get; set; }
    public string PatientName { get; set; } = "";
    public DateTime AppointmentDate { get; set; }
    public int DurationMinutes { get; set; }
    public string Status { get; set; } = "";
    public decimal Price { get; set; }
    public string AppointmentType { get; set; } = ""; // "presencial" | "online"
    public string? Reason { get; set; }
    public string? MeetingLink { get; set; }
    public string? MeetingPlatform { get; set; }
    public DateTime CreatedAt { get; set; }
}
