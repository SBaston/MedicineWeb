// ═══════════════════════════════════════════════════════════════
// Backend/Controllers/SpecialtiesController.cs - CON SOFT DELETE
// ✅ ACTUALIZADO: Endpoint público GET /api/specialties
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
        // ✅ ENDPOINT PÚBLICO para buscador de profesionales
        // Obtener especialidades ACTIVAS (sin autenticación)
        // ═══════════════════════════════════════════════════════════
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublic()
        {
            var specialties = await _specialtyService.GetActiveAsync();
            return Ok(specialties);
        }

        // ═══════════════════════════════════════════════════════════
        // GET /api/specialties/active
        // Obtener especialidades ACTIVAS (público - para dropdown doctores)
        // ═══════════════════════════════════════════════════════════
        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActive()
        {
            var specialties = await _specialtyService.GetActiveAsync();
            return Ok(specialties);
        }

        // ═══════════════════════════════════════════════════════════
        // GET /api/specialties/all
        // Obtener especialidades NO ELIMINADAS (admin only)
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
        // GET /api/specialties/all-including-deleted
        // Obtener TODAS incluyendo eliminadas (admin only)
        // ═══════════════════════════════════════════════════════════
        [HttpGet("all-including-deleted")]
        [Authorize]
        public async Task<IActionResult> GetAllIncludingDeleted()
        {
            var userId = GetCurrentUserId();
            await _adminService.AssertIsAdminAsync(userId);

            var specialties = await _specialtyService.GetAllIncludingDeletedAsync();
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
            try
            {
                var userId = GetCurrentUserId();
                await _adminService.AssertIsAdminAsync(userId);

                var specialty = await _specialtyService.CreateAsync(dto);

                return CreatedAtAction(nameof(GetActive), new { id = specialty.Id }, specialty);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ═══════════════════════════════════════════════════════════
        // PUT /api/specialties/{id}
        // Actualizar especialidad (admin only)
        // ═══════════════════════════════════════════════════════════
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateSpecialtyDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _adminService.AssertIsAdminAsync(userId);

                var specialty = await _specialtyService.UpdateAsync(id, dto);

                return Ok(specialty);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // ═══════════════════════════════════════════════════════════
        // DELETE /api/specialties/{id}
        // SOFT DELETE - Archivar especialidad (admin only)
        // ═══════════════════════════════════════════════════════════
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> SoftDelete(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _adminService.AssertIsAdminAsync(userId);

                var specialty = await _specialtyService.SoftDeleteAsync(id);

                return Ok(new
                {
                    message = $"Especialidad '{specialty.Name}' archivada correctamente",
                    specialty
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ═══════════════════════════════════════════════════════════
        // POST /api/specialties/{id}/restore
        // RESTAURAR especialidad eliminada (admin only)
        // ═══════════════════════════════════════════════════════════
        [HttpPost("{id}/restore")]
        [Authorize]
        public async Task<IActionResult> Restore(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _adminService.AssertIsAdminAsync(userId);

                var specialty = await _specialtyService.RestoreAsync(id);

                return Ok(new
                {
                    message = $"Especialidad '{specialty.Name}' restaurada correctamente",
                    specialty
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ═══════════════════════════════════════════════════════════
        // PATCH /api/specialties/{id}/toggle
        // Activar/Desactivar especialidad (admin only)
        // ═══════════════════════════════════════════════════════════
        [HttpPatch("{id}/toggle")]
        [Authorize]
        public async Task<IActionResult> ToggleActive(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _adminService.AssertIsAdminAsync(userId);

                var specialty = await _specialtyService.ToggleActiveAsync(id);

                return Ok(specialty);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}