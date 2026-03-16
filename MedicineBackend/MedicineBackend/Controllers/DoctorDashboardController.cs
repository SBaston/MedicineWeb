using MedicineBackend.Data;
using MedicineBackend.DTOs.DoctorDTO;
using MedicineBackend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MedicineBackend.Controllers
{
    [ApiController]
    [Route("api/doctor")]
    [Authorize(Roles = "Doctor")]
    public class DoctorDashboardController : ControllerBase
    {
        private readonly IDoctorDashboardService _service;
        private readonly AppDbContext _context;

        public DoctorDashboardController(IDoctorDashboardService service, AppDbContext context)
        {
            _service = service;
            _context = context;
        }

        /// <summary>
        /// Obtiene el ID del doctor actual desde el token JWT
        /// </summary>
        private async Task<int> GetCurrentDoctorIdAsync()
        {
            // 1. Obtener el UserId del token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
            {
                throw new UnauthorizedAccessException("Token inválido: no se encontró el UserId");
            }

            var userId = int.Parse(userIdClaim);

            // 2. Buscar el Doctor asociado a ese UserId
            var doctor = await _context.Doctors
                .FirstOrDefaultAsync(d => d.UserId == userId);

            if (doctor == null)
            {
                throw new UnauthorizedAccessException("No se encontró un doctor asociado a este usuario");
            }

            // 3. Devolver el DoctorId (no el UserId)
            return doctor.Id;
        }

        // ═══════════════════════════════════════════════════════════
        // DASHBOARD
        // ═══════════════════════════════════════════════════════════

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            var stats = await _service.GetDashboardStatsAsync(doctorId);
            return Ok(stats);
        }

        // ═══════════════════════════════════════════════════════════
        // PROFILE
        // ═══════════════════════════════════════════════════════════

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            var profile = await _service.GetProfileAsync(doctorId);
            return Ok(profile);
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateDoctorProfileDto dto)
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            await _service.UpdateProfileAsync(doctorId, dto);
            return Ok(new { message = "Perfil actualizado correctamente" });
        }

        [HttpPost("profile/picture")]
        public async Task<IActionResult> UploadProfilePicture([FromForm] IFormFile file)
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            var url = await _service.UploadProfilePictureAsync(doctorId, file);
            return Ok(new { profilePictureUrl = url });
        }

        // ═══════════════════════════════════════════════════════════
        // AVAILABILITY
        // ═══════════════════════════════════════════════════════════

        [HttpGet("availability")]
        public async Task<IActionResult> GetAvailabilities()
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            var availabilities = await _service.GetAvailabilitiesAsync(doctorId);
            return Ok(availabilities);
        }

        [HttpPost("availability")]
        public async Task<IActionResult> CreateAvailability([FromBody] CreateAvailabilityDto dto)
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            var availability = await _service.CreateAvailabilityAsync(doctorId, dto);
            return Ok(availability);
        }

        [HttpPut("availability/{id}")]
        public async Task<IActionResult> UpdateAvailability(int id, [FromBody] UpdateAvailabilityDto dto)
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            await _service.UpdateAvailabilityAsync(doctorId, id, dto);
            return Ok(new { message = "Disponibilidad actualizada" });
        }

        [HttpDelete("availability/{id}")]
        public async Task<IActionResult> DeleteAvailability(int id)
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            await _service.DeleteAvailabilityAsync(doctorId, id);
            return Ok(new { message = "Disponibilidad eliminada" });
        }

        // ═══════════════════════════════════════════════════════════
        // VIDEOS
        // ═══════════════════════════════════════════════════════════

        [HttpGet("videos")]
        public async Task<IActionResult> GetVideos()
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            var videos = await _service.GetVideosAsync(doctorId);
            return Ok(videos);
        }

        [HttpPost("videos")]
        public async Task<IActionResult> CreateVideo([FromBody] CreateVideoDto dto)
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            var video = await _service.CreateVideoAsync(doctorId, dto);
            return Ok(video);
        }

        [HttpPut("videos/{id}")]
        public async Task<IActionResult> UpdateVideo(int id, [FromBody] UpdateVideoDto dto)
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            await _service.UpdateVideoAsync(doctorId, id, dto);
            return Ok(new { message = "Vídeo actualizado" });
        }

        [HttpDelete("videos/{id}")]
        public async Task<IActionResult> DeleteVideo(int id)
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            await _service.DeleteVideoAsync(doctorId, id);
            return Ok(new { message = "Vídeo eliminado" });
        }

        [HttpPatch("videos/{id}/toggle")]
        public async Task<IActionResult> ToggleVideoStatus(int id)
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            await _service.ToggleVideoStatusAsync(doctorId, id);
            return Ok(new { message = "Estado del vídeo actualizado" });
        }

        // ═══════════════════════════════════════════════════════════
        // EARNINGS
        // ═══════════════════════════════════════════════════════════

        [HttpGet("earnings")]
        public async Task<IActionResult> GetEarnings([FromQuery] string timeRange = "month", [FromQuery] string filterType = "all")
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            var earnings = await _service.GetEarningsAsync(doctorId, timeRange, filterType);
            return Ok(earnings);
        }

        // ═══════════════════════════════════════════════════════════
        // PRICING
        // ═══════════════════════════════════════════════════════════

        [HttpGet("pricing")]
        public async Task<IActionResult> GetPricing()
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            var pricing = await _service.GetPricingAsync(doctorId);
            return Ok(pricing);
        }

        [HttpPut("pricing")]
        public async Task<IActionResult> UpdatePricing([FromBody] UpdatePricingDto dto)
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            await _service.UpdatePricingAsync(doctorId, dto);
            return Ok(new { message = "Precios actualizados correctamente" });
        }
    }
}