// ═══════════════════════════════════════════════════════════════
// Migration: AddPlatformSettingsAndInvoices
// Agrega PlatformSettings (IVA configurable) e Invoices (RD 1619/2012)
// ═══════════════════════════════════════════════════════════════

using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MedicineBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddPlatformSettingsAndInvoices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── PlatformSettings ──────────────────────────────────
            migrationBuilder.CreateTable(
                name: "PlatformSettings",
                columns: table => new
                {
                    Key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Value = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Description = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformSettings", x => x.Key);
                });

            // ── Invoices ──────────────────────────────────────────
            migrationBuilder.CreateTable(
                name: "Invoices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    InvoiceNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    SeriesYear = table.Column<int>(type: "integer", nullable: false),
                    SeriesSequence = table.Column<int>(type: "integer", nullable: false),
                    IssuedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    PaymentId = table.Column<int>(type: "integer", nullable: true),
                    ChatSubscriptionId = table.Column<int>(type: "integer", nullable: true),
                    IssuerName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    IssuerNif = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IssuerAddress = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    RecipientName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    RecipientNif = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    RecipientAddress = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    RecipientEmail = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    OperationType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    BaseImponible = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    IvaRate = table.Column<decimal>(type: "decimal(5,4)", nullable: false),
                    CuotaIva = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Total = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false, defaultValue: "EUR"),
                    InvoiceType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Simplificada"),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Emitida"),
                    EmailSent = table.Column<bool>(type: "boolean", nullable: false),
                    EmailSentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Invoices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Invoices_Payments_PaymentId",
                        column: x => x.PaymentId,
                        principalTable: "Payments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Invoices_ChatSubscriptions_ChatSubscriptionId",
                        column: x => x.ChatSubscriptionId,
                        principalTable: "ChatSubscriptions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            // ── Índices de Invoices ───────────────────────────────
            migrationBuilder.CreateIndex(
                name: "IX_Invoices_InvoiceNumber",
                table: "Invoices",
                column: "InvoiceNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_SeriesYear_SeriesSequence",
                table: "Invoices",
                columns: new[] { "SeriesYear", "SeriesSequence" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_IssuedAt",
                table: "Invoices",
                column: "IssuedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_RecipientEmail",
                table: "Invoices",
                column: "RecipientEmail");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_PaymentId",
                table: "Invoices",
                column: "PaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_ChatSubscriptionId",
                table: "Invoices",
                column: "ChatSubscriptionId");

            // ── Seed: valores IVA por defecto ─────────────────────
            migrationBuilder.InsertData(
                table: "PlatformSettings",
                columns: new[] { "Key", "Value", "Description", "UpdatedAt" },
                values: new object[,]
                {
                    { "IvaRate",                     "0.21",                                    "Tipo general de IVA en España (art. 90 LIVA)",   DateTime.UtcNow },
                    { "PlatformCommissionPercentage", "15",                                      "Comisión de la plataforma sobre el precio neto (%)", DateTime.UtcNow },
                    { "IssuerName",                  "NexusSalud S.L.",                         "Nombre del emisor de facturas",                  DateTime.UtcNow },
                    { "IssuerNif",                   "B00000000",                               "NIF del emisor de facturas",                     DateTime.UtcNow },
                    { "IssuerAddress",               "Calle Ejemplo 1, 28001 Madrid, España",   "Dirección fiscal del emisor",                    DateTime.UtcNow },
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "Invoices");
            migrationBuilder.DropTable(name: "PlatformSettings");
        }
    }
}
