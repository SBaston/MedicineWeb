// ═══════════════════════════════════════════════════════════════
// Backend/Controllers/DoctorAuthController.cs
// ✅ ACTUALIZADO: Con captura de IP, UserAgent, términos y redes sociales
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.DTOs.Doctor;
using MedicineBackend.Services;
using MedicineBackend.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace MedicineBackend.Controllers
{
    [ApiController]
    [Route("api/doctors")]
    public class DoctorAuthController : ControllerBase
    {
        private readonly IDoctorService _doctorService;
        private readonly IFileStorageService _fileStorage;
        private readonly ILogger<DoctorAuthController> _logger;

        public DoctorAuthController(
            IDoctorService doctorService,
            IFileStorageService fileStorage,
            ILogger<DoctorAuthController> logger)
        {
            _doctorService = doctorService;
            _fileStorage = fileStorage;
            _logger = logger;
        }

        // ═══════════════════════════════════════════════════════════
        // POST /api/doctors/register
        // Registro completo de doctor con términos y redes sociales
        // ═══════════════════════════════════════════════════════════
        [HttpPost("register")]
        [RequestSizeLimit(60_000_000)] // 60MB para 6 imágenes
        [ProducesResponseType(201)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> Register([FromForm] DoctorRegisterDto dto)
        {
            try
            {
                // ✅ NUEVO: Capturar IP y UserAgent
                var ipAddress = GetClientIp();
                var userAgent = Request.Headers["User-Agent"].ToString();

                // 1. Validar email con lógica de re-registro
                var emailCheck = await _doctorService.CheckEmailAvailabilityAsync(dto.Email);
                if (!emailCheck.IsAvailable)
                {
                    return BadRequest(new { message = emailCheck.Message });
                }

                // 2. Validar que el número de colegiado no esté registrado
                if (await _doctorService.ProfessionalLicenseExistsAsync(dto.ProfessionalLicense))
                {
                    return BadRequest(new { message = "El número de colegiado ya está registrado" });
                }

                // 3. Validar imágenes OBLIGATORIAS (6 obligatorias)
                if (dto.ProfessionalLicenseFront == null)
                {
                    return BadRequest(new { message = "La imagen frontal del carnet de colegiado es obligatoria" });
                }

                if (dto.ProfessionalLicenseBack == null)
                {
                    return BadRequest(new { message = "La imagen trasera del carnet de colegiado es obligatoria" });
                }

                if (dto.IdDocumentFront == null)
                {
                    return BadRequest(new { message = "La imagen frontal del DNI es obligatoria" });
                }

                if (dto.IdDocumentBack == null)
                {
                    return BadRequest(new { message = "La imagen trasera del DNI es obligatoria" });
                }

                if (dto.SpecialtyDegrees == null || dto.SpecialtyDegrees.Count == 0)
                {
                    return BadRequest(new { message = "Debes subir al menos un título de especialidad" });
                }

                if (dto.UniversityDegree == null)
                {
                    return BadRequest(new { message = "El título universitario es obligatorio" });
                }

                // 4. Guardar imágenes en almacenamiento
                var licensePrefix = $"{dto.ProfessionalLicense}_{Guid.NewGuid()}";

                // OBLIGATORIAS: Carnet de colegiado (delante y atrás)
                var licenseFrontUrl = await _fileStorage.SaveFileAsync(
                    dto.ProfessionalLicenseFront,
                    "doctors/documents",
                    $"{licensePrefix}_license_front"
                );

                var licenseBackUrl = await _fileStorage.SaveFileAsync(
                    dto.ProfessionalLicenseBack,
                    "doctors/documents",
                    $"{licensePrefix}_license_back"
                );

                // OBLIGATORIAS: DNI (delante y atrás)
                var idFrontUrl = await _fileStorage.SaveFileAsync(
                    dto.IdDocumentFront,
                    "doctors/documents",
                    $"{licensePrefix}_id_front"
                );

                var idBackUrl = await _fileStorage.SaveFileAsync(
                    dto.IdDocumentBack,
                    "doctors/documents",
                    $"{licensePrefix}_id_back"
                );

                // OBLIGATORIAS: Títulos de especialidad (uno por especialidad)
                var specialtyDegreeUrls = new List<string>();
                for (int i = 0; i < dto.SpecialtyDegrees.Count; i++)
                {
                    var url = await _fileStorage.SaveFileAsync(
                        dto.SpecialtyDegrees[i],
                        "doctors/documents",
                        $"{licensePrefix}_specialty_degree_{i + 1}"
                    );
                    specialtyDegreeUrls.Add(url);
                }

                var universityDegreeUrl = await _fileStorage.SaveFileAsync(
                    dto.UniversityDegree,
                    "doctors/documents",
                    $"{licensePrefix}_university_degree"
                );

                // OPCIONAL: Foto de perfil
                string? profilePictureUrl = null;
                if (dto.ProfilePicture != null)
                {
                    profilePictureUrl = await _fileStorage.SaveFileAsync(
                        dto.ProfilePicture,
                        "doctors/profiles",
                        $"{licensePrefix}_profile"
                    );
                }

                // 5. Crear doctor en la base de datos
                // ✅ ACTUALIZADO: Pasar IP, UserAgent, términos y redes sociales
                var doctor = await _doctorService.RegisterAsync(
                    new CreateDoctorRequest
                    {
                        FirstName = dto.FirstName,
                        LastName = dto.LastName,
                        Email = dto.Email,
                        Password = dto.Password,
                        ProfessionalLicense = dto.ProfessionalLicense,
                        SpecialtyIds = dto.SpecialtyIds,
                        YearsOfExperience = dto.YearsOfExperience,
                        PricePerSession = dto.PricePerSession,
                        Description = dto.Description,
                        PhoneNumber = dto.PhoneNumber,
                        ProfilePictureUrl = profilePictureUrl,

                        // 6 IMÁGENES OBLIGATORIAS
                        ProfessionalLicenseFrontImageUrl = licenseFrontUrl,
                        ProfessionalLicenseBackImageUrl = licenseBackUrl,
                        IdDocumentFrontImageUrl = idFrontUrl,
                        IdDocumentBackImageUrl = idBackUrl,
                        SpecialtyDegreeImageUrls = specialtyDegreeUrls,
                        UniversityDegreeImageUrl = universityDegreeUrl,

                        // ✅ NUEVO: Términos y redes sociales
                        AcceptContentTerms = dto.AcceptContentTerms,
                        TermsVersion = dto.TermsVersion,
                        SocialMediaLinks = dto.SocialMediaLinks
                    },
                    ipAddress,      // ✅ NUEVO
                    userAgent);     // ✅ NUEVO

                _logger.LogInformation(
                    "✅ Doctor registrado: {Email} (ID: {Id}) - Estado: {Status} - IP: {IP}",
                    dto.Email, doctor.Id, doctor.Status, ipAddress
                );

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = doctor.Id },
                    new
                    {
                        id = doctor.Id,
                        email = dto.Email,
                        fullName = $"{doctor.FirstName} {doctor.LastName}",
                        status = doctor.Status.ToString(),
                        message = "✅ Registro exitoso. Tu solicitud será revisada por un administrador en las próximas 24-48 horas. " +
                                  "Recibirás un email cuando sea aprobada y podrás acceder a la plataforma.",
                        documentsUploaded = new
                        {
                            professionalLicenseFront = !string.IsNullOrEmpty(licenseFrontUrl),
                            professionalLicenseBack = !string.IsNullOrEmpty(licenseBackUrl),
                            idDocumentFront = !string.IsNullOrEmpty(idFrontUrl),
                            idDocumentBack = !string.IsNullOrEmpty(idBackUrl),
                            specialtyDegrees = specialtyDegreeUrls.Count,
                            universityDegree = !string.IsNullOrEmpty(universityDegreeUrl)
                        },
                        contentTermsAccepted = dto.AcceptContentTerms,
                        socialMediaLinksCount = dto.SocialMediaLinks?.Count ?? 0
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error durante el registro de doctor");
                return StatusCode(500, new { message = "Error interno del servidor", details = ex.Message });
            }
        }

        // ═══════════════════════════════════════════════════════════
        // GET /api/doctors/{id}
        // Obtener información de un doctor
        // ═══════════════════════════════════════════════════════════
        [HttpGet("{id}")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetById(int id)
        {
            var doctor = await _doctorService.GetDoctorByIdAsync(id);
            if (doctor == null)
                return NotFound(new { message = "Doctor no encontrado" });

            return Ok(doctor);
        }

        // ═══════════════════════════════════════════════════════════
        // GET /api/doctors
        // Listar todos los doctores activos
        // ═══════════════════════════════════════════════════════════
        [HttpGet]
        [ProducesResponseType(200)]
        public async Task<IActionResult> GetAll()
        {
            var doctors = await _doctorService.GetAllDoctorsAsync();
            return Ok(doctors);
        }

        // ═══════════════════════════════════════════════════════════
        // ✅ NUEVO: Helper para obtener IP del cliente
        // ═══════════════════════════════════════════════════════════
        private string GetClientIp()
        {
            // Intentar obtener IP real detrás de proxy/load balancer
            var forwardedFor = Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
            {
                // X-Forwarded-For puede contener múltiples IPs: "client, proxy1, proxy2"
                // La primera es la IP original del cliente
                return forwardedFor.Split(',')[0].Trim();
            }

            // Si no hay proxy, obtener IP directa
            var remoteIp = HttpContext.Connection.RemoteIpAddress?.ToString();
            return remoteIp ?? "unknown";
        }
    }
}