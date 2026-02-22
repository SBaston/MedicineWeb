using MedicineBackend.DTOs.Admin;
using MedicineBackend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace MedicineBackend.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly IDoctorManagementService _doctorMgmt;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        IAdminService adminService,
        IDoctorManagementService doctorMgmt,
        ILogger<AdminController> logger)
    {
        _adminService = adminService;
        _doctorMgmt = doctorMgmt;
        _logger = logger;
    }

    // ════════════════════════════════════════════════════════════════
    // DATOS DEL ADMIN LOGUEADO
    // ════════════════════════════════════════════════════════════════

    /// <summary>
    /// Devuelve datos del admin autenticado, incluido IsSuperAdmin.
    /// El frontend lo usa para mostrar u ocultar la sección de gestión de admins.
    /// </summary>
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

    /// <summary>Estadísticas generales para el dashboard del admin</summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var stats = await _adminService.GetDashboardStatsAsync();
        return Ok(stats);
    }

    // ════════════════════════════════════════════════════════════════
    // GESTIÓN DE PROFESIONALES — todos los admins pueden hacer esto
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

    /// <summary>Rechaza la solicitud del profesional con un motivo obligatorio</summary>
    [HttpPut("doctors/{doctorId:int}/reject")]
    public async Task<IActionResult> RejectDoctor(int doctorId, [FromBody] RejectDoctorRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var result = await _doctorMgmt.RejectAsync(doctorId, GetUserId(), req.Reason);
            return Ok(new { message = "Solicitud rechazada.", doctor = result });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
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
    // GESTIÓN DE ADMINS — solo SuperAdmin puede hacer esto
    // ════════════════════════════════════════════════════════════════

    /// <summary>Lista todos los admins. Solo SuperAdmin.</summary>
    [HttpGet("admins")]
    public async Task<IActionResult> GetAdmins()
    {
        if (!await _adminService.IsSuperAdminAsync(GetUserId()))
            return Forbid();

        var admins = await _adminService.GetAllAdminsAsync();
        return Ok(admins);
    }

    /// <summary>Crea un nuevo admin. Solo SuperAdmin.</summary>
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

    /// <summary>Desactiva un admin. Solo SuperAdmin.</summary>
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

    // ════════════════════════════════════════════════════════════════
    // HELPER
    // ════════════════════════════════════════════════════════════════

    private int GetUserId()
    {
        var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(value, out var id) ? id : throw new UnauthorizedAccessException();
    }
}