using MedicineBackend.Data;
using MedicineBackend.DTOs.Admin;
using MedicineBackend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MedicineBackend.Services;

/// <summary>
/// Servicio de gestión de profesionales - Sistema simplificado
/// ✅ ACTUALIZADO: Sin sistema de correcciones, solo aprobar/rechazar
/// </summary>
public class DoctorManagementService : IDoctorManagementService
{
    private readonly AppDbContext _db;
    private readonly ILogger<DoctorManagementService> _logger;

    public DoctorManagementService(AppDbContext db, ILogger<DoctorManagementService> logger)
    {
        _db = db;
        _logger = logger;
    }

    // ══════════════════════════════════════════════════════════════
    // LISTAR PROFESIONALES PENDIENTES DE REVISIÓN
    // ══════════════════════════════════════════════════════════════

    public async Task<List<PendingDoctorDto>> GetPendingAsync()
    {
        return await _db.Doctors
            .Include(d => d.User)
            .Include(d => d.Specialties)
            .Where(d => d.DeletedAt == null && d.Status == DoctorStatus.PendingReview)
            .OrderBy(d => d.CreatedAt)
            .Select(d => new PendingDoctorDto
            {
                Id = d.Id,
                FullName = d.FullName,
                Email = d.User.Email,
                ProfessionalLicense = d.ProfessionalLicense,
                Description = d.Description,
                PhoneNumber = d.PhoneNumber,
                ProfilePictureUrl = d.ProfilePictureUrl,
                YearsOfExperience = d.YearsOfExperience,
                PricePerSession = d.PricePerSession,
                Status = d.Status.ToString(),
                RegisteredAt = d.CreatedAt,
                Specialties = d.Specialties.Select(s => s.Name).ToList(),

                // Imágenes
                ProfessionalLicenseFrontImageUrl = d.ProfessionalLicenseFrontImageUrl,
                ProfessionalLicenseBackImageUrl = d.ProfessionalLicenseBackImageUrl,
                IdDocumentFrontImageUrl = d.IdDocumentFrontImageUrl,
                IdDocumentBackImageUrl = d.IdDocumentBackImageUrl,
                SpecialtyDegreeImageUrl = d.SpecialtyDegreeImageUrl,
                UniversityDegreeImageUrl = d.UniversityDegreeImageUrl
            })
            .ToListAsync();
    }

    // ══════════════════════════════════════════════════════════════
    // LISTAR TODOS LOS PROFESIONALES (con filtro opcional)
    // ══════════════════════════════════════════════════════════════

    public async Task<List<DoctorAdminDto>> GetAllAsync(string? status)
    {
        var q = _db.Doctors
            .Include(d => d.User)
            .Include(d => d.Specialties)
            .AsQueryable();

        q = status?.ToLower() switch
        {
            "pending" => q.Where(d => d.Status == DoctorStatus.PendingReview && d.DeletedAt == null),
            "active" => q.Where(d => d.Status == DoctorStatus.Active && d.DeletedAt == null),
            "rejected" => q.Where(d => d.Status == DoctorStatus.Rejected && d.DeletedAt == null),
            "deleted" => q.Where(d => d.DeletedAt != null),
            _ => q.Where(d => d.DeletedAt == null),
        };

        return await q.OrderByDescending(d => d.CreatedAt)
                      .Select(d => ToAdminDto(d))
                      .ToListAsync();
    }

    // ══════════════════════════════════════════════════════════════
    // APROBAR — da acceso al profesional a la plataforma
    // ══════════════════════════════════════════════════════════════

    public async Task<DoctorAdminDto> ApproveAsync(int doctorId, int adminUserId)
    {
        var doctor = await GetDoctorOrThrowAsync(doctorId);

        if (doctor.Status == DoctorStatus.Active)
            throw new InvalidOperationException("El profesional ya está activo.");

        var adminId = await GetAdminIdAsync(adminUserId);

        doctor.Status = DoctorStatus.Active;
        doctor.StatusReason = null;
        doctor.ReviewedByAdminId = adminId;
        doctor.ReviewedAt = DateTime.UtcNow;
        doctor.UpdatedAt = DateTime.UtcNow;
        doctor.User.IsActive = true;

        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Admin {AdminUser} aprobó al profesional {DoctorId} ({Name})",
            adminUserId, doctorId, doctor.FullName);

