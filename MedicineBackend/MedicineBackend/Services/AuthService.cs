using Microsoft.EntityFrameworkCore;
using MedicineBackend.Data;
using MedicineBackend.DTOs.Auth;
using MedicineBackend.Helpers;
using MedicineBackend.Models;
using MedicineBackend.Services.Interfaces;


namespace MedicineBackend.Services;

/// <summary>
/// Servicio de autenticación y gestión de usuarios
/// </summary>
public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly JwtHelper _jwtHelper;

    public AuthService(AppDbContext context, JwtHelper jwtHelper)
    {
        _context = context;
        _jwtHelper = jwtHelper;
    }

    /// <summary>
    /// Registra un nuevo usuario en el sistema
    /// </summary>
    public async Task<LoginResponse> RegisterAsync(RegisterRequest request)
    {
        // Verificar si el email ya existe
        if (await EmailExistsAsync(request.Email))
        {
            throw new InvalidOperationException("El email ya está registrado");
        }

        // Validaciones específicas por rol
        if (request.Role == "Doctor" && string.IsNullOrEmpty(request.ProfessionalLicense))
        {
            throw new InvalidOperationException("El número de colegiado es obligatorio para doctores");
        }

        if (request.Role == "Patient" && !request.DateOfBirth.HasValue)
        {
            throw new InvalidOperationException("La fecha de nacimiento es obligatoria para pacientes");
        }

        // Iniciar transacción
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // Crear usuario base
            var user = new User
            {
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = request.Role,
                IsActive = true,
                IsEmailVerified = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Crear el registro específico según el rol
            switch (request.Role)
            {
                case "Doctor":
                    var doctor = new Doctor
                    {
                        UserId = user.Id,
                        FirstName = request.FirstName,
                        LastName = request.LastName,
                        ProfessionalLicense = request.ProfessionalLicense!,
                        IsAcceptingPatients = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Doctors.Add(doctor);
                    break;

                case "Patient":
                    var patient = new Patient
                    {
                        UserId = user.Id,
                        FirstName = request.FirstName,
                        LastName = request.LastName,
                        DateOfBirth = DateTime.SpecifyKind(request.DateOfBirth!.Value,
                        DateTimeKind.Utc),
                        Country = "España",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Patients.Add(patient);
                    break;

                case "Admin":
                    var admin = new Admin
                    {
                        UserId = user.Id,
                        FullName = $"{request.FirstName} {request.LastName}",
                        IsSuperAdmin = false,
                        Department = request.Department,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Admins.Add(admin);
                    break;
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // Generar token JWT
            var token = _jwtHelper.GenerateToken(user.Id, user.Email, user.Role);

            return new LoginResponse
            {
                Token = token,
                Email = user.Email,
                Role = user.Role,
                UserId = user.Id,
                FullName = $"{request.FirstName} {request.LastName}",
                ExpiresAt = _jwtHelper.GetTokenExpiration()
            };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// Autentica a un usuario y retorna un token JWT
    /// </summary>
    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        // Buscar usuario por email
        var user = await _context.Users
            .Include(u => u.Doctor)
            .Include(u => u.Patient)
            .Include(u => u.Admin)
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null)
        {
            throw new UnauthorizedAccessException("Email o contraseña incorrectos");
        }

        // Verificar contraseña
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Email o contraseña incorrectos");
        }

        // Verificar si el usuario está activo
        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("La cuenta está desactivada");
        }

        // Actualizar último login
        user.LastLogin = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Obtener nombre completo según el rol
        string fullName = user.Role switch
        {
            "Doctor" => user.Doctor?.FullName ?? "Doctor",
            "Patient" => user.Patient?.FullName ?? "Paciente",
            "Admin" => user.Admin?.FullName ?? "Admin",
            _ => "Usuario"
        };

        // Generar token JWT
        var token = _jwtHelper.GenerateToken(user.Id, user.Email, user.Role);

        return new LoginResponse
        {
            Token = token,
            Email = user.Email,
            Role = user.Role,
            UserId = user.Id,
            FullName = fullName,
            ExpiresAt = _jwtHelper.GetTokenExpiration()
        };
    }

    /// <summary>
    /// Verifica si un email ya está registrado
    /// </summary>
    public async Task<bool> EmailExistsAsync(string email)
    {
        return await _context.Users.AnyAsync(u => u.Email == email);
    }
}