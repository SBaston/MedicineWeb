using MedicineBackend.Data;
using MedicineBackend.DTOs.Admin;
using MedicineBackend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MedicineBackend.Services;

/// <summary>
/// Implementación del servicio de administración de admins.
/// </summary>
public class AdminService : IAdminService
{
    private readonly AppDbContext _db;
    private readonly ILogger<AdminService> _logger;

    public AdminService(AppDbContext db, ILogger<AdminService> logger)
    {
        _db = db;
        _logger = logger;
    }

    // ══════════════════════════════════════════════════════════════
    // CREAR ADMIN — solo SuperAdmin puede hacer esto
    // ══════════════════════════════════════════════════════════════

    public async Task<AdminDto> CreateAdminAsync(int requestingUserId, CreateAdminRequest request)
    {
        // Verificar que quien hace la petición es el SuperAdmin
        await AssertIsSuperAdminAsync(requestingUserId);

        // Verificar que el email no existe ya
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            throw new InvalidOperationException("Ya existe un usuario con ese email.");

        // Crear la cuenta de usuario
        var user = new User
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "Admin",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        // Crear el admin vinculado — IsSuperAdmin siempre false
        // No se puede crear otro SuperAdmin desde el panel
        var admin = new Admin
        {
            UserId = user.Id,
            FullName = request.FullName,
            IsSuperAdmin = false,
            Department = request.Department,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Admins.Add(admin);
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "SuperAdmin (userId={SuperId}) creó el admin {AdminId} ({Email})",
            requestingUserId, admin.Id, request.Email);

        return ToDto(admin);
    }

    // ══════════════════════════════════════════════════════════════
    // DESACTIVAR ADMIN — solo SuperAdmin
    // ══════════════════════════════════════════════════════════════

    public async Task DeactivateAdminAsync(int requestingUserId, int targetAdminId)
    {
        await AssertIsSuperAdminAsync(requestingUserId);

        var admin = await _db.Admins
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == targetAdminId)
            ?? throw new KeyNotFoundException("Admin no encontrado.");

        // No se puede desactivar al SuperAdmin
        if (admin.IsSuperAdmin)
            throw new InvalidOperationException("No se puede desactivar al SuperAdmin.");

        admin.User.IsActive = false;
        admin.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogWarning(
            "SuperAdmin (userId={SuperId}) desactivó al admin {AdminId} ({Name})",
            requestingUserId, targetAdminId, admin.FullName);
    }

    public async Task ReactivateAdminAsync(int requestingUserId, int targetAdminId)
    {
        await AssertIsSuperAdminAsync(requestingUserId);

        var admin = await _db.Admins
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == targetAdminId)
            ?? throw new KeyNotFoundException("Admin no encontrado.");

        if (admin.IsSuperAdmin)
            throw new InvalidOperationException("No se puede modificar al SuperAdmin.");

        admin.User.IsActive = true;
        admin.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "SuperAdmin (userId={SuperId}) reactivó al admin {AdminId} ({Name})",
            requestingUserId, targetAdminId, admin.FullName);
    }


    // ══════════════════════════════════════════════════════════════
    // LISTAR TODOS LOS ADMINS
    // ══════════════════════════════════════════════════════════════

    public async Task<List<AdminDto>> GetAllAdminsAsync() =>
        await _db.Admins
            .Include(a => a.User)
            .OrderByDescending(a => a.IsSuperAdmin)  // SuperAdmin primero
            .ThenBy(a => a.CreatedAt)
            .Select(a => ToDto(a))
            .ToListAsync();

    // ══════════════════════════════════════════════════════════════
    // VERIFICAR SI UN USERID ES SUPERADMIN
    // ══════════════════════════════════════════════════════════════

    public async Task<bool> IsSuperAdminAsync(int userId) =>
        await _db.Admins.AnyAsync(a => a.UserId == userId && a.IsSuperAdmin);

    // ══════════════════════════════════════════════════════════════
    // DATOS DEL ADMIN LOGUEADO (para el endpoint /me)
    // ══════════════════════════════════════════════════════════════

    public async Task<AdminMeResponse?> GetMeAsync(int userId)
    {
        var admin = await _db.Admins
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.UserId == userId);

        if (admin == null) return null;

        return new AdminMeResponse
        {
            Id = admin.Id,
            FullName = admin.FullName,
            Email = admin.User.Email,
            IsSuperAdmin = admin.IsSuperAdmin,
            Department = admin.Department,
        };
    }

    // ══════════════════════════════════════════════════════════════
    // ESTADÍSTICAS DEL DASHBOARD
    // ══════════════════════════════════════════════════════════════

    public async Task<AdminDashboardStatsDto> GetDashboardStatsAsync() => new()
    {
        PendingReview = await _db.Doctors.CountAsync(d => d.Status == DoctorStatus.PendingReview && d.DeletedAt == null),
        ActiveProfessionals = await _db.Doctors.CountAsync(d => d.Status == DoctorStatus.Active && d.DeletedAt == null),
        RejectedProfessionals = await _db.Doctors.CountAsync(d => d.Status == DoctorStatus.Rejected && d.DeletedAt == null),
        TotalPatients = await _db.Patients.CountAsync(),
        TotalAppointments = await _db.Appointments.CountAsync(),
        TotalAdmins = await _db.Admins.CountAsync(a => a.User.IsActive),
    };

    // ══════════════════════════════════════════════════════════════
    // HELPERS PRIVADOS
    // ══════════════════════════════════════════════════════════════

    private async Task AssertIsSuperAdminAsync(int userId)
    {
        if (!await IsSuperAdminAsync(userId))
            throw new UnauthorizedAccessException("Solo el SuperAdmin puede realizar esta acción.");
    }

    private static AdminDto ToDto(Admin a) => new()
    {
        Id = a.Id,
        FullName = a.FullName,
        Email = a.User.Email,
        IsActive = a.User.IsActive,
        IsSuperAdmin = a.IsSuperAdmin,
        Department = a.Department,
        CreatedAt = a.CreatedAt,
    };
}