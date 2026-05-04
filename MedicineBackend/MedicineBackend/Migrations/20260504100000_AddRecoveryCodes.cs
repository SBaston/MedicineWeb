using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedicineBackend.Migrations;

/// <inheritdoc />
public partial class AddRecoveryCodes : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Idempotente: no falla si la columna ya existe
        migrationBuilder.Sql(@"
            ALTER TABLE ""Users""
            ADD COLUMN IF NOT EXISTS ""RecoveryCodes"" TEXT;
        ");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
            ALTER TABLE ""Users""
            DROP COLUMN IF EXISTS ""RecoveryCodes"";
        ");
    }
}
