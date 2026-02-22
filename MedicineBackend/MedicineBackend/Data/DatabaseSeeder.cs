using MedicineBackend.Configuration;
using MedicineBackend.Models;
using Microsoft.Extensions.Options;

namespace MedicineBackend.Data;

public class DatabaseSeeder
{
    private readonly AppDbContext _context;
    private readonly InitialAdminSettings _settings;

    public DatabaseSeeder(
        AppDbContext context,
        IOptions<InitialAdminSettings> options)
    {
        _context = context;
        _settings = options.Value;
    }

    public async Task SeedAsync()
    {
        if (!_settings.CreateOnStartup)
            return;

        // ¿Ya existe algún Admin?
        if (_context.Admins.Any())
            return;

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(_settings.Password);

        var user = new User
        {
            Email = _settings.Email,
            PasswordHash = passwordHash,
            Role = "Admin",
            IsActive = true,
            IsEmailVerified = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var admin = new Admin
        {
            UserId = user.Id,
            FullName = _settings.FullName,
            PermissionLevel = _settings.PermissionLevel, // SuperAdmin
            Department = _settings.Department,
            CreatedAt = DateTime.UtcNow
        };

        _context.Admins.Add(admin);
        await _context.SaveChangesAsync();
    }
}
