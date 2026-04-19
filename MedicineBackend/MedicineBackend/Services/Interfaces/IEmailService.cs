namespace MedicineBackend.Services.Interfaces;

/// <summary>
/// Servicio de envío de emails para notificaciones de citas
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Envía email de confirmación de cita al paciente
    /// </summary>
    Task SendAppointmentConfirmationToPatientAsync(
        string patientEmail,
        string patientName,
        string doctorName,
        DateTime appointmentDate,
        string appointmentType,
        decimal price,
        string reason);

    /// <summary>
    /// Notifica al doctor de una nueva cita reservada
    /// </summary>
    Task SendNewAppointmentNotificationToDoctorAsync(
        string doctorEmail,
        string doctorName,
        string patientName,
        DateTime appointmentDate,
        string appointmentType,
        string reason);

    /// <summary>
    /// Envía el enlace de videollamada al paciente
    /// </summary>
    Task SendMeetingLinkToPatientAsync(
        string patientEmail,
        string patientName,
        string doctorName,
        DateTime appointmentDate,
        string meetingLink,
        string platform);

    /// <summary>
    /// Envía recordatorio de cita (24h antes)
    /// </summary>
    Task SendAppointmentReminderAsync(
        string patientEmail,
        string patientName,
        string doctorName,
        DateTime appointmentDate,
        string appointmentType,
        string? meetingLink = null);
}
