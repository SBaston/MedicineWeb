using Microsoft.AspNetCore.Http;

namespace MedicineBackend.DTOs;

/// <summary>
/// Wrapper para subida de archivos — requerido por Swashbuckle 10 con IFormFile
/// </summary>
public class FileUploadRequest
{
    public IFormFile File { get; set; } = null!;
}
