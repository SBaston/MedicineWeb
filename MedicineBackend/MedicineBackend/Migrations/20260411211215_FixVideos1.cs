using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MedicineBackend.Migrations
{
    /// <inheritdoc />
    public partial class FixVideos1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DisplayOrder",
                table: "SocialMediaVideos");

            migrationBuilder.DropColumn(
                name: "IsVerified",
                table: "SocialMediaVideos");

            migrationBuilder.DropColumn(
                name: "Tags",
                table: "SocialMediaVideos");

            migrationBuilder.DropColumn(
                name: "VideoId",
                table: "SocialMediaVideos");

            migrationBuilder.AlterColumn<int>(
                name: "ViewCount",
                table: "SocialMediaVideos",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "SocialMediaVideos",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "LikeCount",
                table: "SocialMediaVideos",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasAcceptedContentTerms",
                table: "Doctors",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "DoctorContentConsents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DoctorId = table.Column<int>(type: "integer", nullable: false),
                    TermsVersion = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    HasAccepted = table.Column<bool>(type: "boolean", nullable: false),
                    AcceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DoctorContentConsents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DoctorContentConsents_Doctors_DoctorId",
                        column: x => x.DoctorId,
                        principalTable: "Doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DoctorSocialMedias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DoctorId = table.Column<int>(type: "integer", nullable: false),
                    Platform = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ProfileUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    FollowerCount = table.Column<int>(type: "integer", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DoctorSocialMedias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DoctorSocialMedias_Doctors_DoctorId",
                        column: x => x.DoctorId,
                        principalTable: "Doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SocialMediaVideos_IsActive",
                table: "SocialMediaVideos",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_SocialMediaVideos_Platform",
                table: "SocialMediaVideos",
                column: "Platform");

            migrationBuilder.CreateIndex(
                name: "IX_DoctorContentConsent_DoctorId",
                table: "DoctorContentConsents",
                column: "DoctorId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DoctorContentConsents_HasAccepted",
                table: "DoctorContentConsents",
                column: "HasAccepted");

            migrationBuilder.CreateIndex(
                name: "IX_DoctorSocialMedia_Doctor_Platform",
                table: "DoctorSocialMedias",
                columns: new[] { "DoctorId", "Platform" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DoctorSocialMedias_DoctorId",
                table: "DoctorSocialMedias",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_DoctorSocialMedias_IsActive",
                table: "DoctorSocialMedias",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_DoctorSocialMedias_Platform",
                table: "DoctorSocialMedias",
                column: "Platform");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DoctorContentConsents");

            migrationBuilder.DropTable(
                name: "DoctorSocialMedias");

            migrationBuilder.DropIndex(
                name: "IX_SocialMediaVideos_IsActive",
                table: "SocialMediaVideos");

            migrationBuilder.DropIndex(
                name: "IX_SocialMediaVideos_Platform",
                table: "SocialMediaVideos");

            migrationBuilder.DropColumn(
                name: "HasAcceptedContentTerms",
                table: "Doctors");

            migrationBuilder.AlterColumn<int>(
                name: "ViewCount",
                table: "SocialMediaVideos",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "SocialMediaVideos",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<int>(
                name: "LikeCount",
                table: "SocialMediaVideos",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "DisplayOrder",
                table: "SocialMediaVideos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsVerified",
                table: "SocialMediaVideos",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Tags",
                table: "SocialMediaVideos",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VideoId",
                table: "SocialMediaVideos",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);
        }
    }
}
