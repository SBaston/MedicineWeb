// ═══════════════════════════════════════════════════════════════
// Services/DoctorDashboardService.cs
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.Data;
using MedicineBackend.DTOs;
using MedicineBackend.DTOs.DoctorDTO;
using MedicineBackend.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using MedicineBackend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MedicineBackend.Services;


public class DoctorDashboardService : IDoctorDashboardService
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public DoctorDashboardService(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    public async Task<DoctorDashboardStatsDto> GetDashboardStatsAsync(int doctorId)
    {
        var doctor = await _context.Doctors
            .Include(d => d.User)
            .Include(d => d.Appointments)
            .Include(d => d.Reviews)
            .Include(d => d.Courses)
            .Include(d => d.SocialMediaVideos)
            .Include(d => d.Payments)
            .Include(d => d.Availabilities)
            .Include(d => d.Specialties)
            .FirstOrDefaultAsync(d => d.Id == doctorId)
            ?? throw new KeyNotFoundException("Doctor no encontrado");

        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var startOfLastMonth = startOfMonth.AddMonths(-1);

        var thisMonthPayments = doctor.Payments
            .Where(p => p.CreatedAt >= startOfMonth && p.Status == "Completado")
            .ToList();

        var lastMonthPayments = doctor.Payments
            .Where(p => p.CreatedAt >= startOfLastMonth && p.CreatedAt < startOfMonth && p.Status == "Completado")
            .ToList();

        var thisMonthEarnings = thisMonthPayments.Sum(p => p.DoctorAmount);
        var lastMonthEarnings = lastMonthPayments.Sum(p => p.DoctorAmount);

        var growth = lastMonthEarnings > 0
            ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100
            : 0;

        var upcomingAppointments = await _context.Appointments
            .Where(a => a.DoctorId == doctorId && a.AppointmentDate >= now && a.Status != "Cancelada")
            .OrderBy(a => a.AppointmentDate)
            .Take(10)
            .Include(a => a.Patient)
                .ThenInclude(p => p.User)
            .Select(a => new AppointmentSummaryDto
            {
                Id = a.Id,
                Patient = a.Patient.User.Email,
                Date = a.AppointmentDate.ToString("yyyy-MM-dd"),
                Time = a.AppointmentDate.ToString("HH:mm"),
                Status = a.Status,
                Price = a.Price
            })
            .ToListAsync();

        var recentEarnings = await _context.Payments
            .Where(p => p.DoctorId == doctorId && p.Status == "Completado")
            .OrderByDescending(p => p.CreatedAt)
            .Take(10)
            .Include(p => p.Patient)
                .ThenInclude(pt => pt.User)
            .Select(p => new EarningSummaryDto
            {
                Id = p.Id,
                Patient = $"{p.Patient.FirstName} {p.Patient.LastName}",
                Amount = p.Amount,
                Date = p.CreatedAt.ToString("yyyy-MM-dd"),
                Status = p.Status
            })
            .ToListAsync();

        var pendingTasks = new List<PendingTaskDto>();

        // ⚠️ TAREAS OPCIONALES (no bloquean el 100%)
        if (string.IsNullOrEmpty(doctor.Description) || doctor.Description.Length < 50)
        {
            pendingTasks.Add(new PendingTaskDto
            {
                Id = 1,
                Task = "Completar biografía profesional (mínimo 50 caracteres)",
                Priority = "high"
            });
        }

        if (!doctor.Availabilities.Any())
        {
            pendingTasks.Add(new PendingTaskDto
            {
                Id = 2,
                Task = "Configurar horarios de disponibilidad",
                Priority = "medium"
            });
        }

        

        // 4 CAMPOS BÁSICOS EDITABLES (2FA no es requisito)
        int profileCompletion = 0;
        int totalFields = 4;

        if (!string.IsNullOrEmpty(doctor.PhoneNumber)) profileCompletion++;
        if (doctor.YearsOfExperience.HasValue) profileCompletion++;
        if (!string.IsNullOrEmpty(doctor.Description) && doctor.Description.Length >= 50) profileCompletion++;
        if (doctor.PricePerSession > 0) profileCompletion++;

        return new DoctorDashboardStatsDto
        {
            Status = doctor.Status.ToString(),
            ProfileCompletion = (profileCompletion * 100) / totalFields,
            TwoFactorEnabled = doctor.User?.TwoFactorEnabled ?? false,
            ThisMonthEarnings = thisMonthEarnings,
            UpcomingAppointments = upcomingAppointments.Count,
            ActivePatients = await _context.Appointments
                .Where(a => a.DoctorId == doctorId && a.Status == "Completada")
                .Select(a => a.PatientId)
                .Distinct()
                .CountAsync(),
            AverageRating = doctor.AverageRating,
            TotalReviews = doctor.TotalReviews,
            PublishedCourses = doctor.Courses.Count(c => c.IsPublished),
            UploadedVideos = doctor.SocialMediaVideos.Count(v => v.IsActive),
            RecentAppointments = upcomingAppointments,
            RecentEarnings = recentEarnings,
            PendingTasks = pendingTasks,
            Growth = (float)growth
        };
    }

    public async Task<DoctorProfileDto> GetProfileAsync(int doctorId)
    {
        var doctor = await _context.Doctors
            .Include(d => d.User)
            .Include(d => d.Specialties)
            .FirstOrDefaultAsync(d => d.Id == doctorId)
            ?? throw new KeyNotFoundException("Doctor no encontrado");

        return new DoctorProfileDto
        {
            Id = doctor.Id,
            FirstName = doctor.FirstName,
            LastName = doctor.LastName,
            ProfessionalLicense = doctor.ProfessionalLicense,
            PhoneNumber = doctor.PhoneNumber,
            YearsOfExperience = doctor.YearsOfExperience,
            Description = doctor.Description,
            ProfilePictureUrl = doctor.ProfilePictureUrl,
            PricePerSession = doctor.PricePerSession,
            Specialties = doctor.Specialties.Select(s => s.Name).ToList(),
            Email = doctor.User.Email
        };
    }

    public async Task<DoctorProfileDto> UpdateProfileAsync(int doctorId, UpdateDoctorProfileDto dto)
    {
        var doctor = await _context.Doctors
            .Include(d => d.Specialties)
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == doctorId)
            ?? throw new KeyNotFoundException("Doctor no encontrado");

        doctor.PhoneNumber = dto.PhoneNumber;
        doctor.YearsOfExperience = dto.YearsOfExperience;
        doctor.Description = dto.Description;
        doctor.PricePerSession = dto.PricePerSession;
        doctor.UpdatedAt = DateTime.UtcNow;

        if (dto.SpecialtyIds != null && dto.SpecialtyIds.Any())
        {
            var specialties = await _context.Specialties
                .Where(s => dto.SpecialtyIds.Contains(s.Id) && s.DeletedAt == null && s.IsActive)
                .ToListAsync();

            doctor.Specialties = specialties;
        }

        await _context.SaveChangesAsync();
        return await GetProfileAsync(doctorId);
    }

    public async Task<string> UploadProfilePictureAsync(int doctorId, IFormFile file)
    {
        var doctor = await _context.Doctors.FindAsync(doctorId)
            ?? throw new KeyNotFoundException("Doctor no encontrado");

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(extension))
            throw new InvalidOperationException("Formato de archivo no permitido");

        if (file.Length > 5 * 1024 * 1024)
            throw new InvalidOperationException("El archivo es demasiado grande (máx 5MB)");

        var uploadsPath = Path.Combine(_env.WebRootPath, "uploads", "doctors", "profiles");
        Directory.CreateDirectory(uploadsPath);

        var fileName = $"{doctorId}_{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsPath, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        if (!string.IsNullOrEmpty(doctor.ProfilePictureUrl))
        {
            var oldFilePath = Path.Combine(_env.WebRootPath, doctor.ProfilePictureUrl.TrimStart('/'));
            if (File.Exists(oldFilePath))
                File.Delete(oldFilePath);
        }

        doctor.ProfilePictureUrl = $"/uploads/doctors/profiles/{fileName}";
        doctor.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return doctor.ProfilePictureUrl;
    }

    public async Task<List<DoctorAvailabilityDto>> GetAvailabilitiesAsync(int doctorId)
    {
        var availabilities = await _context.DoctorAvailabilities
            .Where(a => a.DoctorId == doctorId)
            .OrderBy(a => a.DayOfWeek)
            .ThenBy(a => a.StartTime)
            .ToListAsync();

        return availabilities.Select(a => new DoctorAvailabilityDto
        {
            Id = a.Id,
            DayOfWeek = a.DayOfWeek,
            StartTime = a.StartTime.ToString(@"hh\:mm"),
            EndTime = a.EndTime.ToString(@"hh\:mm"),
            IsAvailable = a.IsAvailable,
            Notes = a.Notes
        }).ToList();
    }

    public async Task<DoctorAvailabilityDto> CreateAvailabilityAsync(int doctorId, CreateAvailabilityDto dto)
    {
        var availability = new DoctorAvailability
        {
            DoctorId = doctorId,
            DayOfWeek = dto.DayOfWeek,
            StartTime = TimeSpan.Parse(dto.StartTime),
            EndTime = TimeSpan.Parse(dto.EndTime),
            IsAvailable = dto.IsAvailable,
            Notes = dto.Notes
        };

        _context.DoctorAvailabilities.Add(availability);
        await _context.SaveChangesAsync();

        return new DoctorAvailabilityDto
        {
            Id = availability.Id,
            DayOfWeek = availability.DayOfWeek,
            StartTime = availability.StartTime.ToString(@"hh\:mm"),
            EndTime = availability.EndTime.ToString(@"hh\:mm"),
            IsAvailable = availability.IsAvailable,
            Notes = availability.Notes
        };
    }

    public async Task<DoctorAvailabilityDto> UpdateAvailabilityAsync(int doctorId, int availabilityId, UpdateAvailabilityDto dto)
    {
        var availability = await _context.DoctorAvailabilities
            .FirstOrDefaultAsync(a => a.Id == availabilityId && a.DoctorId == doctorId)
            ?? throw new KeyNotFoundException("Disponibilidad no encontrada");

        availability.StartTime = TimeSpan.Parse(dto.StartTime);
        availability.EndTime = TimeSpan.Parse(dto.EndTime);
        availability.IsAvailable = dto.IsAvailable;
        availability.Notes = dto.Notes;
        availability.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new DoctorAvailabilityDto
        {
            Id = availability.Id,
            DayOfWeek = availability.DayOfWeek,
            StartTime = availability.StartTime.ToString(@"hh\:mm"),
            EndTime = availability.EndTime.ToString(@"hh\:mm"),
            IsAvailable = availability.IsAvailable,
            Notes = availability.Notes
        };
    }

    public async Task DeleteAvailabilityAsync(int doctorId, int availabilityId)
    {
        var availability = await _context.DoctorAvailabilities
            .FirstOrDefaultAsync(a => a.Id == availabilityId && a.DoctorId == doctorId)
            ?? throw new KeyNotFoundException("Disponibilidad no encontrada");

        _context.DoctorAvailabilities.Remove(availability);
        await _context.SaveChangesAsync();
    }

    public async Task<List<SocialMediaVideoDto>> GetVideosAsync(int doctorId)
    {
        var videos = await _context.SocialMediaVideos
            .Where(v => v.DoctorId == doctorId)
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync();

        return videos.Select(v => new SocialMediaVideoDto
        {
            Id = v.Id,
            Platform = v.Platform,
            VideoUrl = v.VideoUrl,
            Title = v.Title,
            Description = v.Description,
            IsActive = v.IsActive,
            ViewCount = v.ViewCount,
            LikeCount = v.LikeCount,
            CreatedAt = v.CreatedAt.ToString("yyyy-MM-dd")
        }).ToList();
    }

    public async Task<SocialMediaVideoDto> CreateVideoAsync(int doctorId, CreateVideoDto dto)
    {
        var video = new SocialMediaVideo
        {
            DoctorId = doctorId,
            Platform = dto.Platform,
            VideoUrl = dto.VideoUrl,
            Title = dto.Title,
            Description = dto.Description,
            IsActive = true,
        };

        _context.SocialMediaVideos.Add(video);
        await _context.SaveChangesAsync();

        return new SocialMediaVideoDto
        {
            Id = video.Id,
            Platform = video.Platform,
            VideoUrl = video.VideoUrl,
            Title = video.Title,
            Description = video.Description,
            IsActive = video.IsActive,
            CreatedAt = video.CreatedAt.ToString("yyyy-MM-dd")
        };
    }

    public async Task<SocialMediaVideoDto> UpdateVideoAsync(int doctorId, int videoId, UpdateVideoDto dto)
    {
        var video = await _context.SocialMediaVideos
            .FirstOrDefaultAsync(v => v.Id == videoId && v.DoctorId == doctorId)
            ?? throw new KeyNotFoundException("Vídeo no encontrado");

        video.Title = dto.Title;
        video.Description = dto.Description;
        video.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new SocialMediaVideoDto
        {
            Id = video.Id,
            Platform = video.Platform,
            VideoUrl = video.VideoUrl,
            Title = video.Title,
            Description = video.Description,
            IsActive = video.IsActive,
            CreatedAt = video.CreatedAt.ToString("yyyy-MM-dd")
        };
    }

    public async Task DeleteVideoAsync(int doctorId, int videoId)
    {
        var video = await _context.SocialMediaVideos
            .FirstOrDefaultAsync(v => v.Id == videoId && v.DoctorId == doctorId)
            ?? throw new KeyNotFoundException("Vídeo no encontrado");

        _context.SocialMediaVideos.Remove(video);
        await _context.SaveChangesAsync();
    }

    public async Task<SocialMediaVideoDto> ToggleVideoStatusAsync(int doctorId, int videoId)
    {
        var video = await _context.SocialMediaVideos
            .FirstOrDefaultAsync(v => v.Id == videoId && v.DoctorId == doctorId)
            ?? throw new KeyNotFoundException("Vídeo no encontrado");

        video.IsActive = !video.IsActive;
        video.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new SocialMediaVideoDto
        {
            Id = video.Id,
            Platform = video.Platform,
            VideoUrl = video.VideoUrl,
            Title = video.Title,
            Description = video.Description,
            IsActive = video.IsActive,
            CreatedAt = video.CreatedAt.ToString("yyyy-MM-dd")
        };
    }

    public async Task<DoctorEarningsDto> GetEarningsAsync(int doctorId, string timeRange, string filterType)
    {
        var now = DateTime.UtcNow;
        DateTime startDate = timeRange switch
        {
            "week" => now.AddDays(-7),
            "month" => new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc),
            "year" => new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            _ => new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc)
        };

        var paymentsQuery = _context.Payments
            .Where(p => p.DoctorId == doctorId && p.CreatedAt >= startDate && p.Status == "Completado")
            .Include(p => p.Patient)
                .ThenInclude(pt => pt.User)
            .Include(p => p.Appointment)
            .Include(p => p.Course);

        var payments = await paymentsQuery.ToListAsync();

        if (filterType == "appointments")
            payments = payments.Where(p => p.AppointmentId.HasValue).ToList();
        else if (filterType == "courses")
            payments = payments.Where(p => p.CourseId.HasValue).ToList();

        var total = payments.Sum(p => p.Amount);
        var platformFees = payments.Sum(p => p.PlatformFee);
        var netEarnings = payments.Sum(p => p.DoctorAmount);
        var fromAppointments = payments.Where(p => p.AppointmentId.HasValue).Sum(p => p.Amount);
        var fromCourses = payments.Where(p => p.CourseId.HasValue).Sum(p => p.Amount);

        var transactions = payments
            .OrderByDescending(p => p.CreatedAt)
            .Take(50)
            .Select(p => new TransactionDto
            {
                Id = p.Id,
                Type = p.AppointmentId.HasValue ? "appointment" : "course",
                Patient = $"{p.Patient.FirstName} {p.Patient.LastName}",
                CourseName = p.Course?.Title,
                Amount = p.Amount,
                PlatformFee = p.PlatformFee,
                NetAmount = p.DoctorAmount,
                Date = p.CreatedAt.ToString("yyyy-MM-dd"),
                Status = p.Status.ToLower()
            })
            .ToList();

        return new DoctorEarningsDto
        {
            Total = total,
            ThisMonth = netEarnings,
            LastMonth = 0,
            Growth = 0,
            FromAppointments = fromAppointments,
            FromCourses = fromCourses,
            PlatformFees = platformFees,
            NetEarnings = netEarnings,
            PendingPayouts = 0,
            TotalPatients = await _context.Payments
                .Where(p => p.DoctorId == doctorId)
                .Select(p => p.PatientId)
                .Distinct()
                .CountAsync(),
            TotalSessions = await _context.Appointments
                .Where(a => a.DoctorId == doctorId && a.Status == "Completada")
                .CountAsync(),
            AvgSessionPrice = await _context.Doctors
                .Where(d => d.Id == doctorId)
                .Select(d => d.PricePerSession)
                .FirstOrDefaultAsync(),
            Transactions = transactions
        };
    }

    public async Task<DoctorPricingDto> GetPricingAsync(int doctorId)
    {
        var doctor = await _context.Doctors.FindAsync(doctorId)
            ?? throw new KeyNotFoundException("Doctor no encontrado");

        return new DoctorPricingDto
        {
            PricePerSession = doctor.PricePerSession,
            SessionDurationMinutes = doctor.SessionDurationMinutes,
            PackagePrices = new PackagePricesDto
            {
                Single = doctor.PricePerSession,
                Pack3 = doctor.PricePerSession * 3 * 0.95m,
                Pack5 = doctor.PricePerSession * 5 * 0.917m,
                Pack10 = doctor.PricePerSession * 10 * 0.85m
            }
        };
    }

    public async Task<DoctorPricingDto> UpdatePricingAsync(int doctorId, UpdatePricingDto dto)
    {
        var doctor = await _context.Doctors.FindAsync(doctorId)
            ?? throw new KeyNotFoundException("Doctor no encontrado");

        doctor.PricePerSession = dto.PricePerSession;
        doctor.SessionDurationMinutes = dto.SessionDurationMinutes > 0 ? dto.SessionDurationMinutes : 60;
        doctor.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetPricingAsync(doctorId);
    }

    // ═══════════════════════════════════════════════════════════════
    // APPOINTMENT SETTINGS
    // ═══════════════════════════════════════════════════════════════

    public async Task<AppointmentSettingsDto> GetAppointmentSettingsAsync(int doctorId)
    {
        var doctor = await _context.Doctors.FindAsync(doctorId)
            ?? throw new KeyNotFoundException("Doctor no encontrado");

        return new AppointmentSettingsDto
        {
            DefaultAppointmentDuration   = doctor.SessionDurationMinutes > 0 ? doctor.SessionDurationMinutes : 60,
            AcceptsInPersonAppointments  = doctor.AcceptsInPersonAppointments,
            AcceptsOnlineAppointments    = doctor.AcceptsOnlineAppointments,
            OfficeAddress                = doctor.OfficeAddress,
            OfficeCity                   = doctor.OfficeCity,
            OfficePostalCode             = doctor.OfficePostalCode,
            OfficeCountry                = doctor.OfficeCountry ?? "España",
            OfficeInstructions           = doctor.OfficeInstructions,
            Timezone                     = doctor.Timezone,
        };
    }

    public async Task<AppointmentSettingsDto> UpdateAppointmentSettingsAsync(int doctorId, UpdateAppointmentSettingsDto dto)
    {
        var doctor = await _context.Doctors.FindAsync(doctorId)
            ?? throw new KeyNotFoundException("Doctor no encontrado");

        doctor.SessionDurationMinutes       = dto.DefaultAppointmentDuration > 0 ? dto.DefaultAppointmentDuration : 60;
        doctor.AcceptsInPersonAppointments  = dto.AcceptsInPersonAppointments;
        doctor.AcceptsOnlineAppointments    = dto.AcceptsOnlineAppointments;
        doctor.OfficeAddress                = dto.OfficeAddress;
        doctor.OfficeCity                   = dto.OfficeCity;
        doctor.OfficePostalCode             = dto.OfficePostalCode;
        doctor.OfficeCountry                = dto.OfficeCountry ?? "España";
        doctor.OfficeInstructions           = dto.OfficeInstructions;
        doctor.Timezone                     = string.IsNullOrWhiteSpace(dto.Timezone) ? "Europe/Madrid" : dto.Timezone;
        doctor.UpdatedAt                    = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetAppointmentSettingsAsync(doctorId);
    }
}