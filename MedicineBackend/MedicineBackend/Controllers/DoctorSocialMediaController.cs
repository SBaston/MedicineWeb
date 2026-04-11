using MedicineBackend.Data;
using MedicineBackend.DTOs.Doctor;
using MedicineBackend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace MedicineBackend.Controllers;

[ApiController]
[Route("api/doctor/social-media")]
[Authorize(Roles = "Doctor")]
public class DoctorSocialMediaController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<DoctorSocialMediaController> _logger;

    public DoctorSocialMediaController(AppDbContext context, ILogger<DoctorSocialMediaController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // ═══════════════════════════════════════════════════════════
    // GET: Obtener todas las redes sociales del doctor
    // ═══════════════════════════════════════════════════════════

    [HttpGet]
    public async Task<IActionResult> GetMySocialMedia()
    {
        var doctorId = await GetDoctorIdAsync();

        var socialMedia = await _context.DoctorSocialMedias
            .Where(sm => sm.DoctorId == doctorId)
            .OrderBy(sm => sm.Platform)
            .Select(sm => new SocialMediaDto
            {
                Id = sm.Id,
                Platform = sm.Platform,
                ProfileUrl = sm.ProfileUrl,
                FollowerCount = sm.FollowerCount,
                IsActive = sm.IsActive,
                CreatedAt = sm.CreatedAt
            })
            .ToListAsync();

        return Ok(socialMedia);
    }

    // ═══════════════════════════════════════════════════════════
    // POST: Añadir red social
    // ═══════════════════════════════════════════════════════════

    [HttpPost]
    public async Task<IActionResult> AddSocialMedia([FromBody] CreateSocialMediaRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var doctorId = await GetDoctorIdAsync();

        // Validar que el doctor ha aceptado los términos
        var hasAcceptedTerms = await _context.Doctors
            .Where(d => d.Id == doctorId)
            .Select(d => d.HasAcceptedContentTerms)
            .FirstOrDefaultAsync();

        if (!hasAcceptedTerms)
        {
            return BadRequest(new { message = "Debes aceptar los términos de contenido antes de añadir redes sociales" });
        }

        // Verificar que no exista ya esa plataforma
        var exists = await _context.DoctorSocialMedias
            .AnyAsync(sm => sm.DoctorId == doctorId && sm.Platform == request.Platform);

        if (exists)
        {
            return BadRequest(new { message = $"Ya tienes configurada la red social {request.Platform}" });
        }

        // Crear nueva red social
        var socialMedia = new DoctorSocialMedia
        {
            DoctorId = doctorId,
            Platform = request.Platform,
            ProfileUrl = request.ProfileUrl,
            FollowerCount = request.FollowerCount,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.DoctorSocialMedias.Add(socialMedia);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Doctor {DoctorId} añadió red social {Platform}", doctorId, request.Platform);

        return CreatedAtAction(nameof(GetMySocialMedia), new SocialMediaDto
        {
            Id = socialMedia.Id,
            Platform = socialMedia.Platform,
            ProfileUrl = socialMedia.ProfileUrl,
            FollowerCount = socialMedia.FollowerCount,
            IsActive = socialMedia.IsActive,
            CreatedAt = socialMedia.CreatedAt
        });
    }

    // ═══════════════════════════════════════════════════════════
    // PUT: Actualizar red social
    // ═══════════════════════════════════════════════════════════

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSocialMedia(int id, [FromBody] UpdateSocialMediaRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var doctorId = await GetDoctorIdAsync();

        var socialMedia = await _context.DoctorSocialMedias
            .FirstOrDefaultAsync(sm => sm.Id == id && sm.DoctorId == doctorId);

        if (socialMedia == null)
            return NotFound(new { message = "Red social no encontrada" });

        socialMedia.ProfileUrl = request.ProfileUrl;
        socialMedia.FollowerCount = request.FollowerCount;
        socialMedia.IsActive = request.IsActive;
        socialMedia.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Doctor {DoctorId} actualizó red social {Platform}", doctorId, socialMedia.Platform);

        return Ok(new SocialMediaDto
        {
            Id = socialMedia.Id,
            Platform = socialMedia.Platform,
            ProfileUrl = socialMedia.ProfileUrl,
            FollowerCount = socialMedia.FollowerCount,
            IsActive = socialMedia.IsActive,
            CreatedAt = socialMedia.CreatedAt
        });
    }

    // ═══════════════════════════════════════════════════════════
    // DELETE: Eliminar red social
    // ═══════════════════════════════════════════════════════════

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSocialMedia(int id)
    {
        var doctorId = await GetDoctorIdAsync();

        var socialMedia = await _context.DoctorSocialMedias
            .FirstOrDefaultAsync(sm => sm.Id == id && sm.DoctorId == doctorId);

        if (socialMedia == null)
            return NotFound(new { message = "Red social no encontrada" });

        _context.DoctorSocialMedias.Remove(socialMedia);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Doctor {DoctorId} eliminó red social {Platform}", doctorId, socialMedia.Platform);

        return Ok(new { message = "Red social eliminada correctamente" });
    }

    // ═══════════════════════════════════════════════════════════
    // PATCH: Activar/Desactivar red social
    // ═══════════════════════════════════════════════════════════

    [HttpPatch("{id}/toggle")]
    public async Task<IActionResult> ToggleSocialMedia(int id)
    {
        var doctorId = await GetDoctorIdAsync();

        var socialMedia = await _context.DoctorSocialMedias
            .FirstOrDefaultAsync(sm => sm.Id == id && sm.DoctorId == doctorId);

        if (socialMedia == null)
            return NotFound(new { message = "Red social no encontrada" });

        socialMedia.IsActive = !socialMedia.IsActive;
        socialMedia.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Doctor {DoctorId} {Action} red social {Platform}",
            doctorId,
            socialMedia.IsActive ? "activó" : "desactivó",
            socialMedia.Platform
        );

        return Ok(new
        {
            message = socialMedia.IsActive ? "Red social activada" : "Red social desactivada",
            isActive = socialMedia.IsActive
        });
    }

    // ═══════════════════════════════════════════════════════════
    // HELPER: Obtener ID del doctor autenticado
    // ═══════════════════════════════════════════════════════════

    private async Task<int> GetDoctorIdAsync()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var doctorId = await _context.Doctors
            .Where(d => d.UserId == userId)
            .Select(d => d.Id)
            .FirstOrDefaultAsync();

        if (doctorId == 0)
            throw new UnauthorizedAccessException("Doctor no encontrado");

        return doctorId;
    }
}