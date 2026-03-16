// ═══════════════════════════════════════════════════════════════
// Controllers/CoursesController.cs
// Controlador para gestionar cursos
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.DTOs.DoctorDTO;
using MedicineBackend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace MedicineBackend.Controllers;

[ApiController]
[Route("api/doctor/courses")]
[Authorize(Roles = "Doctor")]
public class CoursesController : ControllerBase
{
    private readonly ICourseService _courseService;

    public CoursesController(ICourseService courseService)
    {
        _courseService = courseService;
    }

    private int GetCurrentDoctorId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            throw new UnauthorizedAccessException("Token inválido");
        }
        return userId;
    }

    /// <summary>
    /// Obtener todos los cursos del doctor
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<CourseDto>>> GetCourses()
    {
        try
        {
            var doctorId = GetCurrentDoctorId();
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
            var doctorId = GetCurrentDoctorId();
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
            var doctorId = GetCurrentDoctorId();
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
            var doctorId = GetCurrentDoctorId();
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
            var doctorId = GetCurrentDoctorId();
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
    /// Subir imagen de portada
    /// </summary>
    [HttpPost("{id}/cover-image")]
    public async Task<ActionResult<object>> UploadCoverImage(int id, [FromForm] IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No se ha enviado ningún archivo" });
            }

            var url = await _courseService.UploadCoverImageAsync(id, file);
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
    /// Crear módulo del curso
    /// </summary>
    [HttpPost("{courseId}/modules")]
    public async Task<ActionResult<CourseModuleDto>> CreateModule(int courseId, [FromBody] CreateCourseModuleDto dto)
    {
        try
        {
            var doctorId = GetCurrentDoctorId();
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
            var doctorId = GetCurrentDoctorId();
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
            var doctorId = GetCurrentDoctorId();
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