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
                CreatedAt = specialty.CreatedAt
            };
        }

        // ═══════════════════════════════════════════════════════════
        // GET ALL
        // ═══════════════════════════════════════════════════════════
        public async Task<List<SpecialtyDto>> GetAllAsync()
        {
            var specialties = await _context.Specialties
                .Include(s => s.Doctors)
                .OrderBy(s => s.Name)
                .ToListAsync();

            return specialties.Select(MapToDto).ToList();
        }

        // ═══════════════════════════════════════════════════════════
        // GET ACTIVE
        // ═══════════════════════════════════════════════════════════
        public async Task<List<SpecialtyDto>> GetActiveAsync()
        {
            var specialties = await _context.Specialties
                .Where(s => s.IsActive)
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
            // Verificar si ya existe
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
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Specialties.Add(specialty);
            await _context.SaveChangesAsync();

            return MapToDto(specialty);
        }

        // ═══════════════════════════════════════════════════════════
        // UPDATE - SOLO DESCRIPCIÓN (NO NOMBRE)
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

            // Solo actualizar la descripción
            specialty.Description = dto.Description;
            specialty.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToDto(specialty);
        }

        // ═══════════════════════════════════════════════════════════
        // DELETE
        // ═══════════════════════════════════════════════════════════
        public async Task<bool> DeleteAsync(int id)
        {
            var specialty = await _context.Specialties
                .Include(s => s.Doctors)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (specialty == null)
            {
                return false;
            }

            // No permitir eliminar si tiene doctores asignados
            if (specialty.Doctors != null && specialty.Doctors.Any())
            {
                throw new InvalidOperationException(
                    $"No se puede eliminar la especialidad '{specialty.Name}' porque tiene {specialty.Doctors.Count} doctor(es) asignado(s)"
                );
            }

            _context.Specialties.Remove(specialty);
            await _context.SaveChangesAsync();

            return true;
        }

        // ═══════════════════════════════════════════════════════════
        // TOGGLE ACTIVE
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

            specialty.IsActive = !specialty.IsActive;
            specialty.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToDto(specialty);
        }
    }
}