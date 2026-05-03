using MedicineBackend.Configuration;
using MedicineBackend.Data;
using MedicineBackend.Helpers;
using MedicineBackend.Hubs;

using MedicineBackend.Services;
using MedicineBackend.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ============================================
// CONFIGURACIÓN DE SERVICIOS
// ============================================

// Controllers
builder.Services.AddControllers();

// ═══════════════════════════════════════════════════════════
// HTTPS REDIRECTION
// ═══════════════════════════════════════════════════════════
builder.Services.AddHttpsRedirection(options =>
{
    options.RedirectStatusCode = StatusCodes.Status307TemporaryRedirect;
    options.HttpsPort = 5001;
});

// ═══════════════════════════════════════════════════════════
// CORS - ACTUALIZADO PARA HTTPS
// ═══════════════════════════════════════════════════════════
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            //"https://localhost:5173",  // Frontend HTTPS (principal)
            "http://localhost:5173",   // Frontend HTTP (fallback desarrollo)
            "http://localhost:50239"   // Puerto alternativo
        )
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
    });
});

// Base de datos PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsqlOptions => npgsqlOptions.MigrationsAssembly("MedicineBackend")
    );
});

// Redis para caché (opcional)
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "MedicineBackend_";
});

// Inyección de dependencias - Servicios
builder.Services.AddScoped<ICacheService, CacheService>();
builder.Services.AddScoped<IDoctorService, DoctorService>();
builder.Services.AddScoped<IPatientService, PatientService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IDoctorManagementService, DoctorManagementService>();
builder.Services.AddScoped<ISpecialtyService, SpecialtyService>();
builder.Services.AddScoped<IProfessionalService, ProfessionalService>();
//builder.Services.AddScoped<IOcrService, OcrService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<JwtHelper>();
builder.Services.AddScoped<IDoctorDashboardService, DoctorDashboardService>();
builder.Services.AddScoped<ICourseService, CourseService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();

// ✅ NUEVOS SERVICIOS: Citas y Email
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();

// ✅ CONFIGURACIÓN DE PLATAFORMA: IVA, comisión, datos fiscales
builder.Services.AddScoped<ISettingsService, SettingsService>();

// ✅ FACTURAS: generación conforme a RD 1619/2012 + email + CSV export
builder.Services.AddScoped<IInvoiceService, InvoiceService>();

// ✅ SERVICIO DE PAGOS: Stripe
builder.Services.AddScoped<IPaymentService, PaymentService>();

// ✅ SERVICIO DE CHAT PREMIUM: suscripciones y mensajería
builder.Services.AddScoped<IChatService, ChatService>();

// ✅ HISTORIALES CLÍNICOS
builder.Services.AddScoped<IClinicalNoteService, ClinicalNoteService>();

// ✅ RESEÑAS: valoraciones verificadas (requiere cita completada)
builder.Services.AddScoped<IReviewService, ReviewService>();

// ✅ VIDEOLLAMADAS: Jitsi Meet (gratis, sin límites, open source, WebRTC)

// ✅ AUTO-COMPLETADO DE CITAS: marca citas como Completada cada 5 minutos
builder.Services.AddHostedService<AppointmentCompletionService>();

// ✅ RECORDATORIOS: envía emails 24 h antes al paciente y al doctor
builder.Services.AddHostedService<AppointmentReminderService>();

// ✅ SIGNALR: mensajería en tiempo real
builder.Services.AddSignalR();

builder.Services.AddMemoryCache();

// Autenticación JWT
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey no configurada");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero
    };

    // ✅ SignalR: leer el token desde query string para WebSocket
    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// Autorización basada en roles
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("DoctorOnly", policy => policy.RequireRole("Doctor"));
    options.AddPolicy("PatientOnly", policy => policy.RequireRole("Patient"));
    options.AddPolicy("DoctorOrAdmin", policy => policy.RequireRole("Doctor", "Admin"));
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "NexusSalud API",
        Version = "v1",
        Description = "API para plataforma de consultas médicas online con especialistas",
        Contact = new OpenApiContact
        {
            Name = "NexusSalud Team",
            Email = "contact@nexussalud.com"
        }
    });

    // Configuración de seguridad JWT en Swagger
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Introduce el token JWT con Bearer"
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});

