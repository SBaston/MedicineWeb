using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedicineBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddCourseContentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ArticleContent",
                table: "Courses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContentType",
                table: "Courses",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContentUrl",
                table: "Courses",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ArticleContent",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "ContentType",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "ContentUrl",
                table: "Courses");
        }
    }
}
