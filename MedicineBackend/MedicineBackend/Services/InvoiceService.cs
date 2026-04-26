// ═══════════════════════════════════════════════════════════════
// Services/InvoiceService.cs
// Generación de facturas conforme a RD 1619/2012
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.Data;
using MedicineBackend.Models;
using MedicineBackend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Data;
using System.Text;

namespace MedicineBackend.Services;

public class InvoiceService : IInvoiceService
{
    private readonly AppDbContext _context;
    private readonly ISettingsService _settings;
    private readonly IEmailService _email;
    private readonly IConfiguration _config;
    private readonly ILogger<InvoiceService> _logger;

    // Datos del emisor leídos de configuración (appsettings.json)
    private readonly string _issuerName;
    private readonly string _issuerNif;
    private readonly string _issuerAddress;

    public InvoiceService(
        AppDbContext context,
        ISettingsService settings,
        IEmailService email,
        IConfiguration config,
        ILogger<InvoiceService> logger)
    {
        _context  = context;
        _settings = settings;
        _email    = email;
        _config   = config;
        _logger   = logger;

        _issuerName    = config["Invoice:IssuerName"]    ?? "NexusSalud S.L.";
        _issuerNif     = config["Invoice:IssuerNif"]     ?? "B00000000";
        _issuerAddress = config["Invoice:IssuerAddress"] ?? "Calle Ejemplo 1, 28001 Madrid";
    }

    // ─────────────────────────────────────────────────────────────
    // Generar factura para un Payment (cita o curso)
    // ─────────────────────────────────────────────────────────────
    public async Task<Invoice> GenerateForPaymentAsync(int paymentId)
    {
        var payment = await _context.Payments
            .Include(p => p.Patient).ThenInclude(p => p.User)
            .Include(p => p.Doctor)
            .Include(p => p.Appointment)
            .Include(p => p.Course)
            .FirstOrDefaultAsync(p => p.Id == paymentId)
            ?? throw new KeyNotFoundException($"Payment {paymentId} no encontrado");

        // ¿Ya tiene factura?
        var existing = await _context.Invoices.FirstOrDefaultAsync(i => i.PaymentId == paymentId);
        if (existing != null) return existing;

        var ivaRate = await _settings.GetIvaRateAsync();

        // El total cobrado ya incluye IVA (si aplica); base imponible = total / (1 + iva)
        // Para citas: siempre con IVA (paciente paga)
        // Para cursos: ya calculado en PaymentService (Amount = priceFinal con o sin IVA)
        var total    = payment.Amount;
        decimal baseImponible, cuotaIva, effectiveIva;

        if (payment.PaymentType == "Cita")
        {
            // Citas siempre llevan IVA al tipo general
            effectiveIva  = ivaRate;
            baseImponible = Math.Round(total / (1 + ivaRate), 2);
            cuotaIva      = total - baseImponible;
        }
        else
        {
            // Curso: si DoctorId != 0 y PatientId == 0 → médico → exento
            bool isPatient = payment.PatientId != 0;
            effectiveIva  = isPatient ? ivaRate : 0m;
            baseImponible = effectiveIva > 0
                ? Math.Round(total / (1 + effectiveIva), 2)
                : total;
            cuotaIva      = total - baseImponible;
        }

        // Payment.Patient es la entidad Patient (tiene FirstName/LastName)
        // Payment.Patient.User es la entidad User (tiene Email)
        var patient = payment.Patient;
        var recipientName = patient != null
            ? $"{patient.FirstName} {patient.LastName}".Trim()
            : payment.Doctor != null
                ? $"Dr. {payment.Doctor.FirstName} {payment.Doctor.LastName}"
                : "Cliente";

        var recipientEmail = patient?.User?.Email ?? payment.Doctor?.User?.Email ?? string.Empty;

        var description = payment.PaymentType == "Cita"
            ? $"Consulta médica — {payment.Doctor?.FirstName} {payment.Doctor?.LastName} — {payment.Appointment?.AppointmentDate:dd/MM/yyyy HH:mm}"
            : $"Matrícula en curso: {payment.Course?.Title}";

        var invoice = await CreateInvoiceAsync(new Invoice
        {
            PaymentId       = paymentId,
            IssuerName      = _issuerName,
            IssuerNif       = _issuerNif,
            IssuerAddress   = _issuerAddress,
            RecipientName   = recipientName,
            RecipientEmail  = recipientEmail,
            Description     = description,
            OperationType   = payment.PaymentType,
            BaseImponible   = baseImponible,
            IvaRate         = effectiveIva,
            CuotaIva        = cuotaIva,
            Total           = total,
            Currency        = payment.Currency,
            InvoiceType     = total >= 400 ? "Ordinaria" : "Simplificada",
        });

        _ = SendInvoiceEmailAsync(invoice, recipientEmail);
        return invoice;
    }

