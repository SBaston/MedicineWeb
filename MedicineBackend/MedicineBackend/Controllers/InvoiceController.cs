// ═══════════════════════════════════════════════════════════════
// Controllers/InvoiceController.cs
// Gestión de facturas — listado, detalle y exportación CSV
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedicineBackend.Controllers;

[ApiController]
[Route("api/invoices")]
[Authorize(Roles = "Admin")]
public class InvoiceController : ControllerBase
{
    private readonly IInvoiceService _invoices;

    public InvoiceController(IInvoiceService invoices)
    {
        _invoices = invoices;
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/invoices?year=2026&operationType=Cita&page=1&pageSize=50
    // ─────────────────────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetInvoices(
        [FromQuery] int? year,
        [FromQuery] string? operationType,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var invoices = await _invoices.GetInvoicesAsync(year, operationType, page, pageSize);
        return Ok(invoices.Select(i => new
        {
            id              = i.Id,
            invoiceNumber   = i.InvoiceNumber,
            issuedAt        = i.IssuedAt,
            recipientName   = i.RecipientName,
            recipientEmail  = i.RecipientEmail,
            description     = i.Description,
            operationType   = i.OperationType,
            baseImponible   = i.BaseImponible,
            ivaRate         = i.IvaRate,
            cuotaIva        = i.CuotaIva,
            total           = i.Total,
            currency        = i.Currency,
            invoiceType     = i.InvoiceType,
            status          = i.Status,
            emailSent       = i.EmailSent,
            emailSentAt     = i.EmailSentAt
        }));
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/invoices/export?year=2026
    // Exporta el libro de facturas emitidas como CSV (Modelo 303 / SII)
    // ─────────────────────────────────────────────────────────────
    [HttpGet("export")]
    public async Task<IActionResult> Export([FromQuery] int? year)
    {
        var csv      = await _invoices.ExportCsvAsync(year);
        var filename = year.HasValue
            ? $"facturas_{year}.csv"
            : "facturas_todas.csv";

        return File(csv, "text/csv; charset=utf-8", filename);
    }
}
