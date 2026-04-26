using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedicineBackend.Migrations
{
    /// <inheritdoc />
    public partial class Invoice1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_SentAt",
                table: "ChatMessages",
                column: "SentAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ChatMessages_SentAt",
                table: "ChatMessages");
        }
    }
}
