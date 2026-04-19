using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedicineBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddSessionDurationToDoctorAndCourses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SessionDurationMinutes",
                table: "Doctors",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SessionDurationMinutes",
                table: "Doctors");
        }
    }
}