builder.Services.Configure<InitialAdminSettings>(
    builder.Configuration.GetSection("InitialAdminSettings"));

builder.Services.AddScoped<DatabaseSeeder>();

// ============================================
// CONSTRUCCIÓN DE LA APLICACIÓN
// ============================================

var app = builder.Build();

// ============================================
// MIDDLEWARE PIPELINE - ORDEN CRÍTICO
// ============================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "NexusSalud API v1");
        options.RoutePrefix = string.Empty;  // Swagger en la raíz "/"
    });
}

// ═══════════════════════════════════════════════════════════
// MIDDLEWARE - ORDEN IMPORTANTE
// ═══════════════════════════════════════════════════════════
/*app.UseHttpsRedirection();*/  // ← PRIMERO: Redirigir HTTP → HTTPS

// Servir archivos estáticos desde wwwroot
app.UseStaticFiles();

// ✅ Servir archivos desde la carpeta uploads
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "uploads")),
    RequestPath = "/uploads"
});
app.UseCors("AllowFrontend");  // ← SEGUNDO: CORS
app.UseAuthentication();  // ← TERCERO: Autenticación
app.UseAuthorization();   // ← CUARTO: Autorización
app.MapControllers();     // ← Controladores REST

// ✅ SignalR Hub para chat en tiempo real
app.MapHub<ChatHub>("/hubs/chat");

// ✅ SignalR Hub para señalización WebRTC de videollamadas
app.MapHub<VideoHub>("/hubs/video");

// ✅ Health check endpoint para Docker
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
   .AllowAnonymous()
   .ExcludeFromDescription();

// ============================================
// INICIALIZACIÓN DE BASE DE DATOS
// ============================================

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        logger.LogInformation("🔍 Verificando conexión a la base de datos...");

        
        // 1. Verificar conexión
        var canConnect = await dbContext.Database.CanConnectAsync();

        //if (!canConnect)
        //{
        //    logger.LogError("❌ No se puede conectar a PostgreSQL");
        //    throw new Exception("No se puede conectar a la base de datos");
        //}

        //logger.LogInformation("✅ Conexión exitosa a PostgreSQL");

        // 2. Aplicar migraciones pendientes
        var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync();

        if (pendingMigrations.Any())
        {
            logger.LogInformation("🔄 Aplicando {Count} migraciones pendientes...", pendingMigrations.Count());
            await dbContext.Database.MigrateAsync();
            logger.LogInformation("✅ Migraciones aplicadas correctamente");
        }
        else
        {
            logger.LogInformation("ℹ️ No hay migraciones pendientes");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "❌ Error al inicializar la base de datos: {Message}", ex.Message);

        // Mostrar ayuda si es error de autenticación
        if (ex.Message.Contains("password") || ex.Message.Contains("autenticación"))
        {
            logger.LogError("💡 Verifica tu contraseña en appsettings.json");
        }

        throw; // Re-lanzar para que la aplicación no inicie con BD incorrecta
    }
}

// Seed de datos iniciales
using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        logger.LogInformation("🌱 Iniciando seed de datos...");
        await seeder.SeedAsync();
        logger.LogInformation("✅ Seed completado");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "❌ Error durante el seed: {Message}", ex.Message);
    }
}

// ============================================
// MENSAJES DE INICIO
// ============================================

Console.WriteLine("═══════════════════════════════════════════════════════");
Console.WriteLine("🏥 NexusSalud Backend - Servidor iniciado correctamente");
Console.WriteLine("═══════════════════════════════════════════════════════");
Console.WriteLine($"📌 Entorno: {app.Environment.EnvironmentName}");
//Console.WriteLine($"🌐 HTTP:  http://localhost:5000");
//Console.WriteLine($"🔒 HTTPS: https://localhost:5001");
//Console.WriteLine($"📖 Swagger: https://localhost:5001");
Console.WriteLine($"📅 Fecha: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
Console.WriteLine("═══════════════════════════════════════════════════════");

app.Run();