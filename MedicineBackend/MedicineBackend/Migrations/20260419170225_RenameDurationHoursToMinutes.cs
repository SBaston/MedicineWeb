using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedicineBackend.Migrations
{
    /// <inheritdoc />
    public partial class RenameDurationHoursToMinutes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DurationHours",
                table: "Courses",
                newName: "DurationMinutes");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DurationMinutes",
                table: "Courses",
                newName: "DurationHours");
        }
    }
}
