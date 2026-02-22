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
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsSuperAdmin { get; set; }
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
// GESTIÓN DE DOCTORES (Admin y SuperAdmin)
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
}

public class DoctorAdminDto : PendingDoctorDto
{
    public string? StatusReason { get; set; }
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
}