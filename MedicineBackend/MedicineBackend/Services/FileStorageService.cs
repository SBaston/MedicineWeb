// ═══════════════════════════════════════════════════════════════
// Backend/Services/FileStorageService.cs
// ✅ ACTUALIZADO: Con SaveFileAsync para IFormFile
// ═══════════════════════════════════════════════════════════════

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace MedicineBackend.Services
{
    public class FileStorageService : IFileStorageService
    {
        private readonly string _basePath;
        private readonly ILogger<FileStorageService> _logger;
        private readonly IConfiguration _configuration;

        public FileStorageService(
            IConfiguration configuration,
            ILogger<FileStorageService> logger)
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
                // Detectar si el archivo es un PDF por su prefijo data URI
                var isPdf = base64Image.StartsWith("data:application/pdf");

                // Eliminar prefijo "data:...;base64," si existe
                var base64Data = base64Image.Contains(",")
                    ? base64Image.Split(',')[1]
                    : base64Image;

                var fileBytes = Convert.FromBase64String(base64Data);

                // Crear carpeta si no existe
                var folderPath = Path.Combine(_basePath, folder);
                if (!Directory.Exists(folderPath))
                {
                    Directory.CreateDirectory(folderPath);
                }

                string fullFilename;
                string filePath;
                string relativeUrl;

                if (isPdf)
                {
                    // PDF: guardar directamente sin pasar por ImageSharp
                    fullFilename = $"{filename}.pdf";
                    filePath = Path.Combine(folderPath, fullFilename);
                    await File.WriteAllBytesAsync(filePath, fileBytes);
                    relativeUrl = $"/uploads/{folder}/{fullFilename}";
                    _logger.LogInformation($"✅ PDF guardado: {relativeUrl} ({fileBytes.Length} bytes)");
                }
                else
                {
                    // Imagen: optimizar con ImageSharp antes de guardar
                    fullFilename = $"{filename}.jpg";
                    filePath = Path.Combine(folderPath, fullFilename);

                    using (var ms = new MemoryStream(fileBytes))
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

                    relativeUrl = $"/uploads/{folder}/{fullFilename}";
                    _logger.LogInformation($"✅ Imagen guardada: {relativeUrl}");
                }

                return relativeUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error guardando imagen desde Base64");
                throw new InvalidOperationException("Error al guardar la imagen", ex);
            }
        }

        /// <summary>
        /// ✅ NUEVO: Guarda un archivo IFormFile (para upload multipart/form-data)
        /// </summary>
        public async Task<string> SaveFileAsync(IFormFile file, string folder, string filename)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    throw new ArgumentException("El archivo está vacío");
                }

                // Crear carpeta si no existe
                var folderPath = Path.Combine(_basePath, folder);
                if (!Directory.Exists(folderPath))
                {
                    Directory.CreateDirectory(folderPath);
                }

                // Determinar extensión del archivo
                var extension = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? ".jpg";

                // Validar extensiones permitidas
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf" };
                if (!allowedExtensions.Contains(extension))
                {
                    throw new InvalidOperationException($"Extensión no permitida: {extension}");
                }

                // Generar nombre de archivo único
                var fullFilename = $"{filename}{extension}";
                var filePath = Path.Combine(folderPath, fullFilename);

                // Si es imagen, optimizar antes de guardar
                if (extension == ".jpg" || extension == ".jpeg" || extension == ".png" || extension == ".webp")
                {
                    using (var stream = file.OpenReadStream())
                    using (var image = await Image.LoadAsync(stream))
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
                }
                else
                {
                    // Para archivos no-imagen (como PDFs), guardar directamente
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }
                }

                // Retornar URL relativa
                var relativeUrl = $"/uploads/{folder}/{fullFilename}";
                _logger.LogInformation($"✅ Archivo guardado: {relativeUrl} ({file.Length} bytes)");
                return relativeUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error guardando archivo IFormFile");
                throw new InvalidOperationException("Error al guardar el archivo", ex);
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