    // ─────────────────────────────────────────────────────────────
    // Generar factura para una ChatSubscription
    // ─────────────────────────────────────────────────────────────
    public async Task<Invoice> GenerateForChatSubscriptionAsync(int chatSubscriptionId)
    {
        var sub = await _context.ChatSubscriptions
            .Include(s => s.Plan)
            .Include(s => s.Doctor)
            .Include(s => s.Patient)   // Patient IS a User entity (has Email)
            .FirstOrDefaultAsync(s => s.Id == chatSubscriptionId)
            ?? throw new KeyNotFoundException($"ChatSubscription {chatSubscriptionId} no encontrada");

        var existing = await _context.Invoices.FirstOrDefaultAsync(i => i.ChatSubscriptionId == chatSubscriptionId);
        if (existing != null) return existing;

        var ivaRate = await _settings.GetIvaRateAsync();
        var total   = sub.AmountPaid;
        // Chat premium: siempre lo paga un paciente → IVA siempre aplica
        var baseImponible = Math.Round(total / (1 + ivaRate), 2);
        var cuotaIva      = total - baseImponible;

        // ChatSubscription.Patient es la entidad User (solo tiene Email, no FirstName/LastName)
        // Para obtener el nombre buscamos el Patient cuyo UserId coincide
        var patientEntity  = await _context.Patients
            .FirstOrDefaultAsync(p => p.UserId == sub.PatientUserId);
        var recipientName  = patientEntity != null
            ? $"{patientEntity.FirstName} {patientEntity.LastName}".Trim()
            : sub.Patient?.Email ?? "Paciente";
        var recipientEmail = sub.Patient?.Email ?? string.Empty;

        var invoice = await CreateInvoiceAsync(new Invoice
        {
            ChatSubscriptionId = chatSubscriptionId,
            IssuerName         = _issuerName,
            IssuerNif          = _issuerNif,
            IssuerAddress      = _issuerAddress,
            RecipientName      = recipientName,
            RecipientEmail     = recipientEmail,
            Description        = $"Suscripción chat premium con Dr. {sub.Doctor?.FirstName} {sub.Doctor?.LastName} — {sub.Plan?.Name}",
            OperationType      = "ChatPremium",
            BaseImponible      = baseImponible,
            IvaRate            = ivaRate,
            CuotaIva           = cuotaIva,
            Total              = total,
            Currency           = "EUR",
            InvoiceType        = total >= 400 ? "Ordinaria" : "Simplificada",
        });

        _ = SendInvoiceEmailAsync(invoice, recipientEmail);
        return invoice;
    }