        // TODO: Enviar email de bienvenida al profesional
        return ToAdminDto(doctor);
    }

    // ══════════════════════════════════════════════════════════════
    // RECHAZAR - ELIMINA User y Doctor para liberar el email
    // ══════════════════════════════════════════════════════════════

    /// <summary>
    /// ✅ CORREGIDO: Rechaza y ELIMINA completamente sin guardar el motivo
    /// </summary>
    public async Task<DoctorAdminDto> RejectAsync(int doctorId, int adminUserId, string reason)
    {
        var doctor = await _db.Doctors
            .Include(d => d.User)
            .Include(d => d.Specialties)
            .FirstOrDefaultAsync(d => d.Id == doctorId);

        if (doctor == null)
            throw new KeyNotFoundException("Doctor no encontrado");

        if (doctor.DeletedAt != null)
            throw new InvalidOperationException("El doctor ya está eliminado");

        // Guardar info SOLO para logging (no para BD)
        var doctorEmail = doctor.User.Email;
        var doctorName = doctor.FullName;
        var adminId = await GetAdminIdAsync(adminUserId);

        // Crear DTO ANTES de eliminar (para la respuesta)
        var resultDto = new DoctorAdminDto
        {
            Id = doctor.Id,
            FullName = doctor.FullName,
            Email = doctor.User.Email,
            ProfessionalLicense = doctor.ProfessionalLicense,
            Status = "Rejected"
        };

        // ✅ ELIMINAR DIRECTAMENTE - Sin guardar nada en BD
        _db.Doctors.Remove(doctor);
        _db.Users.Remove(doctor.User);

        await _db.SaveChangesAsync();

        // Log con el motivo (para auditoría)
        _logger.LogWarning(
            "📧 Admin {AdminId} rechazó definitivamente al doctor {DoctorName} ({Email}). " +
            "User y Doctor eliminados de la BD. Email liberado para re-registro. " +
            "Motivo: {Reason}",
            adminUserId, doctorName, doctorEmail, reason
        );

        // TODO: Enviar email con el motivo cuando implementes emails
        // await _emailService.SendRejectionEmail(doctorEmail, doctorName, reason);

        return resultDto;
    }

    // ══════════════════════════════════════════════════════════════
    // SOFT DELETE — Baja lógica RGPD
    // ══════════════════════════════════════════════════════════════

    /// <summary>
    /// Baja lógica del profesional. Los datos se conservan por obligación legal.
    /// Las citas futuras pendientes se cancelan automáticamente.
    /// </summary>
    public async Task SoftDeleteAsync(int doctorId, int adminUserId, string reason)
    {
        var doctor = await GetDoctorOrThrowAsync(doctorId);

        if (doctor.DeletedAt != null)
            throw new InvalidOperationException("Este profesional ya fue eliminado.");

        var adminId = await GetAdminIdAsync(adminUserId);

        // Marcar como eliminado — NUNCA hacer DELETE físico en la BD
        doctor.Status = DoctorStatus.Deleted;
        doctor.DeletedAt = DateTime.UtcNow;
        doctor.DeletedReason = reason;
        doctor.DeletedByAdminId = adminId;
        doctor.UpdatedAt = DateTime.UtcNow;
        doctor.IsAcceptingPatients = false;
        doctor.User.IsActive = false;

        // Cancelar citas futuras pendientes o confirmadas
        var citasFuturas = await _db.Appointments
            .Where(a => a.DoctorId == doctorId
                     && a.AppointmentDate > DateTime.UtcNow
                     && (a.Status == "Pendiente" || a.Status == "Confirmada"))
            .ToListAsync();

        foreach (var cita in citasFuturas)
        {
            cita.Status = "Cancelada";
            cita.CancellationReason = $"Profesional dado de baja. Motivo: {reason}";
        }

        await _db.SaveChangesAsync();

        _logger.LogWarning(
            "Admin {AdminUser} eliminó (soft) al profesional {DoctorId} ({Name}). " +
            "Citas canceladas: {Count}. Motivo: {Reason}",
            adminUserId, doctorId, doctor.FullName, citasFuturas.Count, reason);

        // TODO: Notificar a los pacientes con citas canceladas
        // TODO: Enviar email al profesional informando de la baja
    }

    // ══════════════════════════════════════════════════════════════
    // HELPERS PRIVADOS
    // ══════════════════════════════════════════════════════════════

    private async Task<Doctor> GetDoctorOrThrowAsync(int doctorId)
    {
        var doctor = await _db.Doctors
            .Include(d => d.User)
            .Include(d => d.Specialties)
            .FirstOrDefaultAsync(d => d.Id == doctorId);

        return doctor ?? throw new KeyNotFoundException($"Profesional {doctorId} no encontrado.");
    }

    private async Task<int> GetAdminIdAsync(int userId)
    {
        var admin = await _db.Admins.FirstOrDefaultAsync(a => a.UserId == userId);
        return admin?.Id ?? 0;
    }

    private static DoctorAdminDto ToAdminDto(Doctor d) => new()
    {
        Id = d.Id,
        FullName = d.FullName,
        Email = d.User.Email,
        ProfessionalLicense = d.ProfessionalLicense,
        Description = d.Description,
        PhoneNumber = d.PhoneNumber,
        ProfilePictureUrl = d.ProfilePictureUrl,
        YearsOfExperience = d.YearsOfExperience,
        PricePerSession = d.PricePerSession,
        Status = d.Status.ToString(),
        RegisteredAt = d.CreatedAt,
        Specialties = d.Specialties.Select(s => s.Name).ToList(),

        // Imágenes
        ProfessionalLicenseFrontImageUrl = d.ProfessionalLicenseFrontImageUrl,
        ProfessionalLicenseBackImageUrl = d.ProfessionalLicenseBackImageUrl,
        IdDocumentFrontImageUrl = d.IdDocumentFrontImageUrl,
        IdDocumentBackImageUrl = d.IdDocumentBackImageUrl,
        SpecialtyDegreeImageUrl = d.SpecialtyDegreeImageUrl,
        UniversityDegreeImageUrl = d.UniversityDegreeImageUrl,

        // Datos admin
        ReviewedAt = d.ReviewedAt,
        DeletedAt = d.DeletedAt,
        DeletedReason = d.DeletedReason,
        AverageRating = d.AverageRating,
        TotalReviews = d.TotalReviews,
        TotalEarnings = d.TotalEarnings
    };
}