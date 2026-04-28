using MedicineBackend.Data;
using MedicineBackend.Models;
using MedicineBackend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Data;

namespace MedicineBackend.Services;

/// <summary>
/// Servicio de gestión de citas médicas
/// </summary>
public class AppointmentService : IAppointmentService
{
    private readonly AppDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ILogger<AppointmentService> _logger;

    // Duración por defecto si el doctor no la ha configurado
    private const int DefaultSlotDurationMinutes = 60;

    public AppointmentService(AppDbContext context, IEmailService emailService, ILogger<AppointmentService> logger)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
    }

    // ─────────────────────────────────────────────────────────────
    // OBTENER SLOTS DISPONIBLES
    // ─────────────────────────────────────────────────────────────

    public async Task<List<AvailableSlotDto>> GetAvailableSlotsAsync(int doctorId, DateTime date)
    {
        var dayOfWeek = (int)date.DayOfWeek;

        // 1. Obtener doctor para saber su duración de sesión configurada
        var doctor = await _context.Doctors.FindAsync(doctorId);
        var slotDuration = doctor?.SessionDurationMinutes > 0
            ? doctor.SessionDurationMinutes
            : DefaultSlotDurationMinutes;

        // 2. Obtener disponibilidad del doctor para ese día de la semana
        var availability = await _context.DoctorAvailabilities
            .Where(a => a.DoctorId == doctorId && a.DayOfWeek == dayOfWeek && a.IsAvailable)
            .ToListAsync();

        if (!availability.Any())
            return new List<AvailableSlotDto>();

        // 3. Obtener citas ya reservadas para ese día
        var dayStart = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        var dayEnd   = DateTime.SpecifyKind(date.Date.AddDays(1), DateTimeKind.Utc);

        var bookedAppointments = await _context.Appointments
            .Where(a =>
                a.DoctorId == doctorId &&
                a.AppointmentDate >= dayStart &&
                a.AppointmentDate < dayEnd &&
                a.Status != "Cancelada")
            .Select(a => a.AppointmentDate)
            .ToListAsync();

        // 4. Generar todos los slots posibles y filtrar los ocupados
        var slots = new List<AvailableSlotDto>();

        foreach (var avail in availability)
        {
            var current = DateTime.SpecifyKind(date.Date.Add(avail.StartTime), DateTimeKind.Utc);
            var endTime = DateTime.SpecifyKind(date.Date.Add(avail.EndTime),   DateTimeKind.Utc);

            while (current.AddMinutes(slotDuration) <= endTime)
            {
                var isBooked = bookedAppointments.Any(b =>
                    Math.Abs((b - current).TotalMinutes) < slotDuration);

                if (!isBooked && current > DateTime.UtcNow.AddMinutes(30))
                {
                    slots.Add(new AvailableSlotDto
                    {
                        Start = current,
                        End = current.AddMinutes(slotDuration),
                        Label = $"{current:HH:mm} - {current.AddMinutes(slotDuration):HH:mm}"
                    });
                }

                current = current.AddMinutes(slotDuration);
            }
        }

        return slots.OrderBy(s => s.Start).ToList();
    }

    // ─────────────────────────────────────────────────────────────
    // RESERVAR CITA
    // ─────────────────────────────────────────────────────────────

    public async Task<AppointmentResponseDto> BookAppointmentAsync(int patientUserId, CreateAppointmentDto dto)
    {
        // 1. Obtener paciente
        var patient = await _context.Patients
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.UserId == patientUserId)
            ?? throw new KeyNotFoundException("Paciente no encontrado");

        // 2. Obtener doctor
        var doctor = await _context.Doctors
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == dto.DoctorId && d.Status == DoctorStatus.Active)
            ?? throw new KeyNotFoundException("Profesional no encontrado o no activo");

        // 3. Calcular tiempos del slot
        var apptDateUtc    = DateTime.SpecifyKind(dto.AppointmentDate, DateTimeKind.Utc);
        var sessionDuration = doctor.SessionDurationMinutes > 0
            ? doctor.SessionDurationMinutes
            : DefaultSlotDurationMinutes;
        var slotEnd = apptDateUtc.AddMinutes(sessionDuration);

        var isOnline       = dto.AppointmentType?.ToLower() == "online";
        var initialStatus  = doctor.PricePerSession > 0 ? "PendientePago" : "Confirmada";

        // 4. Transacción Serializable: el check de disponibilidad y la inserción son atómicos.
        //    Dos peticiones simultáneas para el mismo slot no pueden pasar ambas el check.
        await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        Appointment appointment;
        try
        {
            var conflict = await _context.Appointments
                .AnyAsync(a =>
                    a.DoctorId == dto.DoctorId &&
                    a.Status   != "Cancelada"  &&
                    a.AppointmentDate < slotEnd &&
                    a.AppointmentDate.AddMinutes(a.DurationMinutes) > apptDateUtc);

            if (conflict)
                throw new InvalidOperationException("Este horario ya no está disponible. Por favor, elige otro.");

            appointment = new Appointment
            {
                DoctorId        = dto.DoctorId,
                PatientId       = patient.Id,
                AppointmentDate = apptDateUtc,
                DurationMinutes = sessionDuration,
                Status          = initialStatus,
                Price           = doctor.PricePerSession,
                Reason          = dto.Reason,
                MeetingPlatform = isOnline ? "Online_Pending" : null,
                CreatedAt       = DateTime.UtcNow,
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync();
            // El índice único de BD actuó como segunda red de seguridad
            throw new InvalidOperationException("Este horario ya no está disponible. Por favor, elige otro.");
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        _logger.LogInformation("✅ Cita {Id} creada: Paciente {PatientId} con Doctor {DoctorId} el {Date}",
            appointment.Id, patient.Id, dto.DoctorId, dto.AppointmentDate);

        // 6. Enviar emails de notificación (no bloquear si falla)
        var patientName = $"{patient.FirstName} {patient.LastName}";
        var doctorName = $"{doctor.FirstName} {doctor.LastName}";
        var appointmentType = isOnline ? "online" : "presencial";

        _ = Task.Run(async () =>
        {
            try
            {
                await _emailService.SendAppointmentConfirmationToPatientAsync(
                    patient.User.Email, patientName, doctorName,
                    dto.AppointmentDate, appointmentType, doctor.PricePerSession, dto.Reason ?? "");

                // Pequeña pausa para evitar el límite de Mailtrap (demasiados emails/segundo)
                await Task.Delay(1000);

                await _emailService.SendNewAppointmentNotificationToDoctorAsync(
                    doctor.User.Email, doctorName, patientName,
                    dto.AppointmentDate, appointmentType, dto.Reason ?? "");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al enviar emails de confirmación de cita {Id}", appointment.Id);
            }
        });

        return MapToDto(appointment, doctor, patient);
    }

    // ─────────────────────────────────────────────────────────────
    // CITAS DEL DOCTOR
    // ─────────────────────────────────────────────────────────────

    public async Task<List<AppointmentResponseDto>> GetDoctorAppointmentsAsync(int doctorId)
    {
        var appointments = await _context.Appointments
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .Where(a => a.DoctorId == doctorId)
            .OrderByDescending(a => a.AppointmentDate)
            .ToListAsync();

        return appointments.Select(a => MapToDto(a, a.Doctor, a.Patient)).ToList();
    }

    // ─────────────────────────────────────────────────────────────
    // CITAS DEL PACIENTE
    // ─────────────────────────────────────────────────────────────

    public async Task<List<AppointmentResponseDto>> GetPatientAppointmentsAsync(int patientUserId)
    {
        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.UserId == patientUserId)
            ?? throw new KeyNotFoundException("Paciente no encontrado");

        var appointments = await _context.Appointments
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .Where(a => a.PatientId == patient.Id)
            .OrderByDescending(a => a.AppointmentDate)
            .ToListAsync();

        return appointments.Select(a => MapToDto(a, a.Doctor, a.Patient)).ToList();
    }

    // ─────────────────────────────────────────────────────────────
    // AÑADIR ENLACE DE VIDEOLLAMADA
    // ─────────────────────────────────────────────────────────────

    public async Task<AppointmentResponseDto> AddMeetingLinkAsync(int doctorId, int appointmentId, AddMeetingLinkDto dto)
    {
        var appointment = await _context.Appointments
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(a => a.Id == appointmentId && a.DoctorId == doctorId)
            ?? throw new KeyNotFoundException("Cita no encontrada");

        if (appointment.MeetingPlatform == null)
            throw new InvalidOperationException("Esta cita es presencial y no requiere enlace de videollamada");

        appointment.MeetingLink = dto.MeetingLink;
        appointment.MeetingPlatform = dto.Platform;
        appointment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Notificar al paciente con el enlace
        _ = Task.Run(async () =>
        {
            try
            {
                var patientName = $"{appointment.Patient.FirstName} {appointment.Patient.LastName}";
                var doctorName = $"{appointment.Doctor.FirstName} {appointment.Doctor.LastName}";

                await _emailService.SendMeetingLinkToPatientAsync(
                    appointment.Patient.User.Email,
                    patientName, doctorName,
                    appointment.AppointmentDate,
                    dto.MeetingLink, dto.Platform);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al enviar email de enlace de cita {Id}", appointmentId);
            }
        });

        return MapToDto(appointment, appointment.Doctor, appointment.Patient);
    }

    // ─────────────────────────────────────────────────────────────
    // CANCELAR CITA
    // ─────────────────────────────────────────────────────────────

    public async Task CancelAppointmentAsync(int appointmentId, int userId, string role, string reason)
    {
        Appointment? appointment;

        if (role == "Doctor")
        {
            var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == userId)
                ?? throw new UnauthorizedAccessException("Doctor no encontrado");

            appointment = await _context.Appointments
                .Include(a => a.Doctor).ThenInclude(d => d.User)
                .Include(a => a.Patient).ThenInclude(p => p.User)
                .FirstOrDefaultAsync(a => a.Id == appointmentId && a.DoctorId == doctor.Id)
                ?? throw new KeyNotFoundException("Cita no encontrada");
        }
        else
        {
            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId)
                ?? throw new UnauthorizedAccessException("Paciente no encontrado");

            appointment = await _context.Appointments
                .Include(a => a.Doctor).ThenInclude(d => d.User)
                .Include(a => a.Patient).ThenInclude(p => p.User)
                .FirstOrDefaultAsync(a => a.Id == appointmentId && a.PatientId == patient.Id)
                ?? throw new KeyNotFoundException("Cita no encontrada");
        }

        if (appointment.Status == "Cancelada")
            throw new InvalidOperationException("La cita ya está cancelada");

        appointment.Status = "Cancelada";
        appointment.CancellationReason = reason;
        appointment.CancelledBy = role;
        appointment.CancelledAt = DateTime.UtcNow;
        appointment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // ── Notificar cancelación por email (no bloquear si falla) ──
        _ = Task.Run(async () =>
        {
            try
            {
                var patientName = $"{appointment.Patient.FirstName} {appointment.Patient.LastName}";
                var doctorName  = $"{appointment.Doctor.FirstName} {appointment.Doctor.LastName}";

                await _emailService.SendAppointmentCancellationAsync(
                    appointment.Patient.User.Email,
                    appointment.Doctor.User.Email,
                    patientName, doctorName,
                    appointment.AppointmentDate,
                    role, reason);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al enviar email de cancelación para cita {Id}", appointmentId);
            }
        });
    }

    // ─────────────────────────────────────────────────────────────
    // MAPPER PRIVADO
    // ─────────────────────────────────────────────────────────────

    private static AppointmentResponseDto MapToDto(Appointment a, Doctor doctor, Patient patient)
    {
        var isOnline = !string.IsNullOrEmpty(a.MeetingPlatform);

        return new AppointmentResponseDto
        {
            Id = a.Id,
            DoctorId = doctor.Id,
            DoctorName = $"{doctor.FirstName} {doctor.LastName}",
            DoctorProfilePicture = doctor.ProfilePictureUrl ?? "",
            PatientId = patient.Id,
            PatientName = $"{patient.FirstName} {patient.LastName}",
            AppointmentDate = a.AppointmentDate,
            DurationMinutes = a.DurationMinutes,
            Status = a.Status,
            Price = a.Price,
            AppointmentType = isOnline ? "online" : "presencial",
            Reason = a.Reason,
            MeetingLink = a.MeetingLink,
            MeetingPlatform = a.MeetingPlatform,
            CreatedAt = a.CreatedAt,
        };
    }
}
