using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedicineBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddDoctorToEnrollmentAndFixNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Drop unique index on (CourseId, PatientId) — it won't work with nullable PatientId
            migrationBuilder.DropIndex(
                name: "IX_CourseEnrollments_CourseId_PatientId",
                table: "CourseEnrollments");

            // 2. Make PatientId nullable
            migrationBuilder.AlterColumn<int>(
                name: "PatientId",
                table: "CourseEnrollments",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            // 3. Add DoctorId column (nullable)
            migrationBuilder.AddColumn<int>(
                name: "DoctorId",
                table: "CourseEnrollments",
                type: "integer",
                nullable: true);

            // 4. Add FK: CourseEnrollments.DoctorId → Doctors.Id
            migrationBuilder.AddForeignKey(
                name: "FK_CourseEnrollments_Doctors_DoctorId",
                table: "CourseEnrollments",
                column: "DoctorId",
                principalTable: "Doctors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // 5. Create index on DoctorId
            migrationBuilder.CreateIndex(
                name: "IX_CourseEnrollments_DoctorId",
                table: "CourseEnrollments",
                column: "DoctorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CourseEnrollments_Doctors_DoctorId",
                table: "CourseEnrollments");

            migrationBuilder.DropIndex(
                name: "IX_CourseEnrollments_DoctorId",
                table: "CourseEnrollments");

            migrationBuilder.DropColumn(
                name: "DoctorId",
                table: "CourseEnrollments");

            migrationBuilder.AlterColumn<int>(
                name: "PatientId",
                table: "CourseEnrollments",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CourseEnrollments_CourseId_PatientId",
                table: "CourseEnrollments",
                columns: new[] { "CourseId", "PatientId" },
                unique: true);
        }
    }
}
