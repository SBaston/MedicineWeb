using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MedicineBackend.Data;
using MedicineBackend.DTOs.Auth;
using MedicineBackend.Helpers;
using MedicineBackend.Models;
using MedicineBackend.Services.Interfaces;
using OtpNet;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;


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

        // ── 2FA: si está activado no devolvemos JWT todavía ──
        if (user.TwoFactorEnabled)
        {
            return new LoginResponse
            {
                RequiresTwoFactor = true,
                UserId  = user.Id,
                Email   = user.Email,
                Role    = user.Role,
                FullName = fullName,
            };
        }

        // ── 2FA obligatorio para Admins: si no lo tienen configurado, forzar setup ──
        if (user.Role == "Admin" && !user.TwoFactorEnabled)
        {
            // Generamos un token temporal para que pueda llamar a los endpoints de /2fa/setup y /2fa/enable
            var tempToken = _jwtHelper.GenerateToken(user.Id, user.Email, user.Role);
            return new LoginResponse
            {
                RequiresTwoFactorSetup = true,
                Token    = tempToken,   // token temporal para llamar a setup
                UserId   = user.Id,
                Email    = user.Email,
                Role     = user.Role,
                FullName = fullName,
                ExpiresAt = _jwtHelper.GetTokenExpiration()
            };
        }

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

    // ══════════════════════════════════════════════════════════════
    // 2FA — TOTP (Google Authenticator / Authy)
    // ══════════════════════════════════════════════════════════════

    /// <summary>
    /// Genera un secreto TOTP nuevo (sin activarlo aún) y devuelve la URI para el QR
    /// y la clave en Base32 para introducción manual.
    /// </summary>
    public async Task<TwoFactorSetupResponse> GenerateTwoFactorSetupAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId)
            ?? throw new InvalidOperationException("Usuario no encontrado");

        // Genera 20 bytes aleatorios → Base32
        var secretBytes = KeyGeneration.GenerateRandomKey(20);
        var secret = Base32Encoding.ToString(secretBytes);

        // Guardamos el secreto (pendiente de verificar → no activamos aún)
        user.TwoFactorSecret  = secret;
        user.TwoFactorEnabled = false; // se habilitará cuando el usuario verifique
        await _context.SaveChangesAsync();

        // URI estándar otpauth://totp/<issuer>:<account>?secret=...&issuer=...
        var issuer  = "NexusSalud";
        var account = Uri.EscapeDataString(user.Email);
        var uri     = $"otpauth://totp/{Uri.EscapeDataString(issuer)}:{account}?secret={secret}&issuer={Uri.EscapeDataString(issuer)}&algorithm=SHA1&digits=6&period=30";

        return new TwoFactorSetupResponse
        {
            OtpAuthUri     = uri,
            ManualEntryKey = secret,
        };
    }

    /// <summary>
    /// Verifica el código TOTP introducido, activa el 2FA y genera códigos de recuperación.
    /// Devuelve los 8 códigos en texto plano (solo se muestran una vez).
    /// </summary>
    public async Task<string[]> EnableTwoFactorAsync(int userId, string code)
    {
        var user = await _context.Users.FindAsync(userId)
            ?? throw new InvalidOperationException("Usuario no encontrado");

        if (string.IsNullOrEmpty(user.TwoFactorSecret))
            throw new InvalidOperationException("Primero debes iniciar la configuración del 2FA");

        if (!ValidateTotp(user.TwoFactorSecret, code))
            throw new InvalidOperationException("Código incorrecto. Asegúrate de que la hora de tu dispositivo es correcta.");

        // Generar 8 códigos de recuperación de un solo uso
        var plainCodes   = GenerateRecoveryCodes(8);
        var hashedCodes  = plainCodes.Select(HashRecoveryCode).ToArray();

        user.TwoFactorEnabled = true;
        user.RecoveryCodes    = JsonSerializer.Serialize(hashedCodes);
        await _context.SaveChangesAsync();

        return plainCodes;
    }

    /// <summary>
    /// Valida un código de recuperación durante el login (en sustitución del TOTP),
    /// lo marca como usado (lo elimina) y devuelve el JWT completo.
    /// </summary>
    public async Task<LoginResponse> UseRecoveryCodeAsync(int userId, string recoveryCode)
    {
        var user = await _context.Users
            .Include(u => u.Doctor)
            .Include(u => u.Patient)
            .Include(u => u.Admin)
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new UnauthorizedAccessException("Usuario no encontrado");

        if (!user.TwoFactorEnabled)
            throw new UnauthorizedAccessException("El 2FA no está activado en esta cuenta");

        if (string.IsNullOrEmpty(user.RecoveryCodes))
            throw new UnauthorizedAccessException("No quedan códigos de recuperación disponibles. Contacta con soporte.");

        var storedHashes = JsonSerializer.Deserialize<string[]>(user.RecoveryCodes) ?? [];
        var inputHash    = HashRecoveryCode(recoveryCode.Trim().ToLower());

        if (!storedHashes.Contains(inputHash))
            throw new UnauthorizedAccessException("Código de recuperación inválido o ya utilizado");

        // Eliminar el código usado (uso único)
        var remaining = storedHashes.Where(h => h != inputHash).ToArray();
        user.RecoveryCodes = JsonSerializer.Serialize(remaining);
        await _context.SaveChangesAsync();

        string fullName = user.Role switch
        {
            "Doctor"  => user.Doctor?.FullName  ?? "Doctor",
            "Patient" => user.Patient?.FullName ?? "Paciente",
            "Admin"   => user.Admin?.FullName   ?? "Admin",
            _         => "Usuario"
        };

        var token = _jwtHelper.GenerateToken(user.Id, user.Email, user.Role);

        return new LoginResponse
        {
            Token     = token,
            Email     = user.Email,
            Role      = user.Role,
            UserId    = user.Id,
            FullName  = fullName,
            ExpiresAt = _jwtHelper.GetTokenExpiration(),
        };
    }

    /// <summary>
    /// Desactiva el 2FA de un usuario por parte del Admin (sin verificación de código TOTP).
    /// </summary>
    public async Task AdminDisableTwoFactorAsync(int targetUserId)
    {
        var user = await _context.Users.FindAsync(targetUserId)
            ?? throw new KeyNotFoundException("Usuario no encontrado");

        user.TwoFactorEnabled = false;
        user.TwoFactorSecret  = null;
        user.RecoveryCodes    = null;
        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Desactiva el 2FA tras comprobar el código TOTP actual.
    /// </summary>
    public async Task DisableTwoFactorAsync(int userId, string code)
    {
        var user = await _context.Users.FindAsync(userId)
            ?? throw new InvalidOperationException("Usuario no encontrado");

        if (!user.TwoFactorEnabled || string.IsNullOrEmpty(user.TwoFactorSecret))
            throw new InvalidOperationException("El 2FA no está activado");

        if (!ValidateTotp(user.TwoFactorSecret, code))
            throw new InvalidOperationException("Código incorrecto");

        user.TwoFactorEnabled = false;
        user.TwoFactorSecret  = null;
        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Segundo paso del login con 2FA: valida el código TOTP y devuelve el JWT.
    /// </summary>
    public async Task<LoginResponse> VerifyTwoFactorLoginAsync(int userId, string code)
    {
        var user = await _context.Users
            .Include(u => u.Doctor)
            .Include(u => u.Patient)
            .Include(u => u.Admin)
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new UnauthorizedAccessException("Usuario no encontrado");

        if (!user.TwoFactorEnabled || string.IsNullOrEmpty(user.TwoFactorSecret))
            throw new UnauthorizedAccessException("El 2FA no está configurado en esta cuenta");

        if (!ValidateTotp(user.TwoFactorSecret, code))
            throw new UnauthorizedAccessException("Código de verificación incorrecto o expirado");

        string fullName = user.Role switch
        {
            "Doctor"  => user.Doctor?.FullName  ?? "Doctor",
            "Patient" => user.Patient?.FullName ?? "Paciente",
            "Admin"   => user.Admin?.FullName   ?? "Admin",
            _ => "Usuario"
        };

        var token = _jwtHelper.GenerateToken(user.Id, user.Email, user.Role);

        return new LoginResponse
        {
            Token    = token,
            Email    = user.Email,
            Role     = user.Role,
            UserId   = user.Id,
            FullName = fullName,
            ExpiresAt = _jwtHelper.GetTokenExpiration(),
        };
    }

    // ─────────────────────────────────────────────────────────────
    // HELPERS PRIVADOS
    // ─────────────────────────────────────────────────────────────

    /// <summary>
    /// Valida un código TOTP de 6 dígitos contra el secreto Base32.
    /// Ventana de ±2 pasos (~2 min) para tolerar desfase de reloj.
    /// </summary>
    private static bool ValidateTotp(string base32Secret, string code)
    {
        try
        {
            var secretBytes = Base32Encoding.ToBytes(base32Secret);
            var totp        = new Totp(secretBytes);
            return totp.VerifyTotp(
                totp:            code,
                timeStepMatched: out _,
                window:          new VerificationWindow(previous: 2, future: 2));
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Genera N códigos de recuperación aleatorios en formato XXXX-XXXX (hex minúsculas).
    /// </summary>
    private static string[] GenerateRecoveryCodes(int count = 8)
    {
        var codes = new string[count];
        for (int i = 0; i < count; i++)
        {
            var a = Convert.ToHexString(RandomNumberGenerator.GetBytes(3)).ToLower();
            var b = Convert.ToHexString(RandomNumberGenerator.GetBytes(3)).ToLower();
            codes[i] = $"{a}-{b}";
        }
        return codes;
    }

    /// <summary>
    /// Hashea un código de recuperación con SHA-256 para almacenarlo de forma segura.
    /// </summary>
    private static string HashRecoveryCode(string code)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(code.ToLower().Trim()));
        return Convert.ToHexString(bytes).ToLower();
    }
}
