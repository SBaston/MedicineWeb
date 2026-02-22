using MedicineBackend.Services.Interfaces;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace MedicineBackend.Services;

/// <summary>
/// Servicio de caché usando Redis
/// </summary>
public class CacheService : ICacheService
{
    private readonly IDistributedCache _cache;
    private readonly ILogger<CacheService> _logger;
    private readonly TimeSpan _defaultExpiration;

    public CacheService(
        IDistributedCache cache,
        ILogger<CacheService> logger,
        IConfiguration configuration)
    {
        _cache = cache;
        _logger = logger;

        // Leer tiempo de expiración por defecto desde configuración
        var expirationMinutes = configuration.GetValue<int>("CacheSettings:DefaultExpirationMinutes", 30);
        _defaultExpiration = TimeSpan.FromMinutes(expirationMinutes);
    }

    /// <summary>
    /// Obtiene un valor del caché y lo deserializa
    /// </summary>
    public async Task<T?> GetAsync<T>(string key)
    {
        try
        {
            var cachedData = await _cache.GetStringAsync(key);

            if (string.IsNullOrEmpty(cachedData))
            {
                _logger.LogDebug("Cache MISS for key: {Key}", key);
                return default;
            }

            _logger.LogDebug("Cache HIT for key: {Key}", key);
            return JsonSerializer.Deserialize<T>(cachedData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener del caché la clave: {Key}", key);
            return default;
        }
    }

    /// <summary>
    /// Guarda un valor en el caché serializándolo a JSON
    /// </summary>
    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null)
    {
        try
        {
            var serializedData = JsonSerializer.Serialize(value);

            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = expiration ?? _defaultExpiration
            };

            await _cache.SetStringAsync(key, serializedData, options);

            _logger.LogDebug("Cached data for key: {Key} with expiration: {Expiration}",
                key, expiration ?? _defaultExpiration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al guardar en caché la clave: {Key}", key);
        }
    }

    /// <summary>
    /// Elimina una clave del caché
    /// </summary>
    public async Task RemoveAsync(string key)
    {
        try
        {
            await _cache.RemoveAsync(key);
            _logger.LogDebug("Removed cache key: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al eliminar del caché la clave: {Key}", key);
        }
    }

    /// <summary>
    /// Verifica si una clave existe en el caché
    /// </summary>
    public async Task<bool> ExistsAsync(string key)
    {
        try
        {
            var data = await _cache.GetStringAsync(key);
            return !string.IsNullOrEmpty(data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al verificar existencia de clave en caché: {Key}", key);
            return false;
        }
    }

    /// <summary>
    /// Elimina todas las claves que coincidan con un patrón
    /// NOTA: Esta operación requiere acceso directo a Redis y puede ser costosa
    /// </summary>
    public async Task RemoveByPatternAsync(string pattern)
    {
        try
        {
            // Esta funcionalidad requiere StackExchange.Redis directamente
            // Por ahora, registramos que se intentó
            _logger.LogWarning("RemoveByPattern no implementado completamente. Pattern: {Pattern}", pattern);
            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al eliminar por patrón: {Pattern}", pattern);
        }
    }
}