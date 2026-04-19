using MedicineBackend.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Mail;

namespace MedicineBackend.Services;

/// <summary>
/// Servicio de email via SMTP (Gmail configurado en appsettings.json)
/// </summary>
public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly string _smtpServer;
    private readonly int _smtpPort;
    private readonly string _senderEmail;
    private readonly string _senderName;
    private readonly string _username;
    private readonly string _password;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        _smtpServer = configuration["EmailSettings:SmtpServer"] ?? "smtp.gmail.com";
        _smtpPort = int.Parse(configuration["EmailSettings:SmtpPort"] ?? "587");
        _senderEmail = configuration["EmailSettings:SenderEmail"] ?? "noreply@nexussalud.com";
        _senderName = configuration["EmailSettings:SenderName"] ?? "NexusSalud";
        _username = configuration["EmailSettings:Username"] ?? "";
        _password = configuration["EmailSettings:Password"] ?? "";
    }

    public async Task SendAppointmentConfirmationToPatientAsync(
        string patientEmail, string patientName, string doctorName,
        DateTime appointmentDate, string appointmentType, decimal price, string reason)
    {
        var isOnline = appointmentType?.ToLower() == "online";
        var typeText = isOnline ? "Online (videollamada)" : "Presencial";
        var onlineNote = isOnline
            ? "<p style='color:#2563eb;'>📹 <strong>Recibirás el enlace de la videollamada por email antes de la cita.</strong></p>"
            : "<p style='color:#059669;'>📍 <strong>El profesional te contactará con los detalles de ubicación.</strong></p>";

        var subject = $"✅ Cita confirmada con {doctorName} - {appointmentDate:dd/MM/yyyy HH:mm}";
        var body = $@"
<html><body style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;'>
  <div style='background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:32px;border-radius:12px 12px 0 0;text-align:center;'>
    <h1 style='color:white;margin:0;font-size:24px;'>🏥 NexusSalud</h1>
    <p style='color:#bfdbfe;margin:8px 0 0;'>Tu plataforma de salud de confianza</p>
  </div>
  <div style='background:#f8fafc;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;'>
    <h2 style='color:#1e40af;'>¡Cita confirmada, {patientName}! ✅</h2>
    <p>Tu cita ha sido reservada correctamente. Aquí tienes los detalles:</p>
    <div style='background:white;border-radius:8px;padding:20px;border:1px solid #e2e8f0;margin:16px 0;'>
      <table style='width:100%;border-collapse:collapse;'>
        <tr><td style='padding:8px 0;color:#6b7280;'>👨‍⚕️ Profesional</td><td style='padding:8px 0;font-weight:600;'>Dr/Dra. {doctorName}</td></tr>
        <tr><td style='padding:8px 0;color:#6b7280;'>📅 Fecha</td><td style='padding:8px 0;font-weight:600;'>{appointmentDate:dddd, dd MMMM yyyy}</td></tr>
        <tr><td style='padding:8px 0;color:#6b7280;'>🕐 Hora</td><td style='padding:8px 0;font-weight:600;'>{appointmentDate:HH:mm}</td></tr>
        <tr><td style='padding:8px 0;color:#6b7280;'>💻 Modalidad</td><td style='padding:8px 0;font-weight:600;'>{typeText}</td></tr>
        <tr><td style='padding:8px 0;color:#6b7280;'>💰 Precio</td><td style='padding:8px 0;font-weight:600;'>{price:F2} €</td></tr>
        {(string.IsNullOrEmpty(reason) ? "" : $"<tr><td style='padding:8px 0;color:#6b7280;'>📝 Motivo</td><td style='padding:8px 0;'>{reason}</td></tr>")}
      </table>
    </div>
    {onlineNote}
    <p style='color:#6b7280;font-size:14px;'>Si necesitas cancelar o modificar la cita, por favor hazlo con al menos 24 horas de antelación.</p>
    <p>Un saludo,<br><strong>El equipo de NexusSalud</strong></p>
  </div>
</body></html>";

        await SendEmailAsync(patientEmail, subject, body);
    }

    public async Task SendNewAppointmentNotificationToDoctorAsync(
        string doctorEmail, string doctorName, string patientName,
        DateTime appointmentDate, string appointmentType, string reason)
    {
        var isOnline = appointmentType?.ToLower() == "online";
        var typeText = isOnline ? "Online (videollamada)" : "Presencial";
        var linkReminder = isOnline
            ? "<div style='background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:16px 0;'><p style='color:#1d4ed8;margin:0;'>📹 <strong>Recuerda enviar el enlace de videollamada al paciente antes de la cita.</strong><br>Puedes hacerlo desde tu panel de control en NexusSalud.</p></div>"
            : "";

        var subject = $"📅 Nueva cita reservada - {patientName} - {appointmentDate:dd/MM/yyyy HH:mm}";
        var body = $@"
<html><body style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;'>
  <div style='background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:32px;border-radius:12px 12px 0 0;text-align:center;'>
    <h1 style='color:white;margin:0;font-size:24px;'>🏥 NexusSalud</h1>
  </div>
  <div style='background:#f8fafc;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;'>
    <h2 style='color:#1e40af;'>Nueva cita reservada 📅</h2>
    <p>Hola {doctorName}, tienes una nueva cita confirmada:</p>
    <div style='background:white;border-radius:8px;padding:20px;border:1px solid #e2e8f0;margin:16px 0;'>
      <table style='width:100%;border-collapse:collapse;'>
        <tr><td style='padding:8px 0;color:#6b7280;'>🧑‍💼 Paciente</td><td style='padding:8px 0;font-weight:600;'>{patientName}</td></tr>
        <tr><td style='padding:8px 0;color:#6b7280;'>📅 Fecha</td><td style='padding:8px 0;font-weight:600;'>{appointmentDate:dddd, dd MMMM yyyy}</td></tr>
        <tr><td style='padding:8px 0;color:#6b7280;'>🕐 Hora</td><td style='padding:8px 0;font-weight:600;'>{appointmentDate:HH:mm}</td></tr>
        <tr><td style='padding:8px 0;color:#6b7280;'>💻 Modalidad</td><td style='padding:8px 0;font-weight:600;'>{typeText}</td></tr>
        {(string.IsNullOrEmpty(reason) ? "" : $"<tr><td style='padding:8px 0;color:#6b7280;'>📝 Motivo</td><td style='padding:8px 0;'>{reason}</td></tr>")}
      </table>
    </div>
    {linkReminder}
    <p>Un saludo,<br><strong>El equipo de NexusSalud</strong></p>
  </div>
</body></html>";

        await SendEmailAsync(doctorEmail, subject, body);
    }

    public async Task SendMeetingLinkToPatientAsync(
        string patientEmail, string patientName, string doctorName,
        DateTime appointmentDate, string meetingLink, string platform)
    {
        var subject = $"📹 Enlace de videollamada - {doctorName} - {appointmentDate:dd/MM/yyyy HH:mm}";
        var body = $@"
<html><body style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;'>
  <div style='background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:32px;border-radius:12px 12px 0 0;text-align:center;'>
    <h1 style='color:white;margin:0;font-size:24px;'>🏥 NexusSalud</h1>
  </div>
  <div style='background:#f8fafc;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;'>
    <h2 style='color:#1e40af;'>📹 Tu enlace de videollamada está listo</h2>
    <p>Hola {patientName}, el Dr/Dra. <strong>{doctorName}</strong> ha preparado tu enlace para la consulta online:</p>
    <div style='background:#eff6ff;border-radius:8px;padding:20px;text-align:center;margin:16px 0;border:1px solid #bfdbfe;'>
      <p style='color:#6b7280;margin:0 0 12px;'>📅 {appointmentDate:dddd, dd MMMM yyyy} a las {appointmentDate:HH:mm}</p>
      <p style='color:#6b7280;margin:0 0 16px;'>Plataforma: <strong>{platform}</strong></p>
      <a href='{meetingLink}' style='display:inline-block;background:#2563eb;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;'>
        🔗 Unirse a la videollamada
      </a>
      <p style='color:#9ca3af;font-size:12px;margin:12px 0 0;'>O copia este enlace: {meetingLink}</p>
    </div>
    <p style='color:#6b7280;font-size:14px;'>Te recomendamos que pruebes el enlace unos minutos antes de la cita.</p>
    <p>Un saludo,<br><strong>El equipo de NexusSalud</strong></p>
  </div>
</body></html>";

        await SendEmailAsync(patientEmail, subject, body);
    }

    public async Task SendAppointmentReminderAsync(
        string patientEmail, string patientName, string doctorName,
        DateTime appointmentDate, string appointmentType, string? meetingLink = null)
    {
        var isOnline = appointmentType?.ToLower() == "online";
        var typeText = isOnline ? "Online (videollamada)" : "Presencial";
        var linkSection = (!string.IsNullOrEmpty(meetingLink))
            ? $"<div style='text-align:center;margin:16px 0;'><a href='{meetingLink}' style='display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;'>🔗 Unirse a la videollamada</a></div>"
            : (isOnline ? "<p style='color:#dc2626;'>⚠️ El enlace de videollamada aún no está disponible. Recibirás un email cuando el profesional lo envíe.</p>" : "");

        var subject = $"⏰ Recordatorio: Cita mañana con {doctorName} a las {appointmentDate:HH:mm}";
        var body = $@"
<html><body style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;'>
  <div style='background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px;border-radius:12px 12px 0 0;text-align:center;'>
    <h1 style='color:white;margin:0;font-size:24px;'>⏰ Recordatorio de cita</h1>
  </div>
  <div style='background:#f8fafc;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;'>
    <h2 style='color:#92400e;'>Tu cita es mañana, {patientName}</h2>
    <div style='background:white;border-radius:8px;padding:20px;border:1px solid #e2e8f0;margin:16px 0;'>
      <table style='width:100%;border-collapse:collapse;'>
        <tr><td style='padding:8px 0;color:#6b7280;'>👨‍⚕️ Profesional</td><td style='padding:8px 0;font-weight:600;'>Dr/Dra. {doctorName}</td></tr>
        <tr><td style='padding:8px 0;color:#6b7280;'>📅 Fecha</td><td style='padding:8px 0;font-weight:600;'>{appointmentDate:dddd, dd MMMM yyyy}</td></tr>
        <tr><td style='padding:8px 0;color:#6b7280;'>🕐 Hora</td><td style='padding:8px 0;font-weight:600;'>{appointmentDate:HH:mm}</td></tr>
        <tr><td style='padding:8px 0;color:#6b7280;'>💻 Modalidad</td><td style='padding:8px 0;font-weight:600;'>{typeText}</td></tr>
      </table>
    </div>
    {linkSection}
    <p>Un saludo,<br><strong>El equipo de NexusSalud</strong></p>
  </div>
</body></html>";

        await SendEmailAsync(patientEmail, subject, body);
    }

    // ─────────────────────────────────────────────────────────────
    // MÉTODO PRIVADO: Enviar email
    // ─────────────────────────────────────────────────────────────

    private async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        try
        {
            // Si las credenciales son placeholders, solo loguear (no enviar)
            var isConfigured = !string.IsNullOrEmpty(_username)
                && !_username.StartsWith("TU_")
                && !string.IsNullOrEmpty(_password)
                && !_password.StartsWith("TU_");

            if (!isConfigured)
            {
                _logger.LogInformation(
                    "📧 [EMAIL NO ENVIADO - Sin credenciales] Para: {To} | Asunto: {Subject}" +
                    " → Configura Username/Password en appsettings.json (Mailtrap)",
                    toEmail, subject);
                return;
            }

            using var client = new SmtpClient(_smtpServer, _smtpPort)
            {
                Credentials = new NetworkCredential(_username, _password),
                EnableSsl = true,
            };

            using var message = new MailMessage
            {
                From = new MailAddress(_senderEmail, _senderName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true,
            };
            message.To.Add(toEmail);

            await client.SendMailAsync(message);
            _logger.LogInformation("📧 Email enviado a {To}: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error al enviar email a {To}: {Subject}", toEmail, subject);
            // No relanzar - los emails no deben bloquear el flujo principal
        }
    }
}
