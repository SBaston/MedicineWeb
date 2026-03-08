// ═══════════════════════════════════════════════════════════════
// Backend/DTOs/SpecialtyDtos.cs - ACTUALIZADO
// ═══════════════════════════════════════════════════════════════

using System.ComponentModel.DataAnnotations;

namespace MedicineBackend.DTOs
{
    // ═══════════════════════════════════════════════════════════
    // DTO para CREAR especialidad
    // ═══════════════════════════════════════════════════════════
    public class CreateSpecialtyDto
    {
        [Required(ErrorMessage = "El nombre es obligatorio")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "El nombre debe tener entre 3 y 100 caracteres")]
        public string Name { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "La descripción no puede superar 500 caracteres")]
        public string? Description { get; set; }
    }

    // ═══════════════════════════════════════════════════════════
    // DTO para ACTUALIZAR especialidad
    // SOLO PERMITE EDITAR LA DESCRIPCIÓN (no el nombre)
    // ═══════════════════════════════════════════════════════════
    public class UpdateSpecialtyDto
    {
        [StringLength(500, ErrorMessage = "La descripción no puede superar 500 caracteres")]
        public string? Description { get; set; }
    }

    // ═══════════════════════════════════════════════════════════
    // DTO para MOSTRAR especialidad
    // ═══════════════════════════════════════════════════════════
    public class SpecialtyDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public int DoctorCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? DeletedAt { get; set; }  //soft delete
    }
}