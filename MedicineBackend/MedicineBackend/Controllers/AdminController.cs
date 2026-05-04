using MedicineBackend.Data;
using MedicineBackend.DTOs.Admin;
using MedicineBackend.DTOs.Chat;
using MedicineBackend.Services;
using MedicineBackend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using System.Text.Json;

namespace MedicineBackend.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly IDoctorManagementService _doctorMgmt;
    private readonly ILogger<AdminController> _logger;
    private readonly AppDbContext _db;
    private readonly IChatService _chatService;
    private readonly IAuthService _authService;

    public AdminController(
        IAdminService adminService,
        IDoctorManagementService doctorMgmt,
        ILogger<AdminController> logger,
        AppDbContext db,
        IChatService chatService,
        IAuthService authService)
    {
        _adminService = adminService;
        _doctorMgmt = doctorMgmt;
        _logger = logger;
        _db = db;
        _chatService = chatService;
        _authService = authService;
    }

    // ════════════════════════════════════════════════════════════════
    // DATOS DEL ADMIN LOGUEADO
    // ════════════════════════════════════════════════════════════════

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var me = await _adminService.GetMeAsync(GetUserId());
        if (me == null) return NotFound(new { message = "Admin no encontrado." });
        return Ok(me);
    }

    // ════════════════════════════════════════════════════════════════
    // DASHBOARD
    // ════════════════════════════════════════════════════════════════

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var stats = await _adminService.GetDashboardStatsAsync();
        return Ok(stats);
    }

    // ════════════════════════════════════════════════════════════════
    // GESTIÓN DE PROFESIONALES
    // ════════════════════════════════════════════════════════════════

    /// <summary>Lista profesionales pendientes de revisión</summary>
    [HttpGet("doctors/pending")]
    public async Task<IActionResult> GetPendingDoctors()
    {
        var list = await _doctorMgmt.GetPendingAsync();
        return Ok(list);
    }

    /// <summary>
    /// Lista todos los profesionales.
    /// Filtro opcional: ?status=active|pending|rejected|deleted
    /// </summary>
    [HttpGet("doctors")]
    public async Task<IActionResult> GetDoctors([FromQuery] string? status)
    {
        var list = await _doctorMgmt.GetAllAsync(status);
        return Ok(list);
    }

    /// <summary>Aprueba al profesional y le da acceso a la plataforma</summary>
    [HttpPut("doctors/{doctorId:int}/approve")]
    public async Task<IActionResult> ApproveDoctor(int doctorId)
    {
        try
        {
            var result = await _doctorMgmt.ApproveAsync(doctorId, GetUserId());
            return Ok(new { message = "Profesional aprobado correctamente.", doctor = result });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    /// <summary>
    /// Rechaza la solicitud del profesional.
    /// ✅ SISTEMA SIMPLIFICADO: Elimina User y Doctor para liberar el email.
    /// El doctor podrá volver a registrarse con el mismo email.
    /// </summary>
    [HttpPut("doctors/{doctorId:int}/reject")]
    public async Task<IActionResult> RejectDoctor(int doctorId, [FromBody] RejectDoctorRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var result = await _doctorMgmt.RejectAsync(doctorId, GetUserId(), req.Reason);
            return Ok(new
            {
                message = "Doctor rechazado y eliminado. El email queda disponible para nuevo registro.",
                doctor = result
            });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    /// <summary>
    /// Baja lógica del profesional (RGPD).
    /// Sus datos históricos se conservan. Sus citas futuras se cancelan.
    /// </summary>
    [HttpDelete("doctors/{doctorId:int}")]
    public async Task<IActionResult> DeleteDoctor(int doctorId, [FromBody] DeleteDoctorRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            await _doctorMgmt.SoftDeleteAsync(doctorId, GetUserId(), req.Reason);
            return Ok(new { message = "Profesional eliminado. Datos históricos conservados (RGPD)." });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    // ════════════════════════════════════════════════════════════════
    // GESTIÓN DE ADMINS — solo SuperAdmin
    // ════════════════════════════════════════════════════════════════

    [HttpGet("admins")]
    public async Task<IActionResult> GetAdmins()
    {
        if (!await _adminService.IsSuperAdminAsync(GetUserId()))
            return Forbid();

        var admins = await _adminService.GetAllAdminsAsync();
        return Ok(admins);
    }

    [HttpPost("admins")]
    public async Task<IActionResult> CreateAdmin([FromBody] CreateAdminRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var result = await _adminService.CreateAdminAsync(GetUserId(), req);
            return Ok(new { message = "Admin creado correctamente.", admin = result });
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("admins/{adminId:int}")]
    public async Task<IActionResult> DeactivateAdmin(int adminId)
    {
        try
        {
            await _adminService.DeactivateAdminAsync(GetUserId(), adminId);
            return Ok(new { message = "Admin desactivado correctamente." });
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPut("admins/{adminId:int}/reactivate")]
    public async Task<IActionResult> ReactivateAdmin(int adminId)
    {
        try
        {
            await _adminService.ReactivateAdminAsync(GetUserId(), adminId);
            return Ok(new { message = "Admin reactivado correctamente." });
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    // ════════════════════════════════════════════════════════════════
    // GESTIÓN DE 2FA — Solo Admin puede desactivar el 2FA de un usuario
    // ════════════════════════════════════════════════════════════════

    /// <summary>
    /// Lista todos los usuarios (pacientes y profesionales) que tienen 2FA activo.
    /// Accesible para cualquier Admin (los admins se gestionan en AdminsSection).
    /// </summary>
    [HttpGet("users/2fa-enabled")]
    public async Task<IActionResult> GetUsersWith2FAEnabled()
    {
        try
        {
            // Profesionales con 2FA activo
            var doctors = await _db.Doctors
                .Where(d => d.User.TwoFactorEnabled)
                .Select(d => new UserWith2FADto
                {
                    UserId   = d.UserId,
                    Email    = d.User.Email,
                    Role     = "Doctor",
                    FullName = d.FullName ?? d.User.Email,
                })
                .ToListAsync();

            // Pacientes con 2FA activo
            var patients = await _db.Patients
                .Where(p => p.User.TwoFactorEnabled)
                .Select(p => new UserWith2FADto
                {
                    UserId   = p.UserId,
                    Email    = p.User.Email,
                    Role     = "Patient",
                    FullName = p.FullName ?? p.User.Email,
                })
                .ToListAsync();

            var result = doctors
                .Concat(patients)
                .OrderBy(u => u.Role)
                .ThenBy(u => u.FullName)
                .ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al listar usuarios con 2FA activo");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Desactiva el 2FA de cualquier usuario (paciente, doctor o admin).
    /// Requiere rol Admin. Se usa cuando el usuario ha perdido su dispositivo.
    /// </summary>
    [HttpDelete("users/{userId:int}/2fa")]
    public async Task<IActionResult> DisableUserTwoFactor(int userId)
    {
        try
        {
            await _authService.AdminDisableTwoFactorAsync(userId);
            _logger.LogInformation("Admin (userId={AdminId}) desactivó el 2FA del usuario {TargetId}", GetUserId(), userId);
            return Ok(new { message = "2FA desactivado correctamente. El usuario puede iniciar sesión sin 2FA." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al desactivar 2FA para userId={UserId}", userId);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    // ════════════════════════════════════════════════════════════════
    // GESTIÓN DE VÍDEOS — Verificación por admin
    // ════════════════════════════════════════════════════════════════

    [HttpGet("videos")]
    public async Task<IActionResult> GetVideos([FromQuery] string filter = "pending")
    {
        try
        {
            var videos = await _adminService.GetVideosAsync(filter);
            return Ok(videos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener vídeos");
            return StatusCode(500, new { message = "Error al obtener los vídeos" });
        }
    }

    [HttpPatch("videos/{videoId:int}/verify")]
    public async Task<IActionResult> VerifyVideo(int videoId, [FromBody] VerifyVideoRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var result = await _adminService.VerifyVideoAsync(videoId, req.IsVerified, GetUserId());
            var message = req.IsVerified
                ? "Vídeo aprobado correctamente"
                : "Vídeo rechazado";

            return Ok(new { message, video = result });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al verificar vídeo {VideoId}", videoId);
            return StatusCode(500, new { message = "Error al verificar el vídeo" });
        }
    }

    // ════════════════════════════════════════════════════════════════
    // DETALLE DE UN PROFESIONAL (perfil + vídeos + cursos)
    // GET /api/admin/doctors/{id}/detail
    // ════════════════════════════════════════════════════════════════

    [HttpGet("doctors/{doctorId:int}/detail")]
    public async Task<IActionResult> GetDoctorDetail(int doctorId)
    {
        try
        {
            var doctor = await _db.Doctors
                .Include(d => d.User)
                .Include(d => d.Specialties)
                .FirstOrDefaultAsync(d => d.Id == doctorId);

            if (doctor == null)
                return NotFound(new { message = "Profesional no encontrado" });

            // Perfil
            var profile = new DoctorAdminDto
            {
                Id = doctor.Id,
                FullName = doctor.FullName,
                Email = doctor.User.Email,
                ProfessionalLicense = doctor.ProfessionalLicense,
                Description = doctor.Description,
                PhoneNumber = doctor.PhoneNumber,
                ProfilePictureUrl = doctor.ProfilePictureUrl,
                YearsOfExperience = doctor.YearsOfExperience,
                PricePerSession = doctor.PricePerSession,
                Status = doctor.Status.ToString(),
                RegisteredAt = doctor.CreatedAt,
                ReviewedAt = doctor.ReviewedAt,
                DeletedAt = doctor.DeletedAt,
                AverageRating = doctor.AverageRating,
                TotalReviews = doctor.TotalReviews,
                Specialties = doctor.Specialties.Select(s => s.Name).ToList(),
                ProfessionalLicenseFrontImageUrl = doctor.ProfessionalLicenseFrontImageUrl,
                ProfessionalLicenseBackImageUrl = doctor.ProfessionalLicenseBackImageUrl,
                IdDocumentFrontImageUrl = doctor.IdDocumentFrontImageUrl,
                IdDocumentBackImageUrl = doctor.IdDocumentBackImageUrl,
                SpecialtyDegreeImageUrls = DeserializeImageUrls(doctor.SpecialtyDegreeImageUrl),
                UniversityDegreeImageUrl = doctor.UniversityDegreeImageUrl,
            };

            // Vídeos
            var videos = await _db.SocialMediaVideos
                .Where(v => v.DoctorId == doctorId)
                .OrderByDescending(v => v.CreatedAt)
                .Select(v => new DoctorVideoSummaryDto
                {
                    Id = v.Id,
                    Title = v.Title,
                    Description = v.Description,
                    Platform = v.Platform,
                    VideoUrl = v.VideoUrl,
                    IsActive = v.IsActive,
                    IsVerified = false,   // SocialMediaVideo no tiene verificación de admin
                    ViewCount = v.ViewCount,
                    LikeCount = v.LikeCount,
                    CreatedAt = v.CreatedAt,
                })
                .ToListAsync();

            // Cursos
            var courses = await _db.Courses
                .Where(c => c.DoctorId == doctorId)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new DoctorCourseSummaryDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Description = c.Description,
                    Price = c.Price,
                    Level = c.Level,
                    Category = c.Category,
                    CoverImageUrl = c.CoverImageUrl,
                    IsPublished = c.IsPublished,
                    TotalEnrollments = c.TotalEnrollments,
                    AverageRating = c.AverageRating,
                    TotalRatings = c.TotalRatings,
                    PublishedAt = c.PublishedAt,
                    CreatedAt = c.CreatedAt,
                })
                .ToListAsync();

            return Ok(new DoctorAdminDetailDto
            {
                Profile = profile,
                Videos = videos,
                Courses = courses,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener detalle del profesional {DoctorId}", doctorId);
            return StatusCode(500, new { message = "Error al obtener el detalle del profesional" });
        }
    }

    // ════════════════════════════════════════════════════════════════
    // PLANES DE CHAT — Admin puede crear, editar y desactivar planes
    // ════════════════════════════════════════════════════════════════

    /// <summary>Lista todos los planes de chat (incluye inactivos)</summary>
    [HttpGet("chat/plans")]
    public async Task<IActionResult> GetChatPlans()
    {
        var plans = await _chatService.GetAllPlansAsync();
        return Ok(plans);
    }

    /// <summary>Crea un nuevo plan de chat</summary>
    [HttpPost("chat/plans")]
    public async Task<IActionResult> CreateChatPlan([FromBody] CreateChatPlanDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var plan = await _chatService.CreatePlanAsync(dto);
            return Ok(new { message = "Plan de chat creado correctamente.", plan });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al crear plan de chat");
            return StatusCode(500, new { message = "Error al crear el plan de chat" });
        }
    }

    /// <summary>Actualiza un plan de chat existente</summary>
    [HttpPut("chat/plans/{id:int}")]
    public async Task<IActionResult> UpdateChatPlan(int id, [FromBody] UpdateChatPlanDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var plan = await _chatService.UpdatePlanAsync(id, dto);
            return Ok(new { message = "Plan de chat actualizado correctamente.", plan });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar plan de chat {Id}", id);
            return StatusCode(500, new { message = "Error al actualizar el plan de chat" });
        }
    }

    /// <summary>Desactiva un plan de chat (no lo elimina, por integridad referencial)</summary>
    [HttpDelete("chat/plans/{id:int}")]
    public async Task<IActionResult> DeactivateChatPlan(int id)
    {
        try
        {
            await _chatService.DeactivatePlanAsync(id);
            return Ok(new { message = "Plan de chat desactivado correctamente." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al desactivar plan de chat {Id}", id);
            return StatusCode(500, new { message = "Error al desactivar el plan de chat" });
        }
    }

    /// <summary>Estadísticas de suscripciones de chat</summary>
    [HttpGet("chat/stats")]
    public async Task<IActionResult> GetChatStats()
    {
        var stats = await _db.ChatSubscriptions
            .GroupBy(s => s.Status)
            .Select(g => new { status = g.Key, count = g.Count(), revenue = g.Sum(s => s.AmountPaid) })
            .ToListAsync();

        var totalRevenue = await _db.ChatSubscriptions
            .Where(s => s.Status == "Active" || s.Status == "Expired")
            .SumAsync(s => (decimal?)s.PlatformEarnings) ?? 0;

        return Ok(new { byStatus = stats, platformRevenue = totalRevenue });
    }

    // ════════════════════════════════════════════════════════════════
    // HELPER
    // ════════════════════════════════════════════════════════════════

    private int GetUserId()
    {
        var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(value, out var id) ? id : throw new UnauthorizedAccessException();
    }

    /// <summary>
    /// Deserializa el campo SpecialtyDegreeImageUrl que puede ser:
    /// - null / vacío → lista vacía
    /// - JSON array: ["url1","url2"] → lista de URLs
    /// - URL simple (registros antiguos): "https://…" → lista con un elemento
    /// </summary>
    private static List<string> DeserializeImageUrls(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return new List<string>();

        // Intentar deserializar como JSON array
        if (raw.TrimStart().StartsWith('['))
        {
            try
            {
                return JsonSerializer.Deserialize<List<string>>(raw) ?? new List<string>();
            }
            catch
            {
                // Si falla, tratar como URL simple
            }
        }

        // Compatibilidad con registros antiguos (URL simple)
        return new List<string> { raw };
    }
}