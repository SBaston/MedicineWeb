using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedicineBackend.Migrations
{
    /// <inheritdoc />
    public partial class FixedTesseract : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "ProfessionalLicenseImageUrl",
                table: "Doctors",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "IdDocumentImageUrl",
                table: "Doctors",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "DegreeImageUrl",
                table: "Doctors",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IdDocumentBackImageUrl",
                table: "Doctors",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IdDocumentFrontImageUrl",
                table: "Doctors",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProfessionalLicenseBackImageUrl",
                table: "Doctors",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProfessionalLicenseFrontImageUrl",
                table: "Doctors",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SpecialtyDegreeImageUrl",
                table: "Doctors",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UniversityDegreeImageUrl",
                table: "Doctors",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IdDocumentBackImageUrl",
                table: "Doctors");

            migrationBuilder.DropColumn(
                name: "IdDocumentFrontImageUrl",
                table: "Doctors");

            migrationBuilder.DropColumn(
                name: "ProfessionalLicenseBackImageUrl",
                table: "Doctors");

            migrationBuilder.DropColumn(
                name: "ProfessionalLicenseFrontImageUrl",
                table: "Doctors");

            migrationBuilder.DropColumn(
                name: "SpecialtyDegreeImageUrl",
                table: "Doctors");

            migrationBuilder.DropColumn(
                name: "UniversityDegreeImageUrl",
                table: "Doctors");

            migrationBuilder.AlterColumn<string>(
                name: "ProfessionalLicenseImageUrl",
                table: "Doctors",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "IdDocumentImageUrl",
                table: "Doctors",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "DegreeImageUrl",
                table: "Doctors",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);
        }
    }
}
