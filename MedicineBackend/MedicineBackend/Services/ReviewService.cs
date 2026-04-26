// ═══════════════════════════════════════════════════════════════
// Services/ReviewService.cs
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.Data;
using MedicineBackend.DTOs.Reviews;
using MedicineBackend.Models;
using MedicineBackend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MedicineBackend.Services;

public class ReviewService : IReviewService
{
    private readonly AppDbContext _context;

    public ReviewService(AppDbContext context)
    {
        _context = context;
    }

    // ─────────────────────────────────────────────────────────────
    public async Task<List<ReviewDto>> GetDoctorReviewsAsync(int doctorId)
    {
        return await _context.Reviews
            .Include(r => r.Patient)
            .Where(r => r.DoctorId == doctorId && r.IsVisible)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewDto
            {
                Id                  = r.Id,
                Rating              = r.Rating,
                Comment             = r.Comment,
                IsVerified          = r.IsVerified,
                PatientName         = $"{r.Patient.FirstName} {r.Patient.LastName[0]}.",
                DoctorResponse      = r.DoctorResponse,
                DoctorResponseDate  = r.DoctorResponseDate,
                CreatedAt           = r.CreatedAt,
            })
            .ToListAsync();
    }

    // ─────────────────────────────────────────────────────────────
    public async Task<List<EligibleAppointmentDto>> GetEligibleAppointmentsAsync(
        int patientId, int doctorId)
    {
        // Citas completadas de este paciente con este doctor
        // que aún NO tienen reseña asociada
        var reviewedAppointmentIds = await _context.Reviews
            .Where(r => r.PatientId == patientId && r.DoctorId == doctorId && r.AppointmentId != null)
            .Select(r => r.AppointmentId!.Value)
            .ToListAsync();

        return await _context.Appointments
            .Where(a => a.PatientId  == patientId
                     && a.DoctorId   == doctorId
                     && a.Status     == "Completada"
                     && !reviewedAppointmentIds.Contains(a.Id))
            .OrderByDescending(a => a.AppointmentDate)
            .Select(a => new EligibleAppointmentDto
            {
                Id              = a.Id,
                AppointmentDate = a.AppointmentDate,
                Reason          = a.Reason,
            })
            .ToListAsync();
    }

    // ─────────────────────────────────────────────────────────────
    public async Task<ReviewDto> CreateReviewAsync(int patientId, CreateReviewDto dto)
    {
        // 1. Verificar que la cita existe, pertenece al paciente y está completada
        var appointment = await _context.Appointments
            .FirstOrDefaultAsync(a => a.Id         == dto.AppointmentId
                                   && a.PatientId   == patientId
                                   && a.DoctorId    == dto.DoctorId
                                   && a.Status      == "Completada");

        if (appointment == null)
            throw new InvalidOperationException(
                "Solo puedes reseñar una cita completada que hayas tenido con este profesional.");

        // 2. Evitar duplicados por cita
        var duplicate = await _context.Reviews
            .AnyAsync(r => r.AppointmentId == dto.AppointmentId && r.PatientId == patientId);

        if (duplicate)
            throw new InvalidOperationException("Ya existe una reseña para esta cita.");

        var patient = await _context.Patients.FindAsync(patientId)
            ?? throw new KeyNotFoundException("Paciente no encontrado.");

        // 3. Crear reseña
        var review = new Review
        {
            DoctorId      = dto.DoctorId,
            PatientId     = patientId,
            AppointmentId = dto.AppointmentId,
            Rating        = dto.Rating,
            Comment       = dto.Comment?.Trim(),
            IsVerified    = true,   // siempre verificada porque requiere cita completada
            IsVisible     = true,
            CreatedAt     = DateTime.UtcNow,
        };

        _context.Reviews.Add(review);

        // 4. Recalcular AverageRating y TotalReviews del doctor
        var doctor = await _context.Doctors.FindAsync(dto.DoctorId);
        if (doctor != null)
        {
            var allRatings = await _context.Reviews
                .Where(r => r.DoctorId == dto.DoctorId && r.IsVisible)
                .Select(r => r.Rating)
                .ToListAsync();

            allRatings.Add(dto.Rating);
            doctor.AverageRating = (decimal)allRatings.Average();
            doctor.TotalReviews  = allRatings.Count;
        }

        await _context.SaveChangesAsync();

        return new ReviewDto
        {
            Id          = review.Id,
            Rating      = review.Rating,
            Comment     = review.Comment,
            IsVerified  = review.IsVerified,
            PatientName = $"{patient.FirstName} {patient.LastName[0]}.",
            CreatedAt   = review.CreatedAt,
        };
    }
}