    // ─────────────────────────────────────────────────────────────
    // Crear la factura con número correlativo (Serializable)
    // ─────────────────────────────────────────────────────────────
    private async Task<Invoice> CreateInvoiceAsync(Invoice draft)
    {
        await using var tx = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            var year = DateTime.UtcNow.Year;
            var lastSeq = await _context.Invoices
                .Where(i => i.SeriesYear == year)
                .MaxAsync(i => (int?)i.SeriesSequence) ?? 0;

            var seq = lastSeq + 1;
            draft.SeriesYear     = year;
            draft.SeriesSequence = seq;
            draft.InvoiceNumber  = $"F-{year}-{seq:D4}";
            draft.IssuedAt       = DateTime.UtcNow;

            _context.Invoices.Add(draft);
            await _context.SaveChangesAsync();
            await tx.CommitAsync();

            _logger.LogInformation("Factura {Number} generada correctamente", draft.InvoiceNumber);
            return draft;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Enviar email con la factura
    // ─────────────────────────────────────────────────────────────
    private async Task SendInvoiceEmailAsync(Invoice invoice, string toEmail)
    {
        if (string.IsNullOrWhiteSpace(toEmail)) return;
        try
        {
            await _email.SendInvoiceEmailAsync(invoice, toEmail);
            invoice.EmailSent  = true;
            invoice.EmailSentAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al enviar email de factura {Number}", invoice.InvoiceNumber);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Listado de facturas con filtros
    // ─────────────────────────────────────────────────────────────
    public async Task<IEnumerable<Invoice>> GetInvoicesAsync(
        int? year = null, string? operationType = null,
        int page = 1, int pageSize = 50)
    {
        var query = _context.Invoices.AsQueryable();
        if (year.HasValue)        query = query.Where(i => i.SeriesYear   == year.Value);
        if (!string.IsNullOrEmpty(operationType))
            query = query.Where(i => i.OperationType == operationType);

        return await query
            .OrderByDescending(i => i.IssuedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    // ─────────────────────────────────────────────────────────────
    // Exportar CSV para Modelo 303 (libro de facturas emitidas)
    // Campos: N.º Factura | Fecha | Receptor | NIF | Descripción | Base Imponible | %IVA | Cuota IVA | Total | Moneda
    // ─────────────────────────────────────────────────────────────
    public async Task<byte[]> ExportCsvAsync(int? year = null)
    {
        var query = _context.Invoices.AsQueryable();
        if (year.HasValue) query = query.Where(i => i.SeriesYear == year.Value);

        var invoices = await query.OrderBy(i => i.SeriesYear).ThenBy(i => i.SeriesSequence).ToListAsync();

        var sb = new StringBuilder();
        // Cabecera (compatible con Modelo 303 / SII)
        sb.AppendLine("Número Factura;Fecha Expedición;Nombre Receptor;NIF Receptor;Descripción;" +
                      "Base Imponible (€);Tipo IVA (%);Cuota IVA (€);Total (€);Moneda;Tipo Operación;Tipo Factura");

        foreach (var inv in invoices)
        {
            var cols = new[]
            {
                inv.InvoiceNumber,
                inv.IssuedAt.ToString("dd/MM/yyyy"),
                Escape(inv.RecipientName),
                inv.RecipientNif ?? "",
                Escape(inv.Description),
                inv.BaseImponible.ToString("F2"),
                (inv.IvaRate * 100).ToString("F2"),
                inv.CuotaIva.ToString("F2"),
                inv.Total.ToString("F2"),
                inv.Currency,
                inv.OperationType,
                inv.InvoiceType
            };
            sb.AppendLine(string.Join(";", cols));
        }

        var bom    = Encoding.UTF8.GetPreamble();
        var body   = Encoding.UTF8.GetBytes(sb.ToString());
        var result = new byte[bom.Length + body.Length];
        Buffer.BlockCopy(bom,  0, result, 0,          bom.Length);
        Buffer.BlockCopy(body, 0, result, bom.Length, body.Length);
        return result;
    }

    private static string Escape(string s) =>
        s.Contains(';') || s.Contains('"') || s.Contains('\n')
            ? $"\"{s.Replace("\"", "\"\"")}\""
            : s;
}
