// ═══════════════════════════════════════════════════════════════
// Services/SettingsService.cs
// Gestión de configuración de la plataforma en BD
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.Data;
using MedicineBackend.Models;
using MedicineBackend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace MedicineBackend.Services;

public class SettingsService : ISettingsService
{
    private readonly AppDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly ILogger<SettingsService> _logger;

    // TTL del caché — 5 minutos; al actualizar un valor se invalida
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);
    private const string CachePrefix = "platform_setting_";

    public SettingsService(AppDbContext context, IMemoryCache cache, ILogger<SettingsService> logger)
    {
        _context = context;
        _cache   = cache;
        _logger  = logger;
    }

    // ─────────────────────────────────────────────────────────────
    public async Task<decimal> GetIvaRateAsync()
    {
        var raw = await GetAsync(SettingKeys.IvaRate);
        if (raw != null && decimal.TryParse(raw, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var rate))
            return rate;

        // Valor por defecto si no existe la clave
        _logger.LogWarning("IvaRate no configurada en BD, usando 0.21 por defecto");
        return 0.21m;
    }

    // ─────────────────────────────────────────────────────────────
    public async Task<decimal> GetCommissionRateAsync()
    {
        var raw = await GetAsync(SettingKeys.PlatformCommission);
        if (raw != null && decimal.TryParse(raw, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var rate))
            return rate;

        _logger.LogWarning("PlatformCommission no configurada en BD, usando 15% por defecto");
        return 15m;
    }

    // ─────────────────────────────────────────────────────────────
    public async Task<string?> GetAsync(string key)
    {
        var cacheKey = CachePrefix + key;
        if (_cache.TryGetValue(cacheKey, out string? cached))
            return cached;

        var setting = await _context.PlatformSettings.FindAsync(key);
        var value   = setting?.Value;

        _cache.Set(cacheKey, value, CacheTtl);
        return value;
    }

    // ─────────────────────────────────────────────────────────────
    public async Task SetAsync(string key, string value, string? description = null)
    {
        var setting = await _context.PlatformSettings.FindAsync(key);
        if (setting == null)
        {
            setting = new PlatformSetting { Key = key, Value = value, Description = description, UpdatedAt = DateTime.UtcNow };
            _context.PlatformSettings.Add(setting);
        }
        else
        {
            setting.Value      = value;
            setting.UpdatedAt  = DateTime.UtcNow;
            if (description != null) setting.Description = description;
        }

        await _context.SaveChangesAsync();

        // Invalidar caché
        _cache.Remove(CachePrefix + key);
        _logger.LogInformation("PlatformSetting actualizada: {Key} = {Value}", key, value);
    }

    // ─────────────────────────────────────────────────────────────
    public async Task<IEnumerable<(string Key, string Value, string? Description, DateTime UpdatedAt)>> GetAllAsync()
    {
        // Npgsql no permite proyectar ValueTuple directamente en la query SQL
        // (lo confunde con el tipo record de PostgreSQL). Se trae la entidad completa
        // y se proyecta en memoria.
        var rows = await _context.PlatformSettings
            .OrderBy(s => s.Key)
            .ToListAsync();

        return rows.Select(s => (s.Key, s.Value, s.Description, s.UpdatedAt));
    }
}
