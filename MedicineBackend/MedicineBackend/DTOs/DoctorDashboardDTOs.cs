// ═══════════════════════════════════════════════════════════════
// DTOs/Doctor/DoctorDashboardDtos.cs
// DTOs para el dashboard del doctor
// ═══════════════════════════════════════════════════════════════

namespace MedicineBackend.DTOs.DoctorDTO;

// ══════════════════════════════════════════════════════════
// DASHBOARD STATS
// ══════════════════════════════════════════════════════════
public class DoctorDashboardStatsDto
{
    public string Status { get; set; } = string.Empty;
    public int ProfileCompletion { get; set; }
    public decimal ThisMonthEarnings { get; set; }
    public int UpcomingAppointments { get; set; }
    public int ActivePatients { get; set; }
    public decimal AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public int PublishedCourses { get; set; }
    public int UploadedVideos { get; set; }
    public List<AppointmentSummaryDto> RecentAppointments { get; set; } = new();
    public List<EarningSummaryDto> RecentEarnings { get; set; } = new();
    public List<PendingTaskDto> PendingTasks { get; set; } = new();
    public float Growth { get; set; }
}

public class AppointmentSummaryDto
{
    public int Id { get; set; }
    public string Patient { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Price { get; set; }
}

public class EarningSummaryDto
{
    public int Id { get; set; }
    public string Patient { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Date { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class PendingTaskDto
{
    public int Id { get; set; }
    public string Task { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
}

// ══════════════════════════════════════════════════════════
// PROFILE
// ══════════════════════════════════════════════════════════
public class DoctorProfileDto
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string ProfessionalLicense { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public int? YearsOfExperience { get; set; }
    public string? Description { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public decimal PricePerSession { get; set; }
    public List<string> Specialties { get; set; } = new();
    public string Email { get; set; } = string.Empty;
}

public class UpdateDoctorProfileDto
{
    public string PhoneNumber { get; set; } = string.Empty;
    public int YearsOfExperience { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal PricePerSession { get; set; }
    public List<int> SpecialtyIds { get; set; } = new();
}

// ══════════════════════════════════════════════════════════
// AVAILABILITY
// ══════════════════════════════════════════════════════════
public class DoctorAvailabilityDto
{
    public int Id { get; set; }
    public int DayOfWeek { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public bool IsAvailable { get; set; }
    public string? Notes { get; set; }
}

public class CreateAvailabilityDto
{
    public int DayOfWeek { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public bool IsAvailable { get; set; } = true;
    public string? Notes { get; set; }
}

public class UpdateAvailabilityDto
{
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public bool IsAvailable { get; set; }
    public string? Notes { get; set; }
}

// ══════════════════════════════════════════════════════════
// VIDEOS
// ══════════════════════════════════════════════════════════
public class SocialMediaVideoDto
{
    public int Id { get; set; }
    public string Platform { get; set; } = string.Empty;
    public string VideoUrl { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Tags { get; set; }
    public bool IsActive { get; set; }
    public bool IsVerified { get; set; }
    public int? ViewCount { get; set; }
    public int? LikeCount { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class CreateVideoDto
{
    public string Platform { get; set; } = string.Empty;
    public string VideoUrl { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Tags { get; set; }
}

public class UpdateVideoDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Tags { get; set; }
}

// ══════════════════════════════════════════════════════════
// EARNINGS
// ══════════════════════════════════════════════════════════
public class DoctorEarningsDto
{
    public decimal Total { get; set; }
    public decimal ThisMonth { get; set; }
    public decimal LastMonth { get; set; }
    public float Growth { get; set; }
    public decimal FromAppointments { get; set; }
    public decimal FromCourses { get; set; }
    public decimal PlatformFees { get; set; }
    public decimal NetEarnings { get; set; }
    public decimal PendingPayouts { get; set; }
    public int TotalPatients { get; set; }
    public int TotalSessions { get; set; }
    public decimal AvgSessionPrice { get; set; }
    public List<TransactionDto> Transactions { get; set; } = new();
}

public class TransactionDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Patient { get; set; } = string.Empty;
    public string? CourseName { get; set; }
    public decimal Amount { get; set; }
    public decimal PlatformFee { get; set; }
    public decimal NetAmount { get; set; }
    public string Date { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

// ══════════════════════════════════════════════════════════
// PRICING
// ══════════════════════════════════════════════════════════
public class DoctorPricingDto
{
    public decimal PricePerSession { get; set; }
    public int SessionDurationMinutes { get; set; } = 60;
    public PackagePricesDto PackagePrices { get; set; } = new();
}

public class PackagePricesDto
{
    public decimal Single { get; set; }
    public decimal Pack3 { get; set; }
    public decimal Pack5 { get; set; }
    public decimal Pack10 { get; set; }
}

public class UpdatePricingDto
{
    public decimal PricePerSession { get; set; }
    public int SessionDurationMinutes { get; set; } = 60;
}

// ══════════════════════════════════════════════════════════
// APPOINTMENT SETTINGS
// ══════════════════════════════════════════════════════════

public class AppointmentSettingsDto
{
    public int DefaultAppointmentDuration { get; set; } = 60;
    public bool AcceptsInPersonAppointments { get; set; } = true;
    public bool AcceptsOnlineAppointments { get; set; } = true;
    public string? OfficeAddress { get; set; }
    public string? OfficeCity { get; set; }
    public string? OfficePostalCode { get; set; }
    public string? OfficeCountry { get; set; }
    public string? OfficeInstructions { get; set; }
    public string Timezone { get; set; } = "Europe/Madrid";
}

public class UpdateAppointmentSettingsDto
{
    public int DefaultAppointmentDuration { get; set; } = 60;
    public bool AcceptsInPersonAppointments { get; set; } = true;
    public bool AcceptsOnlineAppointments { get; set; } = true;
    public string? OfficeAddress { get; set; }
    public string? OfficeCity { get; set; }
    public string? OfficePostalCode { get; set; }
    public string? OfficeCountry { get; set; }
    public string? OfficeInstructions { get; set; }
    public string Timezone { get; set; } = "Europe/Madrid";
}