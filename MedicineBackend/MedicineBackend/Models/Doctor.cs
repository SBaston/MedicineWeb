using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicineBackend.Models;

/// <summary>
/// Estado de verificación del profesional en la plataforma.
/// Gestionado exclusivamente por el admin.
/// </summary>
public enum DoctorStatus
{
    PendingReview = 0,  // Recién registrado, esperando revisión del admin
    Active = 1,  // Verificado y activo, puede recibir pacientes
    Rejected = 2,  // Rechazado por el admin (con motivo)
    Suspended = 3,  // Suspendido temporalmente
    Deleted = 4,  // Baja lógica — datos conservados por RGPD
}

/// <summary>
/// Entidad que representa a un médico en la plataforma.
/// Contiene información profesional, especialidades, disponibilidad, etc.
/// </summary>
public class Doctor
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>Relación con User (FK)</summary>
    [Required]
    public int UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    /// <summary>
    /// Número de colegiado/licencia profesional — ÚNICO en la base de datos
    /// ✅ SIN LÍMITE DE CARACTERES - puede ser alfanumérico y de longitud variable
    /// </summary>
    [Required]
    [MaxLength(200)]  // ✅ Aumentado de 50 a 200 para permitir formatos largos
    public string ProfessionalLicense { get; set; } = string.Empty;

    /// <summary>Descripción profesional del médico. Se mostrará en su perfil público.</summary>
    [MaxLength(2000)]
    public string? Description { get; set; }

    /// <summary>URL de la foto de perfil</summary>
    [MaxLength(500)]
    public string? ProfilePictureUrl { get; set; }

    /// <summary>Teléfono de contacto</summary>
    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    /// <summary>Años de experiencia</summary>
    public int? YearsOfExperience { get; set; }

    /// <summary>Precio por sesión en euros</summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal PricePerSession { get; set; }

    /// <summary>Total de ganancias acumuladas</summary>
    [Column(TypeName = "decimal(12,2)")]
    public decimal TotalEarnings { get; set; } = 0;

    /// <summary>Calificación promedio (1-5 estrellas)</summary>
    [Column(TypeName = "decimal(3,2)")]
    public decimal AverageRating { get; set; } = 0;

    /// <summary>Total de valoraciones recibidas</summary>
    public int TotalReviews { get; set; } = 0;

    // ══════════════════════════════════════════════════════════════
    // SISTEMA DE ESTADOS (reemplaza IsVerified)
    // ══════════════════════════════════════════════════════════════

    /// <summary>
    /// Estado del profesional en la plataforma, gestionado por el admin.
    /// Los nuevos registros entran como PendingReview automáticamente.
    /// </summary>
    public DoctorStatus Status { get; set; } = DoctorStatus.PendingReview;

    /// <summary>
    /// Motivo del último cambio de estado (rechazo, suspensión...).
    /// Se comunica al profesional por email.
    /// </summary>
    [MaxLength(1000)]
    public string? StatusReason { get; set; }

    /// <summary>ID del admin que tomó la última decisión sobre este profesional</summary>
    public int? ReviewedByAdminId { get; set; }

    /// <summary>Fecha en que el admin tomó la última decisión</summary>
    public DateTime? ReviewedAt { get; set; }

    // ══════════════════════════════════════════════════════════════
    // DOCUMENTACIÓN - 6 IMÁGENES NUEVAS (SIN OCR)
    // ══════════════════════════════════════════════════════════════

    /// <summary>Carnet de colegiado - CARA DELANTERA (OBLIGATORIO)</summary>
    [MaxLength(500)]
    public string? ProfessionalLicenseFrontImageUrl { get; set; }

    /// <summary>Carnet de colegiado - CARA TRASERA (OBLIGATORIO)</summary>
    [MaxLength(500)]
    public string? ProfessionalLicenseBackImageUrl { get; set; }

    /// <summary>DNI/Pasaporte - CARA DELANTERA (OPCIONAL)</summary>
    [MaxLength(500)]
    public string? IdDocumentFrontImageUrl { get; set; }

    /// <summary>DNI/Pasaporte - CARA TRASERA (OPCIONAL)</summary>
    [MaxLength(500)]
    public string? IdDocumentBackImageUrl { get; set; }

    /// <summary>Título de especialidad (OPCIONAL)</summary>
    [MaxLength(500)]
    public string? SpecialtyDegreeImageUrl { get; set; }

    /// <summary>Título universitario (OPCIONAL)</summary>
    [MaxLength(500)]
    public string? UniversityDegreeImageUrl { get; set; }

    // ══════════════════════════════════════════════════════════════
    // CAMPOS ANTIGUOS - MANTENER TEMPORALMENTE PARA COMPATIBILIDAD
    // Se eliminarán en una migración futura una vez migrados los datos
    // ══════════════════════════════════════════════════════════════

    /// <summary>URL de la imagen del carnet de colegiado (DEPRECADO - usar ProfessionalLicenseFrontImageUrl)</summary>
    [Obsolete("Usar ProfessionalLicenseFrontImageUrl y ProfessionalLicenseBackImageUrl en su lugar")]
    [MaxLength(500)]
    public string? ProfessionalLicenseImageUrl { get; set; }

    /// <summary>URL del documento de identidad (DEPRECADO - usar IdDocumentFrontImageUrl)</summary>
    [Obsolete("Usar IdDocumentFrontImageUrl y IdDocumentBackImageUrl en su lugar")]
    [MaxLength(500)]
    public string? IdDocumentImageUrl { get; set; }

    /// <summary>URL del título universitario (DEPRECADO - usar UniversityDegreeImageUrl)</summary>
    [Obsolete("Usar UniversityDegreeImageUrl en su lugar")]
    [MaxLength(500)]
    public string? DegreeImageUrl { get; set; }

    /// <summary>Datos extraídos del OCR (DEPRECADO - ya no usamos OCR)</summary>
    [Obsolete("Ya no se usa OCR - eliminar en próxima migración")]
    public string? OcrData { get; set; }

    /// <summary>Si el documento ha sido verificado automáticamente (DEPRECADO - verificación manual por admin)</summary>
    [Obsolete("Ya no se usa verificación automática - eliminar en próxima migración")]
    public bool IsDocumentVerified { get; set; }

    // ══════════════════════════════════════════════════════════════
    // SOFT DELETE — RGPD
    // ══════════════════════════════════════════════════════════════

    /// <summary>
    /// Fecha de baja lógica. El profesional pierde el acceso pero sus datos
    /// históricos (citas, pagos, reseñas) se conservan por obligación legal:
    ///   · Ley General Tributaria: mínimo 5 años para datos fiscales
    ///   · Ley de Autonomía del Paciente: mínimo 5 años para historial médico
    /// NUNCA ejecutar DELETE físico sobre este registro.
    /// </summary>
    public DateTime? DeletedAt { get; set; }

    [MaxLength(1000)]
    public string? DeletedReason { get; set; }

    public int? DeletedByAdminId { get; set; }

    // ══════════════════════════════════════════════════════════════
    // OTROS CAMPOS
    // ══════════════════════════════════════════════════════════════

    /// <summary>Indica si el doctor acepta nuevos pacientes</summary>
    public bool IsAcceptingPatients { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // ══════════════════════════════════════════════════════════════
    // RELACIONES
    // ══════════════════════════════════════════════════════════════

    [ForeignKey("UserId")]
    public User User { get; set; } = null!;

    public ICollection<Specialty> Specialties { get; set; } = new List<Specialty>();
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public ICollection<SocialMediaVideo> SocialMediaVideos { get; set; } = new List<SocialMediaVideo>();
    public ICollection<Course> Courses { get; set; } = new List<Course>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<DoctorAvailability> Availabilities { get; set; } = new List<DoctorAvailability>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();

    // ══════════════════════════════════════════════════════════════
    // PROPIEDADES CALCULADAS
    // ══════════════════════════════════════════════════════════════

    [NotMapped]
    public string FullName => $"{FirstName} {LastName}";

    /// <summary>True solo si está activo Y no ha sido dado de baja</summary>
    [NotMapped]
    public bool IsActive => Status == DoctorStatus.Active && DeletedAt == null;

    /// <summary>True si está esperando revisión del admin</summary>
    [NotMapped]
    public bool IsPending => Status == DoctorStatus.PendingReview && DeletedAt == null;

    /// <summary>True si ha sido dado de baja lógica</summary>
    [NotMapped]
    public bool IsDeleted => DeletedAt != null;

    /// <summary>
    /// Compatibilidad con código existente que usara IsVerified.
    /// En código nuevo usar Status directamente.
    /// </summary>
    [NotMapped]
    public bool IsVerified => Status == DoctorStatus.Active;
}