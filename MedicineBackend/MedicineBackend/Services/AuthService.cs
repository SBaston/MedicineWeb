using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
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
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;

    public AuthService(AppDbContext context, JwtHelper jwtHelper,
        IEmailService emailService, IConfiguration configuration)
    {
        _context = context;
        _jwtHelper = jwtHelper;
        _emailService = emailService;
        _configuration = configuration;
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
                        PhoneNumber = request.PhoneNumber,
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
    /// ✅ ACTUALIZADO: Bloquea login de doctores pendientes de aprobación
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

        // ══════════════════════════════════════════════════════════════
        // ✅ NUEVO: BLOQUEO DE LOGIN PARA DOCTORES PENDIENTES
        // ══════════════════════════════════════════════════════════════
        if (user.Role == "Doctor" && user.Doctor != null)
        {
            switch (user.Doctor.Status)
            {
                case DoctorStatus.PendingReview:
                    throw new UnauthorizedAccessException(
                        "Tu cuenta está pendiente de aprobación por el equipo de NexusSalud. " +
                        "Recibirás un email cuando sea aprobada."
                    );

                case DoctorStatus.Rejected:
                    var rejectionReason = string.IsNullOrEmpty(user.Doctor.StatusReason)
                        ? "No especificado"
                        : user.Doctor.StatusReason;
                    throw new UnauthorizedAccessException(
                        $"Tu solicitud ha sido rechazada. Motivo: {rejectionReason}"
                    );

                case DoctorStatus.Suspended:
                    throw new UnauthorizedAccessException(
                        "Tu cuenta ha sido suspendida temporalmente. Contacta con soporte para más información."
                    );

                case DoctorStatus.Deleted:
                    throw new UnauthorizedAccessException(
                        "Tu cuenta ha sido desactivada. Contacta con soporte si crees que es un error."
                    );

                // Solo DoctorStatus.Active puede hacer login
                case DoctorStatus.Active:
                    // Continuar con el login normal
                    break;
            }
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

    // ══════════════════════════════════════════════════════════════
    // VERIFICACIÓN DE EMAIL POR CÓDIGO DE 6 DÍGITOS
    // ══════════════════════════════════════════════════════════════

    /// <summary>
    /// Genera y envía un código de verificación de 6 dígitos al email del usuario.
    /// Válido 1 minuto.
    /// </summary>
    public async Task SendVerificationCodeAsync(string email)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email)
            ?? throw new InvalidOperationException("No existe ninguna cuenta con ese email");

        // Generar código de 6 dígitos
        var code = new Random().Next(100000, 999999).ToString();

        user.EmailVerificationToken = code;
        user.EmailVerificationExpiry = DateTime.UtcNow.AddMinutes(1);
        await _context.SaveChangesAsync();

        // Obtener nombre del usuario
        var name = user.Role switch
        {
            "Doctor"  => (await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == user.Id))?.FullName ?? "Usuario",
            "Patient" => (await _context.Patients.FirstOrDefaultAsync(p => p.UserId == user.Id))?.FullName ?? "Usuario",
            _         => "Usuario"
        };

        await _emailService.SendEmailVerificationCodeAsync(email, name, code);
    }

    /// <summary>
    /// Verifica el código introducido por el usuario.
    /// Marca el email como verificado si es correcto y no ha expirado.
    /// </summary>
    public async Task VerifyEmailCodeAsync(string email, string code)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email)
            ?? throw new InvalidOperationException("Usuario no encontrado");

        if (user.EmailVerificationToken != code)
            throw new InvalidOperationException("El código es incorrecto");

        if (user.EmailVerificationExpiry == null || user.EmailVerificationExpiry < DateTime.UtcNow)
            throw new InvalidOperationException("El código ha expirado. Solicita uno nuevo.");

        user.IsEmailVerified = true;
        user.EmailVerificationToken = null;
        user.EmailVerificationExpiry = null;
        await _context.SaveChangesAsync();
    }

    // ══════════════════════════════════════════════════════════════
    // RECUPERACIÓN DE CONTRASEÑA
    // ══════════════════════════════════════════════════════════════

    /// <summary>
    /// Genera un token único de reset y envía el enlace por email. Expira en 15 minutos.
    /// </summary>
    public async Task ForgotPasswordAsync(string email)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

        // Por seguridad, no revelar si el email existe o no
        if (user == null) return;

        var token = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N"); // 64 chars
        user.PasswordResetToken = token;
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddMinutes(15);
        await _context.SaveChangesAsync();

        var name = user.Role switch
        {
            "Doctor"  => (await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == user.Id))?.FullName ?? "Usuario",
            "Patient" => (await _context.Patients.FirstOrDefaultAsync(p => p.UserId == user.Id))?.FullName ?? "Usuario",
            _         => "Usuario"
        };

        var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";
        await _emailService.SendPasswordResetEmailAsync(email, name, token, frontendUrl);
    }

    /// <summary>
    /// Restablece la contraseña del usuario usando el token recibido por email.
    /// </summary>
    public async Task ResetPasswordAsync(string token, string newPassword)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.PasswordResetToken == token)
            ?? throw new InvalidOperationException("El enlace de recuperación no es válido o ya fue usado");

        if (user.PasswordResetTokenExpiry == null || user.PasswordResetTokenExpiry < DateTime.UtcNow)
            throw new InvalidOperationException("El enlace ha expirado. Solicita uno nuevo desde la página de login.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;
        await _context.SaveChangesAsync();
    }
}