// ═══════════════════════════════════════════════════════════════
// Services/Interfaces/ISettingsService.cs
// ═══════════════════════════════════════════════════════════════

namespace MedicineBackend.Services.Interfaces;

public interface ISettingsService
{
    /// <summary>Obtiene la tasa de IVA actual (ej: 0.21).</summary>
    Task<decimal> GetIvaRateAsync();

    /// <summary>Obtiene la comisión de la plataforma en porcentaje (ej: 15 para un 15%).</summary>
    Task<decimal> GetCommissionRateAsync();

    /// <summary>Obtiene el valor de una clave de configuración.</summary>
    Task<string?> GetAsync(string key);

    /// <summary>Establece el valor de una clave de configuración.</summary>
    Task SetAsync(string key, string value, string? description = null);

    /// <summary>Obtiene todas las configuraciones de la plataforma.</summary>
    Task<IEnumerable<(string Key, string Value, string? Description, DateTime UpdatedAt)>> GetAllAsync();
}
