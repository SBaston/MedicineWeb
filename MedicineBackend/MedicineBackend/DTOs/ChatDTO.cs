using System.ComponentModel.DataAnnotations;

namespace MedicineBackend.DTOs.Chat;

public class ChatPlanDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int DurationDays { get; set; }
    public decimal PlatformCommissionPercent { get; set; }
    public decimal DoctorRevenuePercent => 100 - PlatformCommissionPercent;
    public bool IsActive { get; set; }
    public bool IsVatExempt { get; set; }
}

public class CreateChatPlanDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    [Range(0.01, 999999)]
    public decimal Price { get; set; }

    [Required]
    [Range(1, 3650)]
    public int DurationDays { get; set; }

    [Required]
    [Range(0, 100)]
    public decimal PlatformCommissionPercent { get; set; }

    public bool IsVatExempt { get; set; } = true;
}

public class UpdateChatPlanDto
{
    [MaxLength(100)]
    public string? Name { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [Range(0.01, 999999)]
    public decimal? Price { get; set; }

    [Range(1, 3650)]
    public int? DurationDays { get; set; }

    [Range(0, 100)]
    public decimal? PlatformCommissionPercent { get; set; }

    public bool? IsActive { get; set; }
}

public class ChatSubscriptionDto
{
    public int Id { get; set; }
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string? DoctorProfilePictureUrl { get; set; }

    // Información del paciente (usada cuando el doctor consulta la suscripción)
    public int PatientUserId { get; set; }
    public string PatientName { get; set; } = string.Empty;

    public string PlanName { get; set; } = string.Empty;
    public decimal AmountPaid { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Status { get; set; } = string.Empty;

    /// <summary>True cuando la suscripción ha expirado (modo lectura)</summary>
    public bool IsReadOnly { get; set; }

    public int UnreadCount { get; set; }
    public ChatMessageDto? LastMessage { get; set; }
}

public class ChatMessageDto
{
    public int Id { get; set; }
    public int SenderUserId { get; set; }
    public string SenderRole { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime SentAt { get; set; }
}

public class SendMessageDto
{
    [Required]
    [MaxLength(4000)]
    public string Content { get; set; } = string.Empty;
}

public class CreateChatCheckoutDto
{
    [Required]
    public int DoctorId { get; set; }

    [Required]
    public int ChatPlanId { get; set; }
}
