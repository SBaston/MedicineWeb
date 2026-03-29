using MedicineBackend.Data;
using MedicineBackend.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;
using System.Text.RegularExpressions;
using Tesseract;

namespace MedicineBackend.Services
{
    public class OcrService : IOcrService
    {
        private readonly ILogger<OcrService> _logger;
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _dbContext;
        private readonly IMemoryCache _cache;
        private readonly string _tessDataPath;

        private const string CACHE_KEY = "ocr_specialties";
        private const int CACHE_HOURS = 24;

        public OcrService(
            ILogger<OcrService> logger,
            IConfiguration configuration,
            AppDbContext dbContext,
            IMemoryCache cache)
        {
            _logger = logger;
            _configuration = configuration;
            _dbContext = dbContext;
            _cache = cache;
            _tessDataPath = configuration["Ocr:TessDataPath"] ?? "./tessdata";
        }

        public async Task<OcrResultDto> ProcessImageAsync(string base64Image)
        {
            //Cargar librerías manualmente ANTES de usar Tesseract
            NativeLibraryLoader.EnsureLoaded();
            try
            {
                var base64Data = base64Image.Contains(",")
                    ? base64Image.Split(',')[1]
                    : base64Image;

                var imageBytes = Convert.FromBase64String(base64Data);

                using var ms = new MemoryStream(imageBytes);
                using var img = Image.Load<Rgba32>(ms);

                // Preprocesar imagen
                img.Mutate(x => x
                    .Grayscale()
                    .Contrast(1.5f)
                    .BinaryThreshold(0.5f));

                var tempPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.png");
                await img.SaveAsPngAsync(tempPath);

                // OCR con Tesseract
                using var engine = new TesseractEngine(_tessDataPath, "spa+eng", EngineMode.Default);
                using var page = engine.Process(Pix.LoadFromFile(tempPath));

                var extractedText = page.GetText();
                var confidence = page.GetMeanConfidence();

                File.Delete(tempPath);

                var result = new OcrResultDto
                {
                    Success = true,
                    ExtractedText = extractedText,
                    Confidence = (decimal)(float)confidence,
                    ProfessionalLicense = ExtractProfessionalLicense(extractedText),
                    FullName = ExtractFullName(extractedText),
                    Specialty = await ExtractSpecialtyAsync(extractedText) // DINÁMICO
                };

                _logger.LogInformation($"OCR procesado: confianza {confidence:P}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en OCR");
                return new OcrResultDto
                {
                    Success = false,
                    Errors = new List<string> { "Error procesando imagen" }
                };
            }
        }

        public Task<bool> ValidateProfessionalLicenseAsync(string extracted, string provided)
        {
            if (string.IsNullOrEmpty(extracted) || string.IsNullOrEmpty(provided))
                return Task.FromResult(false);

            var normExtracted = Regex.Replace(extracted, @"[^\d]", "");
            var normProvided = Regex.Replace(provided, @"[^\d]", "");

            return Task.FromResult(normExtracted == normProvided);
        }

        // ═══════════════════════════════════════════════════════════
        // EXTRACCIÓN DE ESPECIALIDAD - 100% DINÁMICO
        // ═══════════════════════════════════════════════════════════
        private async Task<string?> ExtractSpecialtyAsync(string text)
        {
            try
            {
                // Obtener especialidades de BD (con caché)
                var specialties = await _cache.GetOrCreateAsync(
                    CACHE_KEY,
                    async entry =>
                    {
                        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(CACHE_HOURS);

                        var list = await _dbContext.Specialties
                            .Where(s => s.IsActive)
                            .Select(s => s.Name)
                            .ToListAsync();

                        _logger.LogInformation($"📚 Cargadas {list.Count} especialidades en caché");
                        return list;
                    }
                );

                if (specialties == null || !specialties.Any())
                {
                    _logger.LogWarning("⚠️ Sin especialidades en BD para OCR");
                    return null;
                }

                // Búsqueda exacta
                foreach (var specialty in specialties)
                {
                    if (text.Contains(specialty, StringComparison.OrdinalIgnoreCase))
                    {
                        _logger.LogInformation($"✅ Detectada: {specialty}");
                        return specialty;
                    }
                }

                // Búsqueda parcial (para especialidades largas)
                foreach (var specialty in specialties.Where(s => s.Length > 8))
                {
                    var prefix = specialty.Substring(0, Math.Min(6, specialty.Length));
                    if (text.Contains(prefix, StringComparison.OrdinalIgnoreCase))
                    {
                        _logger.LogInformation($"✅ Detectada (parcial): {specialty}");
                        return specialty;
                    }
                }

                _logger.LogInformation("ℹ️ Sin especialidad detectada");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error extrayendo especialidad");
                return null;
            }
        }

        private string? ExtractProfessionalLicense(string text)
        {
            var patterns = new[]
            {
                @"N[º°]?\s*:?\s*(\d{8,10})",
                @"Colegiado:?\s*(\d{8,10})",
                @"Número:?\s*(\d{8,10})",
                @"(\d{8,10})"
            };

            foreach (var pattern in patterns)
            {
                var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase);
                if (match.Success && match.Groups.Count > 1)
                {
                    return match.Groups[1].Value;
                }
            }
            return null;
        }

        private string? ExtractFullName(string text)
        {
            var match = Regex.Match(text, @"([A-ZÁÉÍÓÚÑ]+\s+[A-ZÁÉÍÓÚÑ\s]+)", RegexOptions.Multiline);
            return match.Success ? match.Value.Trim() : null;
        }
    }
}