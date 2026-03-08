// ═══════════════════════════════════════════════════════════════
// Backend/Services/LocalFileStorageService.cs
// ═══════════════════════════════════════════════════════════════

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace MedicineBackend.Services
{
    public class LocalFileStorageService : IFileStorageService
    {
        private readonly string _basePath;
        private readonly ILogger<LocalFileStorageService> _logger;
        private readonly IConfiguration _configuration;

        public LocalFileStorageService(
            IConfiguration configuration,
            ILogger<LocalFileStorageService> logger)
        {
            _configuration = configuration;
            _logger = logger;
            _basePath = configuration["FileStorage:BasePath"] ?? "./uploads";

            // Crear directorio base si no existe
            if (!Directory.Exists(_basePath))
            {
                Directory.CreateDirectory(_basePath);
                _logger.LogInformation($"📁 Directorio de uploads creado: {_basePath}");
            }
        }

        public async Task<string> SaveImageAsync(string base64Image, string folder, string filename)
        {
            try
            {
                // Eliminar prefijo "data:image/...;base64," si existe
                var base64Data = base64Image.Contains(",")
                    ? base64Image.Split(',')[1]
                    : base64Image;

                var imageBytes = Convert.FromBase64String(base64Data);

                // Crear carpeta si no existe
                var folderPath = Path.Combine(_basePath, folder);
                if (!Directory.Exists(folderPath))
                {
                    Directory.CreateDirectory(folderPath);
                }

                // Generar nombre de archivo único
                var extension = ".jpg";
                var fullFilename = $"{filename}{extension}";
                var filePath = Path.Combine(folderPath, fullFilename);

                // Optimizar imagen antes de guardar
                using (var ms = new MemoryStream(imageBytes))
                using (var image = await Image.LoadAsync(ms))
                {
                    // Redimensionar si es muy grande (max 1920px)
                    if (image.Width > 1920 || image.Height > 1920)
                    {
                        image.Mutate(x => x.Resize(new ResizeOptions
                        {
                            Mode = ResizeMode.Max,
                            Size = new Size(1920, 1920)
                        }));
                    }

                    // Guardar como JPEG con calidad 85%
                    await image.SaveAsJpegAsync(filePath, new SixLabors.ImageSharp.Formats.Jpeg.JpegEncoder
                    {
                        Quality = 85
                    });
                }

                // Retornar URL relativa
                var relativeUrl = $"/uploads/{folder}/{fullFilename}";
                _logger.LogInformation($"✅ Imagen guardada: {relativeUrl}");

                return relativeUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error guardando imagen");
                throw new InvalidOperationException("Error al guardar la imagen", ex);
            }
        }

        public Task<bool> DeleteImageAsync(string imageUrl)
        {
            try
            {
                var filePath = Path.Combine(_basePath, imageUrl.TrimStart('/').Replace("uploads/", ""));

                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                    _logger.LogInformation($"🗑️ Imagen eliminada: {imageUrl}");
                    return Task.FromResult(true);
                }

                return Task.FromResult(false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Error eliminando imagen: {imageUrl}");
                return Task.FromResult(false);
            }
        }

        public async Task<byte[]> GetImageAsync(string imageUrl)
        {
            var filePath = Path.Combine(_basePath, imageUrl.TrimStart('/').Replace("uploads/", ""));

            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException("Imagen no encontrada", imageUrl);
            }

            return await File.ReadAllBytesAsync(filePath);
        }
    }
}