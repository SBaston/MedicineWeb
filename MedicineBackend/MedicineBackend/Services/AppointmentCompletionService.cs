// ═══════════════════════════════════════════════════════════════
// Services/AppointmentCompletionService.cs
// BackgroundService que marca automáticamente las citas como
// "Completada" cuando ha pasado su hora + duración.
// Se ejecuta cada 5 minutos.
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MedicineBackend.Services;

public class AppointmentCompletionService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AppointmentCompletionService> _logger;
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);

    public AppointmentCompletionService(
        IServiceScopeFactory scopeFactory,
        ILogger<AppointmentCompletionService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger       = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AppointmentCompletionService iniciado.");

        // Espera inicial breve para no bloquear el arranque
        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CompleteExpiredAppointmentsAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Error en AppointmentCompletionService");
            }

            await Task.Delay(Interval, stoppingToken);
        }
    }

    private async Task CompleteExpiredAppointmentsAsync(CancellationToken ct)
    {
        await using var scope   = _scopeFactory.CreateAsyncScope();
        var context             = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var now                 = DateTime.UtcNow;

        // Citas activas cuya hora de fin ya ha pasado
        // Hora de fin = AppointmentDate + DurationMinutes
        var expired = await context.Appointments
            .Where(a => (a.Status == "Pendiente" || a.Status == "Confirmada")
                     && a.AppointmentDate.AddMinutes(a.DurationMinutes) < now)
            .ToListAsync(ct);

        if (expired.Count == 0) return;

        foreach (var appt in expired)
        {
            appt.Status      = "Completada";
            appt.CompletedAt = now;
        }

        await context.SaveChangesAsync(ct);
        _logger.LogInformation(
            "AppointmentCompletionService: {Count} cita(s) marcada(s) como Completada.", expired.Count);
    }
}
