// ═══════════════════════════════════════════════════════════════
// DTOs/Professional/ProfessionalDtos.cs
// DTOs para búsqueda y detalle de profesionales
// ═══════════════════════════════════════════════════════════════

namespace MedicineBackend.DTOs.Professional;

/// <summary>
/// DTO para resultados de búsqueda de profesionales
/// </summary>
public class ProfessionalSearchDto
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public List<SpecialtyDto> Specialties { get; set; } = new();
    public string? Description { get; set; }
    public decimal PricePerSession { get; set; }
    public decimal? AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public int YearsOfExperience { get; set; }
    public bool IsAcceptingPatients { get; set; }
}

/// <summary>
/// DTO para detalles completos de un profesional
/// </summary>
public class ProfessionalDetailDto
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public string? PhoneNumber { get; set; }
    public List<SpecialtyDto> Specialties { get; set; } = new();
    public string? Description { get; set; }
    public decimal PricePerSession { get; set; }
    public int YearsOfExperience { get; set; }
    public decimal? AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public bool IsAcceptingPatients { get; set; }
    public int SessionDurationMinutes { get; set; } = 60;
    public bool AcceptsInPersonAppointments { get; set; } = true;
    public bool AcceptsOnlineAppointments { get; set; } = true;
    public string? OfficeAddress { get; set; }
    public string? OfficeCity { get; set; }
    public string? OfficePostalCode { get; set; }
    public string? OfficeCountry { get; set; }
    public string? OfficeInstructions { get; set; }
    public List<SocialMediaDto> SocialMedia { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO para especialidades
/// </summary>
public class SpecialtyDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

/// <summary>
/// DTO para redes sociales
/// </summary>
public class SocialMediaDto
{
    public string Platform { get; set; } = string.Empty;
    public string ProfileUrl { get; set; } = string.Empty;
    public int? FollowerCount { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// DTO para videos de profesionales (vista pública)
/// </summary>
public class ProfessionalVideoDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string VideoUrl { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty;
    public string? Tags { get; set; }
    public DateTime CreatedAt { get; set; }
}