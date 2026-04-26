// ═══════════════════════════════════════════════════════════════
// DTOs/ReviewDtos.cs
// ═══════════════════════════════════════════════════════════════

using System.ComponentModel.DataAnnotations;

namespace MedicineBackend.DTOs.Reviews;

public class ReviewDto
{
    public int    Id            { get; set; }
    public int    Rating        { get; set; }
    public string? Comment      { get; set; }
    public bool   IsVerified    { get; set; }
    public string PatientName   { get; set; } = string.Empty;
    public string? DoctorResponse     { get; set; }
    public DateTime? DoctorResponseDate { get; set; }
    public DateTime CreatedAt   { get; set; }
}

public class CreateReviewDto
{
    [Required]
    public int DoctorId { get; set; }

    /// <summary>ID de la cita completada que habilita la reseña.</summary>
    [Required]
    public int AppointmentId { get; set; }

    [Required]
    [Range(1, 5)]
    public int Rating { get; set; }

    [MaxLength(1000)]
    public string? Comment { get; set; }
}

public class EligibleAppointmentDto
{
    public int      Id              { get; set; }
    public DateTime AppointmentDate { get; set; }
    public string?  Reason          { get; set; }
}
