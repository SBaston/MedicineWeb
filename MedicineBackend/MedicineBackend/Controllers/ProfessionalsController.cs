// ═══════════════════════════════════════════════════════════════
// Controllers/ProfessionalsController.cs
// Controller público para búsqueda de profesionales
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.DTOs.Professional;
using MedicineBackend.Services;
using MedicineBackend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace MedicineBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProfessionalsController : ControllerBase
{
    private readonly IProfessionalService _professionalService;

    public ProfessionalsController(IProfessionalService professionalService)
    {
        _professionalService = professionalService;
    }

    /// <summary>
    /// Buscar profesionales con filtros
    /// GET /api/professionals/search
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<List<ProfessionalSearchDto>>> Search(
        [FromQuery] string? search = null,
        [FromQuery] string? specialty = null,
        [FromQuery] decimal? minRating = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] string sortBy = "rating")
    {
        try
        {
            var results = await _professionalService.SearchProfessionalsAsync(
                search, specialty, minRating, maxPrice, sortBy);

            return Ok(results);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al buscar profesionales", error = ex.Message });
        }
    }

    /// <summary>
    /// Obtener detalles de un profesional por ID
    /// GET /api/professionals/{id}
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ProfessionalDetailDto>> GetById(int id)
    {
        try
        {
            var professional = await _professionalService.GetProfessionalByIdAsync(id);

            if (professional == null)
                return NotFound(new { message = "Profesional no encontrado" });

            return Ok(professional);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener profesional", error = ex.Message });
        }
    }

    /// <summary>
    /// Obtener videos de un profesional
    /// GET /api/professionals/{id}/videos
    /// </summary>
    [HttpGet("{id}/videos")]
    public async Task<ActionResult<List<ProfessionalVideoDto>>> GetVideos(int id)
    {
        try
        {
            var videos = await _professionalService.GetProfessionalVideosAsync(id);
            return Ok(videos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener videos", error = ex.Message });
        }
    }

    /// <summary>
    /// Obtener reviews de un profesional
    /// GET /api/professionals/{id}/reviews
    /// </summary>
    [HttpGet("{id}/reviews")]
    public async Task<ActionResult> GetReviews(int id)
    {
        try
        {
            var reviews = await _professionalService.GetProfessionalReviewsAsync(id);
            return Ok(reviews);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener reviews", error = ex.Message });
        }
    }

    /// <summary>
    /// Obtener disponibilidad de un profesional
    /// GET /api/professionals/{id}/availability
    /// </summary>
    [HttpGet("{id}/availability")]
    public async Task<ActionResult> GetAvailability(int id)
    {
        try
        {
            var availability = await _professionalService.GetProfessionalAvailabilityAsync(id);
            return Ok(availability);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener disponibilidad", error = ex.Message });
        }
    }
}