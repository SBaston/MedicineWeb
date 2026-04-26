// ═══════════════════════════════════════════════════════════════
// Models/PlatformSetting.cs
// Configuración global de la plataforma (clave/valor en BD)
// ═══════════════════════════════════════════════════════════════

using System.ComponentModel.DataAnnotations;

namespace MedicineBackend.Models;

/// <summary>
/// Configuración global de la plataforma almacenada en base de datos.
/// Permite modificar parámetros como el IVA sin redeploy.
/// </summary>
public class PlatformSetting
{
    [Key]
    [MaxLength(100)]
    public string Key { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Value { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Description { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Claves conocidas de configuración de la plataforma.
/// </summary>
public static class SettingKeys
{
    /// <summary>Tasa de IVA general (decimal, ej: 0.21)</summary>
    public const string IvaRate = "IvaRate";

    /// <summary>Porcentaje de comisión de la plataforma (decimal, ej: 15)</summary>
    public const string PlatformCommission = "PlatformCommissionPercentage";

    /// <summary>Nombre del emisor de facturas</summary>
    public const string IssuerName = "IssuerName";

    /// <summary>NIF del emisor de facturas</summary>
    public const string IssuerNif = "IssuerNif";

    /// <summary>Dirección del emisor de facturas</summary>
    public const string IssuerAddress = "IssuerAddress";
}
