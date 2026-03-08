// ═══════════════════════════════════════════════════════════════
// Backend/Services/IFileStorageService.cs
// ═══════════════════════════════════════════════════════════════

namespace MedicineBackend.Services
{
    public interface IFileStorageService
    {
        /// <summary>
        /// Guarda una imagen en Base64 y retorna la URL
        /// </summary>
        Task<string> SaveImageAsync(string base64Image, string folder, string filename);

        /// <summary>
        /// Elimina una imagen por su URL
        /// </summary>
        Task<bool> DeleteImageAsync(string imageUrl);

        /// <summary>
        /// Obtiene una imagen por su URL
        /// </summary>
        Task<byte[]> GetImageAsync(string imageUrl);
    }
}