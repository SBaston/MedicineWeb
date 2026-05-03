using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedicineBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddTwoFactorAuth : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""Users""
                    ADD COLUMN IF NOT EXISTS ""TwoFactorEnabled"" BOOLEAN NOT NULL DEFAULT FALSE,
                    ADD COLUMN IF NOT EXISTS ""TwoFactorSecret""  VARCHAR(256);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""Users""
                    DROP COLUMN IF EXISTS ""TwoFactorEnabled"",
                    DROP COLUMN IF EXISTS ""TwoFactorSecret"";");
        }
    }
}
