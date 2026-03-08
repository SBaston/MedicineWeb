using MedicineBackend.DTOs;
public interface IOcrService
{
    /// <summary>
    /// Procesa una imagen y extrae texto mediante OCR
    /// </summary>
    Task<OcrResultDto> ProcessImageAsync(string base64Image);

    /// <summary>
    /// Valida que el número de colegiado extraído coincida con el proporcionado
    /// </summary>
    Task<bool> ValidateProfessionalLicenseAsync(string extractedLicense, string providedLicense);
}