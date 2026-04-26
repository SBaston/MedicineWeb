// ═══════════════════════════════════════════════════════════════
// Controllers/ReviewsController.cs
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.DTOs.Reviews;
using MedicineBackend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace MedicineBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviews;
    private readonly IPatientService _patients;

    public ReviewsController(IReviewService reviews, IPatientService patients)
    {
        _reviews  = reviews;
        _patients = patients;
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/reviews/doctor/{doctorId}  — público
    // ─────────────────────────────────────────────────────────────
    [HttpGet("doctor/{doctorId:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<List<ReviewDto>>> GetDoctorReviews(int doctorId)
    {
        var reviews = await _reviews.GetDoctorReviewsAsync(doctorId);
        return Ok(reviews);
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/reviews/eligible/{doctorId}  — solo paciente autenticado
    // Devuelve las citas completadas sin reseña, para saber si puede valorar
    // ─────────────────────────────────────────────────────────────
    [HttpGet("eligible/{doctorId:int}")]
    [Authorize(Roles = "Patient")]
    public async Task<ActionResult<List<EligibleAppointmentDto>>> GetEligible(int doctorId)
    {
        var patientId = await GetPatientIdAsync();
        if (patientId == null) return Forbid();

        var eligible = await _reviews.GetEligibleAppointmentsAsync(patientId.Value, doctorId);
        return Ok(eligible);
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/reviews  — solo paciente autenticado
    // ─────────────────────────────────────────────────────────────
    [HttpPost]
    [Authorize(Roles = "Patient")]
    public async Task<ActionResult<ReviewDto>> CreateReview([FromBody] CreateReviewDto dto)
    {
        var patientId = await GetPatientIdAsync();
        if (patientId == null) return Forbid();

        try
        {
            var review = await _reviews.CreateReviewAsync(patientId.Value, dto);
            return CreatedAtAction(nameof(GetDoctorReviews),
                new { doctorId = dto.DoctorId }, review);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ─────────────────────────────────────────────────────────────
    private async Task<int?> GetPatientIdAsync()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userId, out var uid)) return null;
        return await _patients.GetPatientIdByUserIdAsync(uid);
    }
}
