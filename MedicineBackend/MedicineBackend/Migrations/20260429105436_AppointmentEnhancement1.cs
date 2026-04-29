using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedicineBackend.Migrations
{
    /// <inheritdoc />
    public partial class AppointmentEnhancement1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── Paso 1: añadir las columnas con default temporal para filas existentes ──
            migrationBuilder.AddColumn<bool>(
                name: "AcceptsInPersonAppointments",
                table: "Doctors",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "AcceptsOnlineAppointments",
                table: "Doctors",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "OfficeAddress",
                table: "Doctors",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OfficeCity",
                table: "Doctors",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OfficeCountry",
                table: "Doctors",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OfficeInstructions",
                table: "Doctors",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OfficePostalCode",
                table: "Doctors",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Timezone",
                table: "Doctors",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "Europe/Madrid");

            // ── Paso 2: quitar los defaults de BD (EF los gestiona a nivel C#) ──
            migrationBuilder.AlterColumn<string>(
                name: "Timezone",
                table: "Doctors",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldDefaultValue: "Europe/Madrid");

            migrationBuilder.AlterColumn<bool>(
                name: "AcceptsOnlineAppointments",
                table: "Doctors",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: true);

            migrationBuilder.AlterColumn<bool>(
                name: "AcceptsInPersonAppointments",
                table: "Doctors",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "AcceptsInPersonAppointments", table: "Doctors");
            migrationBuilder.DropColumn(name: "AcceptsOnlineAppointments",   table: "Doctors");
            migrationBuilder.DropColumn(name: "OfficeAddress",               table: "Doctors");
            migrationBuilder.DropColumn(name: "OfficeCity",                  table: "Doctors");
            migrationBuilder.DropColumn(name: "OfficeCountry",               table: "Doctors");
            migrationBuilder.DropColumn(name: "OfficeInstructions",          table: "Doctors");
            migrationBuilder.DropColumn(name: "OfficePostalCode",            table: "Doctors");
            migrationBuilder.DropColumn(name: "Timezone",                    table: "Doctors");
        }
    }
}
