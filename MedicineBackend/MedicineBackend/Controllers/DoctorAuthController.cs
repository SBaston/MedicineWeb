// ═══════════════════════════════════════════════════════════════
// Backend/Controllers/DoctorAuthController.cs
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.DTOs; // ← IMPORTANTE: Importar DTOs
using MedicineBackend.Services.Interfaces;
using MedicineBackend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace MedicineBackend.Controllers
{
    [ApiController]
    [Route("api/doctors")]
    public class DoctorAuthController : ControllerBase
    {
        private readonly IDoctorService _doctorService;
        private readonly IOcrService _ocrService;
        private readonly IFileStorageService _fileStorage;
        private readonly ILogger<DoctorAuthController> _logger;

        public DoctorAuthController(
            IDoctorService doctorService,
            IOcrService ocrService,
            IFileStorageService fileStorage,
            ILogger<DoctorAuthController> logger)
        {
            _doctorService = doctorService;
            _ocrService = ocrService;
            _fileStorage = fileStorage;
            _logger = logger;
        }

        // ═══════════════════════════════════════════════════════════
        // POST /api/doctors/register
        // Registro completo de doctor con documentos
        // ═══════════════════════════════════════════════════════════
        [HttpPost("register")]
        [ProducesResponseType(typeof(DoctorRegistrationResponse), 201)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> Register([FromBody] DoctorRegistrationDto dto)
        {
            try
            {
                // 1. Validar que el email no esté registrado
                if (await _doctorService.EmailExistsAsync(dto.Email))
                {
                    return BadRequest(new { message = "El email ya está registrado" });
                }

                // 2. Procesar imagen del carnet con OCR
                var ocrResult = await _ocrService.ProcessImageAsync(dto.ProfessionalLicenseImage);

                if (!ocrResult.Success)
                {
                    return BadRequest(new
                    {
                        message = "No se pudo procesar la imagen del carnet de colegiado",
                        errors = ocrResult.Errors
                    });
                }

                // 3. Validar número de colegiado extraído
                var isLicenseValid = await _ocrService.ValidateProfessionalLicenseAsync(
                    ocrResult.ProfessionalLicense ?? "",
                    dto.ProfessionalLicense
                );

                if (!isLicenseValid && ocrResult.Confidence > 0.5m)
                {
                    _logger.LogWarning(
                        $"Número de colegiado no coincide. Proporcionado: {dto.ProfessionalLicense}, " +
                        $"Extraído: {ocrResult.ProfessionalLicense}"
                    );

                    return BadRequest(new
                    {
                        message = "El número de colegiado no coincide con el documento",
                        provided = dto.ProfessionalLicense,
                        extracted = ocrResult.ProfessionalLicense
                    });
                }

                // 4. Guardar imágenes en almacenamiento
                var licenseImageUrl = await _fileStorage.SaveImageAsync(
                    dto.ProfessionalLicenseImage,
                    "professional-licenses",
                    $"{dto.ProfessionalLicense}_{Guid.NewGuid()}"
                );

                string? idDocumentUrl = null;
                if (!string.IsNullOrEmpty(dto.IdDocumentImage))
                {
                    idDocumentUrl = await _fileStorage.SaveImageAsync(
                        dto.IdDocumentImage,
                        "id-documents",
                        $"{dto.ProfessionalLicense}_id_{Guid.NewGuid()}"
                    );
                }

                string? degreeUrl = null;
                if (!string.IsNullOrEmpty(dto.DegreeImage))
                {
                    degreeUrl = await _fileStorage.SaveImageAsync(
                        dto.DegreeImage,
                        "degrees",
                        $"{dto.ProfessionalLicense}_degree_{Guid.NewGuid()}"
                    );
                }

                // 5. Crear doctor en la base de datos
                var doctor = await _doctorService.RegisterAsync(new CreateDoctorRequest
                {
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    Email = dto.Email,
                    Password = dto.Password,
                    ProfessionalLicense = dto.ProfessionalLicense,
                    SpecialtyIds = dto.SpecialtyIds, // ← Lista de IDs
                    YearsOfExperience = dto.YearsOfExperience,
                    PricePerSession = dto.PricePerSession,
                    Description = dto.Description,
                    PhoneNumber = dto.PhoneNumber,
                    ProfessionalLicenseImageUrl = licenseImageUrl,
                    IdDocumentImageUrl = idDocumentUrl,
                    DegreeImageUrl = degreeUrl,
                    OcrData = System.Text.Json.JsonSerializer.Serialize(ocrResult),
                    IsDocumentVerified = isLicenseValid && ocrResult.Confidence > 0.7m
                });

                _logger.LogInformation($"Doctor registrado: {dto.Email} (ID: {doctor.Id})");

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = doctor.Id },
                    new DoctorRegistrationResponse
                    {
                        Id = doctor.Id,
                        Email = dto.Email,
                        FullName = $"{doctor.FirstName} {doctor.LastName}",
                        Status = doctor.Status.ToString(),
                        Message = "Registro exitoso. Tu solicitud será revisada por un administrador en las próximas 24-48 horas.",
                        OcrConfidence = ocrResult.Confidence,
                        DocumentVerified = doctor.IsDocumentVerified
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error durante el registro de doctor");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        // ═══════════════════════════════════════════════════════════
        // POST /api/doctors/validate-document
        // Validar documento antes de enviar el registro completo
        // ═══════════════════════════════════════════════════════════
        [HttpPost("validate-document")]
        [ProducesResponseType(typeof(OcrResultDto), 200)]
        public async Task<IActionResult> ValidateDocument([FromBody] ValidateDocumentRequest request)
        {
            try
            {
                var ocrResult = await _ocrService.ProcessImageAsync(request.ImageBase64);

                return Ok(new
                {
                    success = ocrResult.Success,
                    extractedLicense = ocrResult.ProfessionalLicense,
                    extractedName = ocrResult.FullName,
                    extractedSpecialty = ocrResult.Specialty,
                    confidence = ocrResult.Confidence,
                    isValid = ocrResult.Confidence >= 0.5m,
                    message = ocrResult.Confidence >= 0.7m
                        ? "Documento validado correctamente"
                        : ocrResult.Confidence >= 0.5m
                            ? "Documento detectado con baja confianza. Verifica que la imagen sea clara."
                            : "No se pudo leer el documento. Asegúrate de que la imagen sea clara y esté bien iluminada."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validando documento");
                return BadRequest(new { message = "Error procesando el documento" });
            }
        }

        // ═══════════════════════════════════════════════════════════
        // GET /api/doctors/{id}
        // Obtener información de un doctor
        // ═══════════════════════════════════════════════════════════
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(DoctorDto), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetById(int id)
        {
            var doctor = await _doctorService.GetDoctorByIdAsync(id);
            if (doctor == null)
                return NotFound(new { message = "Doctor no encontrado" });

            return Ok(doctor);
        }
    }
}