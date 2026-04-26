// ═══════════════════════════════════════════════════════════════
// Services/InvoicePdfGenerator.cs
// Genera el PDF de una factura conforme a RD 1619/2012
// usando QuestPDF (licencia Community)
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace MedicineBackend.Services;

public static class InvoicePdfGenerator
{
    // ─────────────────────────────────────────────────────────────
    // Llamar una vez al arrancar la app (Program.cs) o el
    // constructor estático garantiza que solo se llama una vez.
    // ─────────────────────────────────────────────────────────────
    static InvoicePdfGenerator()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    /// <summary>
    /// Genera el PDF de la factura y devuelve los bytes.
    /// </summary>
    public static byte[] Generate(Invoice invoice)
    {
        var ivaLabel = invoice.IvaRate > 0
            ? $"IVA {invoice.IvaRate * 100:F0}%"
            : "Exento de IVA";

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.MarginHorizontal(40);
                page.MarginVertical(36);
                page.DefaultTextStyle(x => x
                    .FontFamily("Arial")
                    .FontSize(10)
                    .FontColor("#1f2937"));

                // ── CABECERA ────────────────────────────────────
                page.Header().Column(col =>
                {
                    col.Item().Background("#1d4ed8").Padding(20).Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("NexusSalud")
                                .FontSize(22).Bold().FontColor(Colors.White);
                            c.Item().Text("Tu plataforma de salud de confianza")
                                .FontSize(9).FontColor("#bfdbfe");
                        });

                        row.RelativeItem().AlignRight().Column(c =>
                        {
                            c.Item().Text("FACTURA")
                                .FontSize(20).Bold().FontColor(Colors.White);
                            c.Item().Text(invoice.InvoiceNumber)
                                .FontSize(11).Bold().FontColor("#93c5fd");
                        });
                    });

                    col.Item().Height(2).Background("#1e40af");
                });

                // ── CONTENIDO ───────────────────────────────────
                page.Content().PaddingTop(20).Column(col =>
                {
                    // ── Datos emisor / destinatario ──────────────
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("EMISOR")
                                .FontSize(7).Bold().FontColor("#6b7280")
                                .LetterSpacing(0.1f);
                            c.Item().PaddingTop(4).Text(invoice.IssuerName).Bold();
                            c.Item().Text($"NIF: {invoice.IssuerNif}").FontColor("#374151");
                            c.Item().Text(invoice.IssuerAddress).FontColor("#374151");
                        });

                        row.ConstantItem(24); // separador

                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("DESTINATARIO")
                                .FontSize(7).Bold().FontColor("#6b7280")
                                .LetterSpacing(0.1f);
                            c.Item().PaddingTop(4).Text(invoice.RecipientName).Bold();
                            if (!string.IsNullOrWhiteSpace(invoice.RecipientEmail))
                                c.Item().Text(invoice.RecipientEmail).FontColor("#374151");
                        });
                    });

                    // ── Fecha / tipo de factura ──────────────────
                    col.Item().PaddingTop(16).Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("FECHA DE EMISIÓN")
                                .FontSize(7).Bold().FontColor("#6b7280")
                                .LetterSpacing(0.1f);
                            c.Item().PaddingTop(4)
                                .Text(invoice.IssuedAt.ToString("dd/MM/yyyy")).Bold();
                        });

                        row.ConstantItem(24);

                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("TIPO")
                                .FontSize(7).Bold().FontColor("#6b7280")
                                .LetterSpacing(0.1f);
                            c.Item().PaddingTop(4)
                                .Text(invoice.InvoiceType ?? "Simplificada").Bold();
                        });

                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("OPERACIÓN")
                                .FontSize(7).Bold().FontColor("#6b7280")
                                .LetterSpacing(0.1f);
                            c.Item().PaddingTop(4)
                                .Text(invoice.OperationType ?? "Servicio").Bold();
                        });
                    });

                    col.Item().PaddingTop(20).LineHorizontal(1).LineColor("#e2e8f0");

                    // ── Tabla de concepto ────────────────────────
                    col.Item().PaddingTop(16).Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(4);
                            columns.RelativeColumn(1);
                        });

                        // Cabecera tabla
                        table.Header(header =>
                        {
                            header.Cell()
                                .Background("#1d4ed8").Padding(8)
                                .Text("CONCEPTO").FontColor(Colors.White).Bold().FontSize(9);
                            header.Cell()
                                .Background("#1d4ed8").Padding(8)
                                .AlignRight()
                                .Text("BASE IMPONIBLE").FontColor(Colors.White).Bold().FontSize(9);
                        });

                        // Fila de concepto
                        table.Cell()
                            .BorderBottom(1).BorderColor("#e2e8f0")
                            .Padding(10)
                            .Text(invoice.Description);

                        table.Cell()
                            .BorderBottom(1).BorderColor("#e2e8f0")
                            .Padding(10).AlignRight()
                            .Text($"{invoice.BaseImponible:F2} €").Bold();
                    });

                    // ── Totales (alineados a la derecha) ─────────
                    col.Item().PaddingTop(8).AlignRight().Width(220).Column(c =>
                    {
                        c.Item().Row(r =>
                        {
                            r.RelativeItem().AlignRight()
                                .Text("Base imponible:").FontColor("#6b7280");
                            r.ConstantItem(110).AlignRight()
                                .Text($"{invoice.BaseImponible:F2} €");
                        });

                        c.Item().PaddingTop(4).Row(r =>
                        {
                            r.RelativeItem().AlignRight()
                                .Text($"{ivaLabel}:").FontColor("#6b7280");
                            r.ConstantItem(110).AlignRight()
                                .Text($"{invoice.CuotaIva:F2} €");
                        });

                        c.Item().PaddingTop(6)
                            .BorderTop(2).BorderColor("#1d4ed8")
                            .PaddingTop(6)
                            .Row(r =>
                            {
                                r.RelativeItem().AlignRight()
                                    .Text("TOTAL:").Bold().FontSize(13);
                                r.ConstantItem(110).AlignRight()
                                    .Text($"{invoice.Total:F2} {invoice.Currency}")
                                    .Bold().FontSize(13).FontColor("#1d4ed8");
                            });
                    });

                    // ── Nota legal ───────────────────────────────
                    col.Item().PaddingTop(32)
                        .Background("#f0fdf4")
                        .Border(1).BorderColor("#bbf7d0")
                        .Padding(12)
                        .Column(c =>
                        {
                            c.Item().Text("Información legal")
                                .Bold().FontSize(9).FontColor("#166534");
                            c.Item().PaddingTop(4).Text(
                                "Esta factura ha sido emitida conforme al Real Decreto 1619/2012, " +
                                "de 30 de noviembre, por el que se aprueba el Reglamento por el que " +
                                "se regulan las obligaciones de facturación. Consérvela para sus " +
                                "declaraciones fiscales.")
                                .FontSize(8).FontColor("#166534");
                        });
                });

                // ── PIE ─────────────────────────────────────────
                page.Footer().AlignCenter()
                    .Text($"{invoice.IssuerName} · NIF: {invoice.IssuerNif} · {invoice.IssuerAddress}")
                    .FontSize(7).FontColor("#9ca3af");
            });
        }).GeneratePdf();
    }
}
