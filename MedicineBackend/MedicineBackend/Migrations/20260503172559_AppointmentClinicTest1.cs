using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedicineBackend.Migrations
{
    /// <inheritdoc />
    public partial class AppointmentClinicTest1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Crear tablas si no existen (por si AddClinicalNotes quedó registrada pero no ejecutada)
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS ""ClinicalNotes"" (
                    ""Id""                 SERIAL PRIMARY KEY,
                    ""DoctorId""           INTEGER NOT NULL REFERENCES ""Doctors""(""Id"") ON DELETE CASCADE,
                    ""PatientId""          INTEGER NOT NULL REFERENCES ""Patients""(""Id"") ON DELETE CASCADE,
                    ""Title""              VARCHAR(300) NOT NULL DEFAULT '',
                    ""Template""           VARCHAR(100),
                    ""TabTranscription""   TEXT,
                    ""TabClinicalHistory"" TEXT,
                    ""TabSummary""         TEXT,
                    ""CreatedAt""          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    ""UpdatedAt""          TIMESTAMPTZ
                );");

            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS ""ClinicalNoteAttachments"" (
                    ""Id""             SERIAL PRIMARY KEY,
                    ""ClinicalNoteId"" INTEGER NOT NULL REFERENCES ""ClinicalNotes""(""Id"") ON DELETE CASCADE,
                    ""FileName""       VARCHAR(255) NOT NULL DEFAULT '',
                    ""FileUrl""        VARCHAR(500) NOT NULL DEFAULT '',
                    ""FileType""       VARCHAR(100) NOT NULL DEFAULT '',
                    ""FileSizeBytes""  BIGINT NOT NULL DEFAULT 0,
                    ""CreatedAt""      TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );");

            // Eliminar el índice compuesto si existe y crear índices individuales
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_ClinicalNotes_DoctorId_PatientId"";");
            migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_ClinicalNotes_DoctorId"" ON ""ClinicalNotes"" (""DoctorId"");");
            migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_ClinicalNotes_PatientId"" ON ""ClinicalNotes"" (""PatientId"");");
            migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_ClinicalNoteAttachments_ClinicalNoteId"" ON ""ClinicalNoteAttachments"" (""ClinicalNoteId"");");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP TABLE IF EXISTS ""ClinicalNoteAttachments"";");
            migrationBuilder.Sql(@"DROP TABLE IF EXISTS ""ClinicalNotes"";");
        }
    }
}
