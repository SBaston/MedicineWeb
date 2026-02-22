using Microsoft.EntityFrameworkCore;

using MedicineBackend.Models;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;

namespace MedicineBackend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // ============================================
    // TABLAS (DbSets)
    // ============================================

    public DbSet<User> Users { get; set; }
    public DbSet<Doctor> Doctors { get; set; }
    public DbSet<Patient> Patients { get; set; }
    public DbSet<Admin> Admins { get; set; }
    public DbSet<Specialty> Specialties { get; set; }
    public DbSet<Appointment> Appointments { get; set; }
    public DbSet<SocialMediaVideo> SocialMediaVideos { get; set; }
    public DbSet<Course> Courses { get; set; }
    public DbSet<CourseModule> CourseModules { get; set; }
    public DbSet<CourseEnrollment> CourseEnrollments { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<DoctorAvailability> DoctorAvailabilities { get; set; }
    public DbSet<Notification> Notifications { get; set; }

    // ============================================
    // CONFIGURACIÓN DE ENTIDADES
    // ============================================

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ============================================
        // CONFIGURACIÓN: USER
        // ============================================

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);

            entity.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(255);

            entity.HasIndex(u => u.Email)
                .IsUnique();

            entity.Property(u => u.PasswordHash)
                .IsRequired();

            entity.Property(u => u.Role)
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(u => u.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Relación 1:1 con Doctor
            entity.HasOne(u => u.Doctor)
                .WithOne(d => d.User)
                .HasForeignKey<Doctor>(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relación 1:1 con Patient
            entity.HasOne(u => u.Patient)
                .WithOne(p => p.User)
                .HasForeignKey<Patient>(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relación 1:1 con Admin
            entity.HasOne(u => u.Admin)
                .WithOne(a => a.User)
                .HasForeignKey<Admin>(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ============================================
        // CONFIGURACIÓN: DOCTOR
        // ============================================

        modelBuilder.Entity<Doctor>(entity =>
        {
            entity.HasKey(d => d.Id);

            entity.Property(d => d.FirstName)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(d => d.LastName)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(d => d.ProfessionalLicense)
                .IsRequired()
                .HasMaxLength(50);

            entity.HasIndex(d => d.ProfessionalLicense)
                .IsUnique();

            entity.Property(d => d.Description)
                .HasMaxLength(2000);

            entity.Property(d => d.PricePerSession)
                .HasColumnType("decimal(10,2)");

            entity.Property(d => d.TotalEarnings)
                .HasColumnType("decimal(12,2)")
                .HasDefaultValue(0);

            // Relación muchos-a-muchos con Specialties
            entity.HasMany(d => d.Specialties)
                .WithMany(s => s.Doctors)
                .UsingEntity<Dictionary<string, object>>(
                    "DoctorSpecialty",
                    j => j.HasOne<Specialty>().WithMany().HasForeignKey("SpecialtyId"),
                    j => j.HasOne<Doctor>().WithMany().HasForeignKey("DoctorId")
                );
        });

        // ============================================
        // CONFIGURACIÓN: PATIENT
        // ============================================

        modelBuilder.Entity<Patient>(entity =>
        {
            entity.HasKey(p => p.Id);

            entity.Property(p => p.FirstName)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(p => p.LastName)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(p => p.PhoneNumber)
                .HasMaxLength(20);

            entity.Property(p => p.DateOfBirth)
                .IsRequired();
        });

        // ============================================
        // CONFIGURACIÓN: ADMIN
        // ============================================

        modelBuilder.Entity<Admin>(entity =>
        {
            entity.HasKey(a => a.Id);

            entity.Property(a => a.FullName)
                .IsRequired()
                .HasMaxLength(200);
        });

        // ============================================
        // CONFIGURACIÓN: SPECIALTY
        // ============================================

        modelBuilder.Entity<Specialty>(entity =>
        {
            entity.HasKey(s => s.Id);

            entity.Property(s => s.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.HasIndex(s => s.Name)
                .IsUnique();

            entity.Property(s => s.Description)
                .HasMaxLength(500);
        });

        // ============================================
        // CONFIGURACIÓN: APPOINTMENT
        // ============================================

        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.HasKey(a => a.Id);

            entity.Property(a => a.Status)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("Pendiente");

            entity.Property(a => a.Price)
                .HasColumnType("decimal(10,2)");

            entity.Property(a => a.MeetingLink)
                .HasMaxLength(500);

            // Relación con Doctor
            entity.HasOne(a => a.Doctor)
                .WithMany(d => d.Appointments)
                .HasForeignKey(a => a.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relación con Patient
            entity.HasOne(a => a.Patient)
                .WithMany(p => p.Appointments)
                .HasForeignKey(a => a.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            // Índices para búsquedas eficientes
            entity.HasIndex(a => a.AppointmentDate);
            entity.HasIndex(a => a.Status);
        });

        // ============================================
        // CONFIGURACIÓN: SOCIAL MEDIA VIDEO
        // ============================================

        modelBuilder.Entity<SocialMediaVideo>(entity =>
        {
            entity.HasKey(v => v.Id);

            entity.Property(v => v.Platform)
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(v => v.VideoUrl)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(v => v.Title)
                .HasMaxLength(200);

            entity.Property(v => v.Description)
                .HasMaxLength(1000);

            // Relación con Doctor
            entity.HasOne(v => v.Doctor)
                .WithMany(d => d.SocialMediaVideos)
                .HasForeignKey(v => v.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ============================================
        // CONFIGURACIÓN: COURSE
        // ============================================

        modelBuilder.Entity<Course>(entity =>
        {
            entity.HasKey(c => c.Id);

            entity.Property(c => c.Title)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(c => c.Description)
                .HasMaxLength(2000);

            entity.Property(c => c.Price)
                .HasColumnType("decimal(10,2)");

            entity.Property(c => c.IsPublished)
                .HasDefaultValue(false);

            // Relación con Doctor
            entity.HasOne(c => c.Doctor)
                .WithMany(d => d.Courses)
                .HasForeignKey(c => c.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ============================================
        // CONFIGURACIÓN: COURSE MODULE
        // ============================================

        modelBuilder.Entity<CourseModule>(entity =>
        {
            entity.HasKey(m => m.Id);

            entity.Property(m => m.Title)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(m => m.Content)
                .HasMaxLength(5000);

            entity.Property(m => m.VideoUrl)
                .HasMaxLength(500);

            // Relación con Course
            entity.HasOne(m => m.Course)
                .WithMany(c => c.Modules)
                .HasForeignKey(m => m.CourseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ============================================
        // CONFIGURACIÓN: COURSE ENROLLMENT
        // ============================================

        modelBuilder.Entity<CourseEnrollment>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Progress)
                .HasDefaultValue(0);

            entity.Property(e => e.IsCompleted)
                .HasDefaultValue(false);

            // Relación con Course
            entity.HasOne(e => e.Course)
                .WithMany(c => c.Enrollments)
                .HasForeignKey(e => e.CourseId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relación con Patient
            entity.HasOne(e => e.Patient)
                .WithMany(p => p.CourseEnrollments)
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            // Un paciente solo puede inscribirse una vez en un curso
            entity.HasIndex(e => new { e.CourseId, e.PatientId })
                .IsUnique();
        });

        // ============================================
        // CONFIGURACIÓN: PAYMENT
        // ============================================

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(p => p.Id);

            entity.Property(p => p.Amount)
                .HasColumnType("decimal(10,2)");

            entity.Property(p => p.Currency)
                .HasMaxLength(3)
                .HasDefaultValue("EUR");

            entity.Property(p => p.Status)
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(p => p.PaymentMethod)
                .HasMaxLength(50);

            entity.Property(p => p.TransactionId)
                .HasMaxLength(255);

            entity.Property(p => p.PaymentType)
                .IsRequired()
                .HasMaxLength(20);

            // Relación con Patient
            entity.HasOne(p => p.Patient)
                .WithMany(pt => pt.Payments)
                .HasForeignKey(p => p.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relación con Doctor
            entity.HasOne(p => p.Doctor)
                .WithMany(d => d.Payments)
                .HasForeignKey(p => p.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relación opcional con Appointment
            entity.HasOne(p => p.Appointment)
                .WithMany()
                .HasForeignKey(p => p.AppointmentId)
                .OnDelete(DeleteBehavior.SetNull);

            // Relación opcional con Course
            entity.HasOne(p => p.Course)
                .WithMany()
                .HasForeignKey(p => p.CourseId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ============================================
        // CONFIGURACIÓN: REVIEW
        // ============================================

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(r => r.Id);

            entity.Property(r => r.Rating)
                .IsRequired();

            entity.Property(r => r.Comment)
                .HasMaxLength(1000);

            // Relación con Doctor
            entity.HasOne(r => r.Doctor)
                .WithMany(d => d.Reviews)
                .HasForeignKey(r => r.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relación con Patient
            entity.HasOne(r => r.Patient)
                .WithMany(p => p.Reviews)
                .HasForeignKey(r => r.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relación opcional con Appointment
            entity.HasOne(r => r.Appointment)
                .WithMany()
                .HasForeignKey(r => r.AppointmentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ============================================
        // CONFIGURACIÓN: DOCTOR AVAILABILITY
        // ============================================

        modelBuilder.Entity<DoctorAvailability>(entity =>
        {
            entity.HasKey(a => a.Id);

            entity.Property(a => a.DayOfWeek)
                .IsRequired();

            entity.Property(a => a.IsAvailable)
                .HasDefaultValue(true);

            // Relación con Doctor
            entity.HasOne(a => a.Doctor)
                .WithMany(d => d.Availabilities)
                .HasForeignKey(a => a.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ============================================
        // CONFIGURACIÓN: NOTIFICATION
        // ============================================

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(n => n.Id);

            entity.Property(n => n.Title)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(n => n.Message)
                .IsRequired()
                .HasMaxLength(1000);

            entity.Property(n => n.Type)
                .HasMaxLength(50);

            entity.Property(n => n.IsRead)
                .HasDefaultValue(false);

            // Relación con User
            entity.HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(n => n.IsRead);
            entity.HasIndex(n => n.CreatedAt);
        });

        
        
    }

   

}