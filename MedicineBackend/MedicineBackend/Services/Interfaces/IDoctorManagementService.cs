using MedicineBackend.DTOs.Admin;

namespace MedicineBackend.Services;

/// <summary>
/// Interfaz para el servicio de gestión de profesionales (doctores).
/// Define las operaciones que los admins pueden realizar sobre los profesionales.
/// </summary>
public interface IDoctorManagementService
{
    /// <summary>
    /// Obtiene la lista de profesionales pendientes de revisión.
    /// Solo incluye profesionales con estado PendingReview que no han sido eliminados.
    /// </summary>
    Task<List<PendingDoctorDto>> GetPendingAsync();

    /// <summary>
    /// Obtiene todos los profesionales del sistema con filtro opcional por estado.
    /// </summary>
    /// <param name="status">
    /// Filtro de estado: "pending", "active", "rejected", "deleted", o null para todos (excepto eliminados)
    /// </param>
    Task<List<DoctorAdminDto>> GetAllAsync(string? status);

    /// <summary>
    /// Aprueba a un profesional y le da acceso a la plataforma.
    /// Cambia su estado a Active y activa su cuenta de usuario.
    /// </summary>
    /// <param name="doctorId">ID del profesional a aprobar</param>
    /// <param name="adminUserId">ID del usuario admin que realiza la acción</param>
    /// <exception cref="KeyNotFoundException">Si el profesional no existe</exception>
    /// <exception cref="InvalidOperationException">Si el profesional ya está activo</exception>
    Task<DoctorAdminDto> ApproveAsync(int doctorId, int adminUserId);

    /// <summary>
    /// Rechaza la solicitud de un profesional.
    /// ✅ ACTUALIZADO: Elimina User y Doctor de la base de datos para liberar el email.
    /// El motivo se guarda para envío futuro por email.
    /// </summary>
    /// <param name="doctorId">ID del profesional a rechazar</param>
    /// <param name="adminUserId">ID del usuario admin que realiza la acción</param>
    /// <param name="reason">Motivo del rechazo (mínimo 10 caracteres)</param>
    /// <exception cref="KeyNotFoundException">Si el profesional no existe</exception>
    Task<DoctorAdminDto> RejectAsync(int doctorId, int adminUserId, string reason);

    /// <summary>
    /// Realiza una baja lógica (soft delete) del profesional.
    /// Los datos se conservan por obligación legal (RGPD).
    /// Las citas futuras pendientes/confirmadas se cancelan automáticamente.
    /// </summary>
    /// <param name="doctorId">ID del profesional a eliminar</param>
    /// <param name="adminUserId">ID del usuario admin que realiza la acción</param>
    /// <param name="reason">Motivo de la eliminación (mínimo 10 caracteres)</param>
    /// <exception cref="KeyNotFoundException">Si el profesional no existe</exception>
    /// <exception cref="InvalidOperationException">Si el profesional ya fue eliminado</exception>
    Task SoftDeleteAsync(int doctorId, int adminUserId, string reason);
}