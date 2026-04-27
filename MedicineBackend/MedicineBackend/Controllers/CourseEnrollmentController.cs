// ═══════════════════════════════════════════════════════════════
// Controllers/CourseEnrollmentController.cs
// Controlador para gestionar inscripciones en cursos (Patients y Doctors)
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.Data;
using MedicineBackend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.Extensions.Logging;
using System.Data;

namespace MedicineBackend.Controllers;

// DTO para actualizar progreso
public record UpdateProgressDto(int Progress);

[ApiController]
[Route("api/courses")]
public class CourseEnrollmentController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<CourseEnrollmentController> _logger;

    public CourseEnrollmentController(AppDbContext context, ILogger<CourseEnrollmentController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/courses/{id}/enroll
    // ─────────────────────────────────────────────────────────────
    /// <summary>
    /// Inscribirse en un curso (Patient o Doctor)
    /// </summary>
    [HttpPost("{id}/enroll")]
    [Authorize(Roles = "Patient,Doctor")]
    public async Task<ActionResult<object>> Enroll(int id)
    {
        try
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
                return Unauthorized(new { message = "Usuario no autenticado" });

            // Verify course exists and is published
            var course = await _context.Courses.FindAsync(id);
            if (course == null)
                return NotFound(new { message = "Curso no encontrado" });

            if (!course.IsPublished)
                return BadRequest(new { message = "El curso no está disponible" });

            CourseEnrollment enrollment;

            // Resolver el enrollment fuera de la transacción (solo lecturas de patient/doctor)
            if (role == "Patient")
            {
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
                if (patient == null)
                    return NotFound(new { message = "Paciente no encontrado" });

                enrollment = new CourseEnrollment
                {
                    CourseId   = id,
                    PatientId  = patient.Id,
                    EnrolledAt = DateTime.UtcNow
                };
            }
            else if (role == "Doctor")
            {
                var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
                if (doctor == null)
                    return NotFound(new { message = "Médico no encontrado" });

                if (course.DoctorId == doctor.Id)
                    return BadRequest(new { message = "No puedes matricularte en tu propio curso" });

                enrollment = new CourseEnrollment
                {
                    CourseId   = id,
                    DoctorId   = doctor.Id,
                    EnrolledAt = DateTime.UtcNow
                };
            }
            else
            {
                return Forbid();
            }

            // Transacción Serializable: el check de duplicado y la inserción son atómicos
            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);
            try
            {
                // Re-verificar dentro de la transacción para evitar race conditions
                var alreadyEnrolled = enrollment.PatientId.HasValue
                    ? await _context.CourseEnrollments.AnyAsync(e => e.CourseId == id && e.PatientId == enrollment.PatientId)
                    : await _context.CourseEnrollments.AnyAsync(e => e.CourseId == id && e.DoctorId  == enrollment.DoctorId);

                if (alreadyEnrolled)
                {
                    await transaction.RollbackAsync();
                    return Conflict(new { message = "Ya estás inscrito en este curso" });
                }

                _context.CourseEnrollments.Add(enrollment);
                await _context.SaveChangesAsync();

                // Incremento atómico para evitar carreras en el contador
                await _context.Courses
                    .Where(c => c.Id == id)
                    .ExecuteUpdateAsync(s => s.SetProperty(c => c.TotalEnrollments, c => c.TotalEnrollments + 1));

                await transaction.CommitAsync();
            }
            catch (DbUpdateException)
            {
                await transaction.RollbackAsync();
                // El índice único de BD actuó como red de seguridad
                return Conflict(new { message = "Ya estás inscrito en este curso" });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }

            // Recargar course para tener TotalEnrollments actualizado en la respuesta
            await _context.Entry(course).ReloadAsync();

            _logger.LogInformation("User {UserId} (role: {Role}) enrolled in course {CourseId}", userId, role, id);

            return Ok(new
            {
                id            = enrollment.Id,
                courseId      = enrollment.CourseId,
                enrolledAt    = enrollment.EnrolledAt,
                progress      = enrollment.Progress,
                isCompleted   = enrollment.IsCompleted,
                course = new
                {
                    id              = course.Id,
                    title           = course.Title,
                    description     = course.Description,
                    price           = course.Price,
                    coverImageUrl   = course.CoverImageUrl,
                    level           = course.Level,
                    category        = course.Category,
                    durationMinutes = course.DurationMinutes
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al inscribirse en el curso {CourseId}", id);
            return StatusCode(500, new { message = "Error al procesar la inscripción", error = ex.Message });
        }
    }

    // ─────────────────────────────────────────────────────────────
    // DELETE /api/courses/{id}/enroll
    // ─────────────────────────────────────────────────────────────
    /// <summary>
    /// Darse de baja de un curso (Patient o Doctor)
    /// </summary>
    [HttpDelete("{id}/enroll")]
    [Authorize(Roles = "Patient,Doctor")]
    public async Task<ActionResult> Unenroll(int id)
    {
        try
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
                return Unauthorized(new { message = "Usuario no autenticado" });

            CourseEnrollment? enrollment = null;

            if (role == "Patient")
            {
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
                if (patient == null)
                    return NotFound(new { message = "Paciente no encontrado" });

                enrollment = await _context.CourseEnrollments
                    .FirstOrDefaultAsync(e => e.CourseId == id && e.PatientId == patient.Id);
            }
            else if (role == "Doctor")
            {
                var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
                if (doctor == null)
                    return NotFound(new { message = "Médico no encontrado" });

                enrollment = await _context.CourseEnrollments
                    .FirstOrDefaultAsync(e => e.CourseId == id && e.DoctorId == doctor.Id);
            }
            else
            {
                return Forbid();
            }

            if (enrollment == null)
                return NotFound(new { message = "No estás inscrito en este curso" });

            _context.CourseEnrollments.Remove(enrollment);
            await _context.SaveChangesAsync();

            // Decremento atómico — nunca baja de 0
            await _context.Courses
                .Where(c => c.Id == id && c.TotalEnrollments > 0)
                .ExecuteUpdateAsync(s => s.SetProperty(c => c.TotalEnrollments, c => c.TotalEnrollments - 1));

            _logger.LogInformation("User {UserId} (role: {Role}) unenrolled from course {CourseId}", userId, role, id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al darse de baja del curso {CourseId}", id);
            return StatusCode(500, new { message = "Error al procesar la baja", error = ex.Message });
        }
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/courses/{id}/my-enrollment
    // ─────────────────────────────────────────────────────────────
    /// <summary>
    /// Obtener inscripción propia en un curso (null si no inscrito)
    /// </summary>
    [HttpGet("{id}/my-enrollment")]
    [Authorize(Roles = "Patient,Doctor")]
    public async Task<ActionResult<object>> GetMyEnrollment(int id)
    {
        try
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
                return Unauthorized(new { message = "Usuario no autenticado" });

            CourseEnrollment? enrollment = null;

            if (role == "Patient")
            {
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
                if (patient != null)
                {
                    enrollment = await _context.CourseEnrollments
                        .Include(e => e.Course)
                        .FirstOrDefaultAsync(e => e.CourseId == id && e.PatientId == patient.Id);
                }
            }
            else if (role == "Doctor")
            {
                var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
                if (doctor != null)
                {
                    enrollment = await _context.CourseEnrollments
                        .Include(e => e.Course)
                        .FirstOrDefaultAsync(e => e.CourseId == id && e.DoctorId == doctor.Id);
                }
            }

            if (enrollment == null)
                return Ok((object?)null);

            return Ok(new
            {
                id = enrollment.Id,
                courseId = enrollment.CourseId,
                enrolledAt = enrollment.EnrolledAt,
                progress = enrollment.Progress,
                isCompleted = enrollment.IsCompleted,
                course = enrollment.Course == null ? null : new
                {
                    id = enrollment.Course.Id,
                    title = enrollment.Course.Title,
                    description = enrollment.Course.Description,
                    price = enrollment.Course.Price,
                    coverImageUrl = enrollment.Course.CoverImageUrl,
                    level = enrollment.Course.Level,
                    category = enrollment.Course.Category,
                    durationMinutes = enrollment.Course.DurationMinutes
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener inscripción del curso {CourseId}", id);
            return StatusCode(500, new { message = "Error al obtener la inscripción", error = ex.Message });
        }
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/courses/{id}/content
    // ─────────────────────────────────────────────────────────────
    /// <summary>
    /// Obtener el contenido completo del curso (módulos) para usuarios inscritos.
    /// Los doctores propietarios del curso también pueden acceder.
    /// </summary>
    [HttpGet("{id}/content")]
    [Authorize(Roles = "Patient,Doctor")]
    public async Task<IActionResult> GetCourseContent(int id)
    {
        try
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var role      = User.FindFirst(ClaimTypes.Role)?.Value;

            if (!int.TryParse(userIdStr, out var userId))
                return Unauthorized(new { message = "Usuario no autenticado" });

            bool hasAccess = false;

            if (role == "Patient")
            {
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
                if (patient != null)
                    hasAccess = await _context.CourseEnrollments
                        .AnyAsync(e => e.CourseId == id && e.PatientId == patient.Id);
            }
            else if (role == "Doctor")
            {
                var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
                if (doctor != null)
                {
                    // El doctor que creó el curso o que está inscrito
                    var ownsCourse = await _context.Courses.AnyAsync(c => c.Id == id && c.DoctorId == doctor.Id);
                    var isEnrolled = await _context.CourseEnrollments.AnyAsync(e => e.CourseId == id && e.DoctorId == doctor.Id);
                    hasAccess = ownsCourse || isEnrolled;
                }
            }

            if (!hasAccess)
                return StatusCode(403, new { message = "No estás inscrito en este curso" });

            var course = await _context.Courses
                .Include(c => c.Modules.Where(m => m.IsPublished))
                .FirstOrDefaultAsync(c => c.Id == id);

            if (course == null)
                return NotFound(new { message = "Curso no encontrado" });

            var modules = course.Modules
                .OrderBy(m => m.OrderIndex)
                .Select(m => new
                {
                    m.Id,
                    m.Title,
                    m.Content,
                    m.VideoUrl,
                    m.VideoDurationMinutes,
                    m.OrderIndex,
                    m.ContentType,
                    m.ResourceUrl,
                    m.IsFree
                })
                .ToList();

            return Ok(new
            {
                id             = course.Id,
                title          = course.Title,
                contentType    = course.ContentType,
                contentUrl     = course.ContentUrl,
                articleContent = course.ArticleContent,
                modules
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener contenido del curso {CourseId}", id);
            return StatusCode(500, new { message = "Error al obtener el contenido del curso" });
        }
    }

    // ─────────────────────────────────────────────────────────────
    // PUT /api/courses/{id}/progress
    // ─────────────────────────────────────────────────────────────
    /// <summary>
    /// Actualiza el progreso del usuario en un curso (0–100).
    /// Marca como completado automáticamente al llegar a 100.
    /// </summary>
    [HttpPut("{id}/progress")]
    [Authorize(Roles = "Patient,Doctor")]
    public async Task<IActionResult> UpdateProgress(int id, [FromBody] UpdateProgressDto dto)
    {
        try
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var role      = User.FindFirst(ClaimTypes.Role)?.Value;

            if (!int.TryParse(userIdStr, out var userId))
                return Unauthorized(new { message = "Usuario no autenticado" });

            CourseEnrollment? enrollment = null;

            if (role == "Patient")
            {
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
                if (patient != null)
                    enrollment = await _context.CourseEnrollments
                        .FirstOrDefaultAsync(e => e.CourseId == id && e.PatientId == patient.Id);
            }
            else if (role == "Doctor")
            {
                var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
                if (doctor != null)
                    enrollment = await _context.CourseEnrollments
                        .FirstOrDefaultAsync(e => e.CourseId == id && e.DoctorId == doctor.Id);
            }

            if (enrollment == null)
                return NotFound(new { message = "No estás inscrito en este curso" });

            var newProgress = Math.Clamp(dto.Progress, 0, 100);
            enrollment.Progress         = newProgress;
            enrollment.IsCompleted      = newProgress >= 100;
            enrollment.LastAccessedAt   = DateTime.UtcNow;

            if (enrollment.IsCompleted && enrollment.CompletedAt == null)
                enrollment.CompletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("User {UserId} updated progress on course {CourseId} to {Progress}%", userId, id, newProgress);

            return Ok(new
            {
                progress    = enrollment.Progress,
                isCompleted = enrollment.IsCompleted,
                completedAt = enrollment.CompletedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar progreso del curso {CourseId}", id);
            return StatusCode(500, new { message = "Error al actualizar el progreso" });
        }
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/courses/my-enrollments
    // ─────────────────────────────────────────────────────────────
    /// <summary>
    /// Obtener todas las inscripciones del usuario actual con datos del curso
    /// </summary>
    [HttpGet("my-enrollments")]
    [Authorize(Roles = "Patient,Doctor")]
    public async Task<ActionResult<object>> GetMyEnrollments()
    {
        try
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
                return Unauthorized(new { message = "Usuario no autenticado" });

            List<CourseEnrollment> enrollments = new();

            if (role == "Patient")
            {
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
                if (patient != null)
                {
                    enrollments = await _context.CourseEnrollments
                        .Include(e => e.Course)
                        .Where(e => e.PatientId == patient.Id)
                        .OrderByDescending(e => e.EnrolledAt)
                        .ToListAsync();
                }
            }
            else if (role == "Doctor")
            {
                var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
                if (doctor != null)
                {
                    enrollments = await _context.CourseEnrollments
                        .Include(e => e.Course)
                        .Where(e => e.DoctorId == doctor.Id)
                        .OrderByDescending(e => e.EnrolledAt)
                        .ToListAsync();
                }
            }

            var result = enrollments.Select(e => new
            {
                id = e.Id,
                courseId = e.CourseId,
                enrolledAt = e.EnrolledAt,
                progress = e.Progress,
                isCompleted = e.IsCompleted,
                course = e.Course == null ? null : new
                {
                    id = e.Course.Id,
                    title = e.Course.Title,
                    description = e.Course.Description,
                    price = e.Course.Price,
                    coverImageUrl = e.Course.CoverImageUrl,
                    level = e.Course.Level,
                    category = e.Course.Category,
                    durationMinutes = e.Course.DurationMinutes
                }
            });

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener inscripciones del usuario");
            return StatusCode(500, new { message = "Error al obtener las inscripciones", error = ex.Message });
        }
    }
}
