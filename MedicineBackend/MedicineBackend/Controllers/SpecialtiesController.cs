// ═══════════════════════════════════════════════════════════════
// Backend/Controllers/SpecialtiesController.cs - CORREGIDO
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.DTOs;
using MedicineBackend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace MedicineBackend.Controllers
{
    [ApiController]
    [Route("api/specialties")]
    public class SpecialtiesController : ControllerBase
    {
        private readonly ISpecialtyService _specialtyService;
        private readonly IAdminService _adminService;
        private readonly ILogger<SpecialtiesController> _logger;

        public SpecialtiesController(
            ISpecialtyService specialtyService,
            IAdminService adminService,
            ILogger<SpecialtiesController> logger)
        {
            _specialtyService = specialtyService;
            _adminService = adminService;
            _logger = logger;
        }

        // ═══════════════════════════════════════════════════════════
        // HELPER: Obtener UserId del token JWT
        // ═══════════════════════════════════════════════════════════
        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                throw new UnauthorizedAccessException("Token inválido o usuario no autenticado");
            }

            return userId;
        }

        // ═══════════════════════════════════════════════════════════
        // GET /api/specialties
        // Obtener especialidades ACTIVAS (público - para dropdown doctores)
        // ═══════════════════════════════════════════════════════════
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetActive()
        {
            var specialties = await _specialtyService.GetActiveAsync();
            return Ok(specialties);
        }

        // ═══════════════════════════════════════════════════════════
        // GET /api/specialties/all
        // Obtener TODAS las especialidades (admin only)
        // ═══════════════════════════════════════════════════════════
        [HttpGet("all")]
        [Authorize]
        public async Task<IActionResult> GetAll()
        {
            var userId = GetCurrentUserId();
            await _adminService.AssertIsAdminAsync(userId);

            var specialties = await _specialtyService.GetAllAsync();
            return Ok(specialties);
        }

        // ═══════════════════════════════════════════════════════════
        // POST /api/specialties
        // Crear especialidad (admin only)
        // ═══════════════════════════════════════════════════════════
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateSpecialtyDto dto)
        {
            var userId = GetCurrentUserId();
            await _adminService.AssertIsAdminAsync(userId);

            var specialty = await _specialtyService.CreateAsync(dto);

            _logger.LogInformation($"✅ Especialidad creada: {specialty.Name} (ID: {specialty.Id})");

            return CreatedAtAction(nameof(GetActive), new { id = specialty.Id }, specialty);
        }

        // ═══════════════════════════════════════════════════════════
        // PUT /api/specialties/{id}
        // Actualizar especialidad (admin only)
        // ═══════════════════════════════════════════════════════════
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateSpecialtyDto dto)
        {
            var userId = GetCurrentUserId();
            await _adminService.AssertIsAdminAsync(userId);

            var specialty = await _specialtyService.UpdateAsync(id, dto);

            _logger.LogInformation($"✏️ Especialidad actualizada: {specialty.Name} (ID: {specialty.Id})");

            return Ok(specialty);
        }

        // ═══════════════════════════════════════════════════════════
        // DELETE /api/specialties/{id}
        // Eliminar especialidad (admin only)
        // ═══════════════════════════════════════════════════════════
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetCurrentUserId();
            await _adminService.AssertIsAdminAsync(userId);

            var success = await _specialtyService.DeleteAsync(id);

            if (!success)
            {
                return BadRequest(new { message = "No se puede eliminar. La especialidad tiene doctores asignados." });
            }

            _logger.LogInformation($"🗑️ Especialidad eliminada (ID: {id})");

            return Ok(new { message = "Especialidad eliminada correctamente" });
        }

        // ═══════════════════════════════════════════════════════════
        // PATCH /api/specialties/{id}/toggle
        // Activar/Desactivar especialidad (admin only)
        // ═══════════════════════════════════════════════════════════
        [HttpPatch("{id}/toggle")]
        [Authorize]
        public async Task<IActionResult> ToggleActive(int id)
        {
            var userId = GetCurrentUserId();
            await _adminService.AssertIsAdminAsync(userId);

            var specialty = await _specialtyService.ToggleActiveAsync(id);

            _logger.LogInformation($"🔄 Especialidad {(specialty.IsActive ? "activada" : "desactivada")}: {specialty.Name} (ID: {specialty.Id})");

            return Ok(specialty);
        }
    }
}