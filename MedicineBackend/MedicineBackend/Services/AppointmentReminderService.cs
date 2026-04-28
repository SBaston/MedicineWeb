// ═══════════════════════════════════════════════════════════════
// Services/AppointmentReminderService.cs
// BackgroundService que envía recordatorios de cita a paciente y
// doctor aproximadamente 24 horas antes del inicio.
// Se ejecuta cada hora. Usa el campo ReminderSent para no duplicar.
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.Data;
using MedicineBackend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MedicineBackend.Services;

public class AppointmentReminderService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AppointmentReminderService> _logger;

    // Ventana de "24 horas antes": buscamos citas cuyo inicio esté
    // entre ahora + 23 h y ahora + 25 h (margen de ±1 h por el ciclo).
    private static readonly TimeSpan WindowLow  = TimeSpan.FromHours(23);
    private static readonly TimeSpan WindowHigh = TimeSpan.FromHours(25);
    private static readonly TimeSpan Interval   = TimeSpan.FromHours(1);

    public AppointmentReminderService(
        IServiceScopeFactory scopeFactory,
        ILogger<AppointmentReminderService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger       = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AppointmentReminderService iniciado.");

        // Espera inicial para no solapar el arranque con otras tareas
        await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SendPendingRemindersAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Error en AppointmentReminderService");
            }

            await Task.Delay(Interval, stoppingToken);
        }
    }

    private async Task SendPendingRemindersAsync(CancellationToken ct)
    {
        await using var scope    = _scopeFactory.CreateAsyncScope();
        var db                   = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var emailService         = scope.ServiceProvider.GetRequiredService<IEmailService>();
        var now                  = DateTime.UtcNow;
        var windowStart          = now.Add(WindowLow);
        var windowEnd            = now.Add(WindowHigh);

        // Citas activas cuya hora de inicio cae en la ventana de 24 h
        // y a las que aún no se les ha enviado el recordatorio
        var upcoming = await db.Appointments
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .Where(a =>
                !a.ReminderSent &&
                (a.Status == "Pendiente" || a.Status == "Confirmada") &&
                a.AppointmentDate >= windowStart &&
                a.AppointmentDate <= windowEnd)
            .ToListAsync(ct);

        if (upcoming.Count == 0) return;

        _logger.LogInformation(
            "AppointmentReminderService: {Count} recordatorio(s) pendiente(s).", upcoming.Count);

        foreach (var appt in upcoming)
        {
            try
            {
                var patientName     = $"{appt.Patient.FirstName} {appt.Patient.LastName}";
                var doctorName      = $"{appt.Doctor.FirstName} {appt.Doctor.LastName}";
                var appointmentType = !string.IsNullOrEmpty(appt.MeetingPlatform) ? "online" : "presencial";

                // Recordatorio al paciente
                await emailService.SendAppointmentReminderAsync(
                    appt.Patient.User.Email,
                    patientName, doctorName,
                    appt.AppointmentDate,
                    appointmentType);

                await Task.Delay(600, ct); // pausa entre emails para Mailtrap

                // Recordatorio al doctor
                await emailService.SendAppointmentReminderToDoctorAsync(
                    appt.Doctor.User.Email,
                    doctorName, patientName,
                    appt.AppointmentDate,
                    appointmentType);

                // Marcar como enviado
                appt.ReminderSent = true;

                _logger.LogInformation(
                    "Recordatorio enviado para cita {Id} ({Date})", appt.Id, appt.AppointmentDate);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al enviar recordatorio para cita {Id}", appt.Id);
                // No marcamos ReminderSent para reintentarlo en el próximo ciclo
            }
        }

        await db.SaveChangesAsync(ct);
    }
}
