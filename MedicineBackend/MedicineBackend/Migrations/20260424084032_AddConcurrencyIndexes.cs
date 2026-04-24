using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedicineBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddConcurrencyIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CourseEnrollments_CourseId",
                table: "CourseEnrollments");

            migrationBuilder.DropIndex(
                name: "IX_Appointments_DoctorId",
                table: "Appointments");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_TransactionId",
                table: "Payments",
                column: "TransactionId",
                unique: true,
                filter: "\"TransactionId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CourseEnrollments_CourseId_DoctorId",
                table: "CourseEnrollments",
                columns: new[] { "CourseId", "DoctorId" },
                unique: true,
                filter: "\"DoctorId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CourseEnrollments_CourseId_PatientId",
                table: "CourseEnrollments",
                columns: new[] { "CourseId", "PatientId" },
                unique: true,
                filter: "\"PatientId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_DoctorId_Date_Active",
                table: "Appointments",
                columns: new[] { "DoctorId", "AppointmentDate" },
                unique: true,
                filter: "\"Status\" != 'Cancelada'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Payments_TransactionId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_CourseEnrollments_CourseId_DoctorId",
                table: "CourseEnrollments");

            migrationBuilder.DropIndex(
                name: "IX_CourseEnrollments_CourseId_PatientId",
                table: "CourseEnrollments");

            migrationBuilder.DropIndex(
                name: "IX_Appointments_DoctorId_Date_Active",
                table: "Appointments");

            migrationBuilder.CreateIndex(
                name: "IX_CourseEnrollments_CourseId",
                table: "CourseEnrollments",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_DoctorId",
                table: "Appointments",
                column: "DoctorId");
        }
    }
}
