using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MedicineBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddClinicalNotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ClinicalNotes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DoctorId              = table.Column<int>(type: "integer", nullable: false),
                    PatientId             = table.Column<int>(type: "integer", nullable: false),
                    Title                 = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Template              = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    TabTranscription      = table.Column<string>(type: "text", nullable: true),
                    TabClinicalHistory    = table.Column<string>(type: "text", nullable: true),
                    TabSummary            = table.Column<string>(type: "text", nullable: true),
                    CreatedAt             = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt             = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClinicalNotes", x => x.Id);
                    table.ForeignKey("FK_ClinicalNotes_Doctors_DoctorId",   x => x.DoctorId,  "Doctors",  "Id", onDelete: ReferentialAction.Cascade);
                    table.ForeignKey("FK_ClinicalNotes_Patients_PatientId", x => x.PatientId, "Patients", "Id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClinicalNoteAttachments",
                columns: table => new
                {
                    Id             = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClinicalNoteId = table.Column<int>(type: "integer", nullable: false),
                    FileName       = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    FileUrl        = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    FileType       = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FileSizeBytes  = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt      = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClinicalNoteAttachments", x => x.Id);
                    table.ForeignKey("FK_ClinicalNoteAttachments_ClinicalNotes_ClinicalNoteId",
                        x => x.ClinicalNoteId, "ClinicalNotes", "Id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex("IX_ClinicalNotes_DoctorId_PatientId", "ClinicalNotes", new[] { "DoctorId", "PatientId" });
            migrationBuilder.CreateIndex("IX_ClinicalNoteAttachments_ClinicalNoteId", "ClinicalNoteAttachments", "ClinicalNoteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "ClinicalNoteAttachments");
            migrationBuilder.DropTable(name: "ClinicalNotes");
        }
    }
}
