using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedicineBackend.Migrations
{
    /// <inheritdoc />
    public partial class DoctorSpecialTry2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IconUrl",
                table: "Specialties");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Specialties",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Specialties",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DegreeImageUrl",
                table: "Doctors",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IdDocumentImageUrl",
                table: "Doctors",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDocumentVerified",
                table: "Doctors",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "OcrData",
                table: "Doctors",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProfessionalLicenseImageUrl",
                table: "Doctors",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Specialties");

            migrationBuilder.DropColumn(
                name: "DegreeImageUrl",
                table: "Doctors");

            migrationBuilder.DropColumn(
                name: "IdDocumentImageUrl",
                table: "Doctors");

            migrationBuilder.DropColumn(
                name: "IsDocumentVerified",
                table: "Doctors");

            migrationBuilder.DropColumn(
                name: "OcrData",
                table: "Doctors");

            migrationBuilder.DropColumn(
                name: "ProfessionalLicenseImageUrl",
                table: "Doctors");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Specialties",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AddColumn<string>(
                name: "IconUrl",
                table: "Specialties",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }
    }
}
