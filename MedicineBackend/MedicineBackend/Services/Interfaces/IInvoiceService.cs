// ═══════════════════════════════════════════════════════════════
// Services/Interfaces/IInvoiceService.cs
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.Models;

namespace MedicineBackend.Services.Interfaces;

public interface IInvoiceService
{
    /// <summary>
    /// Genera y persiste una factura para un pago completado.
    /// Envía el email al receptor de forma asíncrona.
    /// </summary>
    Task<Invoice> GenerateForPaymentAsync(int paymentId);

    /// <summary>
    /// Genera y persiste una factura para una suscripción de chat activada.
    /// Envía el email al receptor de forma asíncrona.
    /// </summary>
    Task<Invoice> GenerateForChatSubscriptionAsync(int chatSubscriptionId);

    /// <summary>
    /// Obtiene el listado de facturas con filtros opcionales.
    /// </summary>
    Task<IEnumerable<Invoice>> GetInvoicesAsync(
        int? year = null, string? operationType = null,
        int page = 1, int pageSize = 50);

    /// <summary>
    /// Exporta el libro de facturas emitidas como CSV
    /// compatible con los requisitos del Modelo 303 (AEAT).
    /// </summary>
    Task<byte[]> ExportCsvAsync(int? year = null);
}
