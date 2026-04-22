// ═══════════════════════════════════════════════════════════════
// Controllers/CoursesController.cs
// Controlador para gestionar cursos
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.Data;
using MedicineBackend.DTOs;
using MedicineBackend.DTOs.DoctorDTO;
using MedicineBackend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MedicineBackend.Controllers;

[ApiController]
[Route("api/doctor/courses")]
[Authorize(Roles = "Doctor")]
public class CoursesController : ControllerBase
{
    private readonly ICourseService _courseService;
    private readonly AppDbContext _context;

    public CoursesController(ICourseService courseService, AppDbContext context)
    {
        _courseService = courseService;
        _context = context;
    }

    // ─────────────────────────────────────────────────────────────
    // ENDPOINT PÚBLICO: Buscar cursos publicados
    // GET /api/doctor/courses/public/search?search=&category=&level=&maxPrice=
    // ─────────────────────────────────────────────────────────────
    [HttpGet("public/search")]
    [AllowAnonymous]
    public async Task<IActionResult> SearchPublicCourses(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] string? level,
        [FromQuery] decimal? maxPrice)
    {
        try
        {
            var query = _context.Courses
                .Include(c => c.Doctor)
                .Where(c => c.IsPublished);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(c =>
                    c.Title.ToLower().Contains(search.ToLower()) ||
                    (c.Description != null && c.Description.ToLower().Contains(search.ToLower())));

            if (!string.IsNullOrEmpty(category))
                query = query.Where(c => c.Category == category);

            if (!string.IsNullOrEmpty(level))
                query = query.Where(c => c.Level == level);

            if (maxPrice.HasValue)
                query = query.Where(c => c.Price <= maxPrice.Value);

            var courses = await query
                .OrderByDescending(c => c.TotalEnrollments)
                .ThenByDescending(c => c.AverageRating)
                .Select(c => new
                {
                    c.Id,
                    c.Title,
                    c.Description,
                    c.Price,
                    c.CoverImageUrl,
                    c.Level,
                    c.Category,
                    c.DurationMinutes,
                    c.Language,
                    c.LearningObjectives,
                    c.TotalEnrollments,
                    c.AverageRating,
                    c.TotalRatings,
                    c.PublishedAt,
                    Doctor = new
                    {
                        c.Doctor.Id,
                        c.Doctor.UserId,        // ← para filtrar en frontend cursos del propio doctor
                        c.Doctor.FirstName,
                        c.Doctor.LastName,
                        c.Doctor.ProfilePictureUrl,
                        c.Doctor.YearsOfExperience,
                        c.Doctor.AverageRating
                    }
                })
                .ToListAsync();

            return Ok(courses);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al buscar cursos", error = ex.Message });
        }
    }

    /// <summary>
    /// Obtiene el Doctor.Id real a partir del UserId del JWT.
    /// El token lleva el User.Id; hay que buscar el Doctor asociado.
    /// </summary>
    private async Task<int> GetCurrentDoctorIdAsync()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            throw new UnauthorizedAccessException("Token inválido");

        var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == userId)
            ?? throw new UnauthorizedAccessException("No se encontró un doctor asociado a este usuario");

        return doctor.Id;
    }

    /// <summary>
    /// Obtener todos los cursos del doctor
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<CourseDto>>> GetCourses()
    {
        try
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            var courses = await _courseService.GetDoctorCoursesAsync(doctorId);
            return Ok(courses);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener cursos", error = ex.Message });
        }
    }

    /// <summary>
    /// Obtener un curso específico
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<CourseDto>> GetCourse(int id)
    {
        try
        {
            var course = await _courseService.GetCourseAsync(id);
            return Ok(course);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener curso", error = ex.Message });
        }
    }

    /// <summary>
    /// Crear nuevo curso
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<CourseDto>> CreateCourse([FromBody] CreateCourseDto dto)
    {
        try
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            var course = await _courseService.CreateCourseAsync(doctorId, dto);
            return CreatedAtAction(nameof(GetCourse), new { id = course.Id }, course);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al crear curso", error = ex.Message });
        }
    }

    /// <summary>
    /// Actualizar curso
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<CourseDto>> UpdateCourse(int id, [FromBody] UpdateCourseDto dto)
    {
        try
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            var course = await _courseService.UpdateCourseAsync(doctorId, id, dto);
            return Ok(course);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al actualizar curso", error = ex.Message });
        }
    }

    /// <summary>
    /// Eliminar curso
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteCourse(int id)
    {
        try
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            await _courseService.DeleteCourseAsync(doctorId, id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al eliminar curso", error = ex.Message });
        }
    }

    /// <summary>
    /// Publicar curso
    /// </summary>
    [HttpPost("{id}/publish")]
    public async Task<ActionResult<CourseDto>> PublishCourse(int id)
    {
        try
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            var course = await _courseService.PublishCourseAsync(doctorId, id);
            return Ok(course);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al publicar curso", error = ex.Message });
        }
    }

    /// <summary>
    /// Despublicar curso
    /// </summary>
    [HttpPost("{id}/unpublish")]
    public async Task<ActionResult<CourseDto>> UnpublishCourse(int id)
    {
        try
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            var course = await _courseService.UnpublishCourseAsync(doctorId, id);
            return Ok(course);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al despublicar curso", error = ex.Message });
        }
    }

    /// <summary>
    /// Subir imagen de portada
    /// </summary>
    [HttpPost("{id}/cover-image")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<object>> UploadCoverImage(int id, [FromForm] FileUploadRequest request)
    {
        try
        {
            if (request.File == null || request.File.Length == 0)
            {
                return BadRequest(new { message = "No se ha enviado ningún archivo" });
            }

            var url = await _courseService.UploadCoverImageAsync(id, request.File);
            return Ok(new { url });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al subir imagen", error = ex.Message });
        }
    }

    /// <summary>
    /// Subir archivo de contenido del curso (vídeo mp4/mov/avi/webm o documento pdf/docx/pptx)
    /// </summary>
    [HttpPost("{id}/content-file")]
    [RequestSizeLimit(524_288_000)] // 500 MB
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<object>> UploadContentFile(int id, [FromForm] FileUploadRequest request)
    {
        try
        {
            if (request.File == null || request.File.Length == 0)
                return BadRequest(new { message = "No se ha enviado ningún archivo" });

            var url = await _courseService.UploadCourseContentFileAsync(id, request.File);
            return Ok(new { url });
        }
        catch (KeyNotFoundException ex)  { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { message = "Error al subir contenido", error = ex.Message }); }
    }

    /// <summary>
    /// Guardar URL de vídeo externo (YouTube, Vimeo, etc.)
    /// </summary>
    [HttpPatch("{id}/content-url")]
    public async Task<ActionResult<object>> SetVideoUrl(int id, [FromBody] SetVideoUrlDto dto)
    {
        try
        {
            var course = await _context.Courses.FindAsync(id)
                ?? throw new KeyNotFoundException("Curso no encontrado");

            course.ContentType = "video_url";
            course.ContentUrl  = dto.Url;
            course.ArticleContent = null;
            course.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { url = course.ContentUrl });
        }
        catch (KeyNotFoundException ex)  { return NotFound(new { message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { message = "Error al guardar URL", error = ex.Message }); }
    }

    /// <summary>
    /// Guardar artículo de texto del curso
    /// </summary>
    [HttpPatch("{id}/content-article")]
    public async Task<ActionResult<object>> SetArticleContent(int id, [FromBody] SetArticleDto dto)
    {
        try
        {
            var course = await _context.Courses.FindAsync(id)
                ?? throw new KeyNotFoundException("Curso no encontrado");

            course.ContentType    = "article";
            course.ArticleContent = dto.Content;
            course.ContentUrl     = null;
            course.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Artículo guardado" });
        }
        catch (KeyNotFoundException ex)  { return NotFound(new { message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { message = "Error al guardar artículo", error = ex.Message }); }
    }

    /// <summary>
    /// Crear módulo del curso
    /// </summary>
    [HttpPost("{courseId}/modules")]
    public async Task<ActionResult<CourseModuleDto>> CreateModule(int courseId, [FromBody] CreateCourseModuleDto dto)
    {
        try
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            var module = await _courseService.CreateModuleAsync(doctorId, courseId, dto);
            return CreatedAtAction(nameof(GetCourse), new { id = courseId }, module);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al crear módulo", error = ex.Message });
        }
    }

    /// <summary>
    /// Actualizar módulo
    /// </summary>
    [HttpPut("{courseId}/modules/{moduleId}")]
    public async Task<ActionResult<CourseModuleDto>> UpdateModule(
        int courseId,
        int moduleId,
        [FromBody] UpdateCourseModuleDto dto)
    {
        try
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            var module = await _courseService.UpdateModuleAsync(doctorId, courseId, moduleId, dto);
            return Ok(module);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al actualizar módulo", error = ex.Message });
        }
    }

    /// <summary>
    /// Eliminar módulo
    /// </summary>
    [HttpDelete("{courseId}/modules/{moduleId}")]
    public async Task<ActionResult> DeleteModule(int courseId, int moduleId)
    {
        try
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            await _courseService.DeleteModuleAsync(doctorId, courseId, moduleId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al eliminar módulo", error = ex.Message });
        }
    }
}