using System.ComponentModel.DataAnnotations;

namespace MedicineBackend.DTOs.Admin;

// ════════════════════════════════════════════════════════════════
// GESTIÓN DE ADMINS (solo SuperAdmin)
// ════════════════════════════════════════════════════════════════

public class CreateAdminRequest
{
    [Required(ErrorMessage = "El nombre completo es obligatorio")]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "El email es obligatorio")]
    [EmailAddress(ErrorMessage = "Email no válido")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria")]
    [MinLength(8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres")]
    public string Password { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Department { get; set; }
}

public class AdminDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsSuperAdmin { get; set; }
    public bool TwoFactorEnabled { get; set; }
    public string? Department { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminMeResponse
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsSuperAdmin { get; set; }
    public string? Department { get; set; }
}

// ════════════════════════════════════════════════════════════════
// 2FA — Lista de usuarios con 2FA activo
// ════════════════════════════════════════════════════════════════

public class UserWith2FADto
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
}

// ════════════════════════════════════════════════════════════════
// GESTIÓN DE DOCTORES (Admin y SuperAdmin)
// ✅ ACTUALIZADO: 6 imágenes sin OCR - Sistema simplificado
// ════════════════════════════════════════════════════════════════

public class PendingDoctorDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string ProfessionalLicense { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? PhoneNumber { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public int? YearsOfExperience { get; set; }
    public decimal PricePerSession { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime RegisteredAt { get; set; }
    public List<string> Specialties { get; set; } = new();

    // ═══════════════════════════════════════════════════════════
    // DOCUMENTOS SUBIDOS (URLs de las 6 imágenes)
    // ═══════════════════════════════════════════════════════════

    public string? ProfessionalLicenseFrontImageUrl { get; set; }
    public string? ProfessionalLicenseBackImageUrl { get; set; }
    public string? IdDocumentFrontImageUrl { get; set; }
    public string? IdDocumentBackImageUrl { get; set; }
    /// <summary>URLs de los títulos de especialidad, deserializadas desde JSON</summary>
    public List<string> SpecialtyDegreeImageUrls { get; set; } = new();
    public string? UniversityDegreeImageUrl { get; set; }
}

public class DoctorAdminDto : PendingDoctorDto
{
    public DateTime? ReviewedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
    public string? DeletedReason { get; set; }
    public decimal AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public decimal TotalEarnings { get; set; }
}

public class RejectDoctorRequest
{
    [Required(ErrorMessage = "El motivo de rechazo es obligatorio")]
    [MinLength(10, ErrorMessage = "El motivo debe tener al menos 10 caracteres")]
    public string Reason { get; set; } = string.Empty;
}

public class DeleteDoctorRequest
{
    [Required(ErrorMessage = "El motivo de eliminación es obligatorio")]
    [MinLength(10, ErrorMessage = "El motivo debe tener al menos 10 caracteres")]
    public string Reason { get; set; } = string.Empty;
}

// ════════════════════════════════════════════════════════════════
// ESTADÍSTICAS DEL DASHBOARD
// ════════════════════════════════════════════════════════════════

public class AdminDashboardStatsDto
{
    public int PendingReview { get; set; }
    public int ActiveProfessionals { get; set; }
    public int RejectedProfessionals { get; set; }
    public int TotalPatients { get; set; }
    public int TotalAppointments { get; set; }
    public int TotalAdmins { get; set; }
    public int TotalSpecialties { get; set; }
}

// ════════════════════════════════════════════════════════════════
// DETALLE COMPLETO DE UN PROFESIONAL (buscador del admin)
// ════════════════════════════════════════════════════════════════

public class DoctorAdminDetailDto
{
    public DoctorAdminDto Profile { get; set; } = null!;
    public List<DoctorVideoSummaryDto> Videos { get; set; } = new();
    public List<DoctorCourseSummaryDto> Courses { get; set; } = new();
}

public class DoctorVideoSummaryDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Platform { get; set; } = string.Empty;
    public string VideoUrl { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsVerified { get; set; }
    public int ViewCount { get; set; }
    public int LikeCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class DoctorCourseSummaryDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string? Level { get; set; }
    public string? Category { get; set; }
    public string? CoverImageUrl { get; set; }
    public bool IsPublished { get; set; }
    public int TotalEnrollments { get; set; }
    public decimal AverageRating { get; set; }
    public int TotalRatings { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class VideoAdminDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Platform { get; set; } = string.Empty;
    public string VideoUrl { get; set; } = string.Empty;
    public int ViewCount { get; set; }
    public int LikeCount { get; set; }
    public bool IsVerified { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public int DoctorId { get; set; }
}