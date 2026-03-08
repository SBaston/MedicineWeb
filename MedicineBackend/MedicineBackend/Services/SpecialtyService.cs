// ═══════════════════════════════════════════════════════════════
// Backend/Services/SpecialtyService.cs - ACTUALIZADO
// Método UPDATE solo permite editar DESCRIPCIÓN
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.Data;
using MedicineBackend.DTOs;
using MedicineBackend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MedicineBackend.Services
{

    public class SpecialtyService : ISpecialtyService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<SpecialtyService> _logger;

        public SpecialtyService(AppDbContext context, ILogger<SpecialtyService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ═══════════════════════════════════════════════════════════
        // Helper: Convertir Specialty a SpecialtyDto
        // ═══════════════════════════════════════════════════════════
        private SpecialtyDto MapToDto(Specialty specialty)
        {
            return new SpecialtyDto
            {
                Id = specialty.Id,
                Name = specialty.Name,
                Description = specialty.Description,
                IsActive = specialty.IsActive,
                DoctorCount = specialty.Doctors?.Count ?? 0,
                CreatedAt = specialty.CreatedAt,
                DeletedAt = specialty.DeletedAt
            };
        }

        // ═══════════════════════════════════════════════════════════
        // GET ALL (solo activas, no eliminadas)
        // ═══════════════════════════════════════════════════════════
        public async Task<List<SpecialtyDto>> GetAllAsync()
        {
            var specialties = await _context.Specialties
                .Where(s => s.DeletedAt == null) // ← Excluir eliminadas
                .Include(s => s.Doctors)
                .OrderBy(s => s.Name)
                .ToListAsync();

            return specialties.Select(MapToDto).ToList();
        }

        // ═══════════════════════════════════════════════════════════
        // GET ALL INCLUDING DELETED (admin only)
        // ═══════════════════════════════════════════════════════════
        public async Task<List<SpecialtyDto>> GetAllIncludingDeletedAsync()
        {
            var specialties = await _context.Specialties
                .Include(s => s.Doctors)
                .OrderByDescending(s => s.DeletedAt == null) // Activas primero
                .ThenBy(s => s.Name)
                .ToListAsync();

            return specialties.Select(MapToDto).ToList();
        }

        // ═══════════════════════════════════════════════════════════
        // GET ACTIVE (solo activas y no eliminadas - para dropdown)
        // ═══════════════════════════════════════════════════════════
        public async Task<List<SpecialtyDto>> GetActiveAsync()
        {
            var specialties = await _context.Specialties
                .Where(s => s.IsActive && s.DeletedAt == null) // ← Activas y no eliminadas
                .OrderBy(s => s.Name)
                .ToListAsync();

            return specialties.Select(s => new SpecialtyDto
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description,
                IsActive = s.IsActive,
                CreatedAt = s.CreatedAt
            }).ToList();
        }

        // ═══════════════════════════════════════════════════════════
        // GET BY ID
        // ═══════════════════════════════════════════════════════════
        public async Task<SpecialtyDto?> GetByIdAsync(int id)
        {
            var specialty = await _context.Specialties
                .Include(s => s.Doctors)
                .FirstOrDefaultAsync(s => s.Id == id);

            return specialty == null ? null : MapToDto(specialty);
        }

        // ═══════════════════════════════════════════════════════════
        // CREATE
        // ═══════════════════════════════════════════════════════════
        public async Task<SpecialtyDto> CreateAsync(CreateSpecialtyDto dto)
        {
            // Verificar si ya existe (incluyendo eliminadas)
            var exists = await _context.Specialties
                .AnyAsync(s => s.Name.ToLower() == dto.Name.ToLower());

            if (exists)
            {
                throw new InvalidOperationException($"Ya existe una especialidad con el nombre '{dto.Name}'");
            }

            var specialty = new Specialty
            {
                Name = dto.Name,
                Description = dto.Description,
                IsActive = true,
                DeletedAt = null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Specialties.Add(specialty);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"✅ Especialidad creada: {specialty.Name} (ID: {specialty.Id})");

            return MapToDto(specialty);
        }

        // ═══════════════════════════════════════════════════════════
        // UPDATE - SOLO DESCRIPCIÓN
        // ═══════════════════════════════════════════════════════════
        public async Task<SpecialtyDto> UpdateAsync(int id, UpdateSpecialtyDto dto)
        {
            var specialty = await _context.Specialties
                .Include(s => s.Doctors)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (specialty == null)
            {
                throw new KeyNotFoundException($"Especialidad con ID {id} no encontrada");
            }

            // Solo actualizar descripción
            specialty.Description = dto.Description;
            specialty.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation($"✏️ Especialidad actualizada: {specialty.Name} (ID: {id})");

            return MapToDto(specialty);
        }

        // ═══════════════════════════════════════════════════════════
        // SOFT DELETE - NO elimina físicamente
        // ═══════════════════════════════════════════════════════════
        public async Task<SpecialtyDto> SoftDeleteAsync(int id)
        {
            var specialty = await _context.Specialties
                .Include(s => s.Doctors)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (specialty == null)
            {
                throw new KeyNotFoundException($"Especialidad con ID {id} no encontrada");
            }

            if (specialty.DeletedAt != null)
            {
                throw new InvalidOperationException($"La especialidad '{specialty.Name}' ya está eliminada");
            }

            // Soft delete: marcar como eliminada
            specialty.IsActive = false;
            specialty.DeletedAt = DateTime.UtcNow;
            specialty.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogWarning($"🗑️ Especialidad archivada: {specialty.Name} (ID: {id}) - {specialty.Doctors.Count} doctores conservan su historial");

            return MapToDto(specialty);
        }

        // ═══════════════════════════════════════════════════════════
        // RESTORE - Restaurar especialidad eliminada
        // ═══════════════════════════════════════════════════════════
        public async Task<SpecialtyDto> RestoreAsync(int id)
        {
            var specialty = await _context.Specialties
                .Include(s => s.Doctors)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (specialty == null)
            {
                throw new KeyNotFoundException($"Especialidad con ID {id} no encontrada");
            }

            if (specialty.DeletedAt == null)
            {
                throw new InvalidOperationException($"La especialidad '{specialty.Name}' no está eliminada");
            }

            // Restaurar
            specialty.IsActive = true;
            specialty.DeletedAt = null;
            specialty.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation($"♻️ Especialidad restaurada: {specialty.Name} (ID: {id})");

            return MapToDto(specialty);
        }

        // ═══════════════════════════════════════════════════════════
        // TOGGLE ACTIVE/INACTIVE
        // ═══════════════════════════════════════════════════════════
        public async Task<SpecialtyDto> ToggleActiveAsync(int id)
        {
            var specialty = await _context.Specialties
                .Include(s => s.Doctors)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (specialty == null)
            {
                throw new KeyNotFoundException($"Especialidad con ID {id} no encontrada");
            }

            if (specialty.DeletedAt != null)
            {
                throw new InvalidOperationException($"No se puede cambiar el estado de una especialidad eliminada. Restaurala primero.");
            }

            specialty.IsActive = !specialty.IsActive;
            specialty.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation($"🔄 Especialidad {(specialty.IsActive ? "activada" : "desactivada")}: {specialty.Name} (ID: {id})");

            return MapToDto(specialty);
        }
    }
}