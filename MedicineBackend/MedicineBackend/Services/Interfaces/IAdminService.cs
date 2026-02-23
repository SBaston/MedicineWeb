using MedicineBackend.DTOs.Admin;

namespace MedicineBackend.Services;

/// <summary>
/// Interfaz para el servicio de administración de admins.
/// Define las operaciones que puede realizar un admin en la plataforma.
/// </summary>
public interface IAdminService
{
    /// <summary>
    /// Crea un nuevo admin en el sistema.
    /// Solo el SuperAdmin puede ejecutar esta operación.
    /// </summary>
    /// <param name="requestingUserId">ID del usuario que hace la petición (debe ser SuperAdmin)</param>
    /// <param name="request">Datos del nuevo admin a crear</param>
    /// <returns>DTO del admin creado</returns>
    /// <exception cref="UnauthorizedAccessException">Si el usuario no es SuperAdmin</exception>
    /// <exception cref="InvalidOperationException">Si el email ya existe</exception>
    Task<AdminDto> CreateAdminAsync(int requestingUserId, CreateAdminRequest request);

    /// <summary>
    /// Desactiva un admin existente.
    /// Solo el SuperAdmin puede ejecutar esta operación.
    /// No se puede desactivar al propio SuperAdmin.
    /// </summary>
    /// <param name="requestingUserId">ID del usuario que hace la petición (debe ser SuperAdmin)</param>
    /// <param name="targetAdminId">ID del admin a desactivar</param>
    /// <exception cref="UnauthorizedAccessException">Si el usuario no es SuperAdmin</exception>
    /// <exception cref="InvalidOperationException">Si intenta desactivar al SuperAdmin</exception>
    /// <exception cref="KeyNotFoundException">Si el admin no existe</exception>
    Task DeactivateAdminAsync(int requestingUserId, int targetAdminId);

    Task ReactivateAdminAsync(int requestingUserId, int targetAdminId);
    /// <summary>
    /// Obtiene la lista de todos los admins del sistema.
    /// Ordenados con el SuperAdmin primero, luego por fecha de creación.
    /// </summary>
    /// <returns>Lista de DTOs de todos los admins</returns>
    Task<List<AdminDto>> GetAllAdminsAsync();

    /// <summary>
    /// Verifica si un usuario es el SuperAdmin.
    /// Útil para validar permisos antes de ejecutar operaciones sensibles.
    /// </summary>
    /// <param name="userId">ID del usuario a verificar</param>
    /// <returns>True si el usuario es SuperAdmin, False en caso contrario</returns>
    Task<bool> IsSuperAdminAsync(int userId);

    /// <summary>
    /// Obtiene los datos del admin autenticado.
    /// Usado por el frontend después del login para cargar la información completa.
    /// </summary>
    /// <param name="userId">ID del usuario autenticado</param>
    /// <returns>DTO con los datos del admin o null si no existe</returns>
    Task<AdminMeResponse?> GetMeAsync(int userId);

    /// <summary>
    /// Obtiene las estadísticas generales para el dashboard del admin.
    /// Incluye contadores de profesionales, pacientes, citas, etc.
    /// </summary>
    /// <returns>DTO con todas las estadísticas</returns>
    Task<AdminDashboardStatsDto> GetDashboardStatsAsync();
}