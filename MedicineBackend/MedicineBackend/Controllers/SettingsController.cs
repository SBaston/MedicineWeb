// ═══════════════════════════════════════════════════════════════
// Controllers/SettingsController.cs
// Configuración de la plataforma (IVA, comisión, etc.)
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.Models;
using MedicineBackend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedicineBackend.Controllers;

[ApiController]
[Route("api/settings")]
public class SettingsController : ControllerBase
{
    private readonly ISettingsService _settings;

    public SettingsController(ISettingsService settings)
    {
        _settings = settings;
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/settings/tax-rate  — público (el frontend lo necesita para mostrar precios)
    // ─────────────────────────────────────────────────────────────
    [HttpGet("tax-rate")]
    [AllowAnonymous]
    public async Task<IActionResult> GetTaxRate()
    {
        var rate = await _settings.GetIvaRateAsync();
        return Ok(new { ivaRate = rate, ivaPercent = rate * 100 });
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/settings/commission  — público (se usa en UI de precios y páginas de pago)
    // ─────────────────────────────────────────────────────────────
    [HttpGet("commission")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCommission()
    {
        var rate = await _settings.GetCommissionRateAsync();
        return Ok(new { commissionRate = rate });
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/settings  — solo Admin
    // ─────────────────────────────────────────────────────────────
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        var all = await _settings.GetAllAsync();
        return Ok(all.Select(s => new
        {
            key         = s.Key,
            value       = s.Value,
            description = s.Description,
            updatedAt   = s.UpdatedAt
        }));
    }

    // ─────────────────────────────────────────────────────────────
    // PUT /api/settings/{key}  — solo Admin
    // ─────────────────────────────────────────────────────────────
    [HttpPut("{key}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(string key, [FromBody] UpdateSettingDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Value))
            return BadRequest(new { message = "El valor no puede estar vacío" });

        // Validar que IvaRate sea un decimal válido entre 0 y 1
        if (key == SettingKeys.IvaRate)
        {
            if (!decimal.TryParse(dto.Value, System.Globalization.NumberStyles.Any,
                    System.Globalization.CultureInfo.InvariantCulture, out var rate)
                || rate < 0 || rate > 1)
                return BadRequest(new { message = "IvaRate debe ser un decimal entre 0 y 1 (ej: 0.21 para 21%)" });
        }

        await _settings.SetAsync(key, dto.Value, dto.Description);
        return Ok(new { message = $"Configuración '{key}' actualizada correctamente" });
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/settings/seed  — solo Admin, para inicializar valores por defecto
    // ─────────────────────────────────────────────────────────────
    [HttpPost("seed")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Seed()
    {
        var defaults = new[]
        {
            (SettingKeys.IvaRate,           "0.21",        "Tipo general de IVA en España (art. 90 LIVA)"),
            (SettingKeys.PlatformCommission,"15",           "Comisión de la plataforma sobre el precio neto (%)"),
            (SettingKeys.IssuerName,        "NexusSalud S.L.", "Nombre del emisor de facturas"),
            (SettingKeys.IssuerNif,         "B00000000",   "NIF del emisor de facturas"),
            (SettingKeys.IssuerAddress,     "Calle Ejemplo 1, 28001 Madrid, España", "Dirección fiscal del emisor"),
        };

        foreach (var (k, v, desc) in defaults)
        {
            var existing = await _settings.GetAsync(k);
            if (existing == null)
                await _settings.SetAsync(k, v, desc);
        }

        return Ok(new { message = "Valores por defecto inicializados" });
    }
}

public class UpdateSettingDto
{
    public string Value { get; set; } = string.Empty;
    public string? Description { get; set; }
}
