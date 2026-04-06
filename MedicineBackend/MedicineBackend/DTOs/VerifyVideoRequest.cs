// ═══════════════════════════════════════════════════════════════
// DTOs/Admin/VerifyVideoRequest.cs
// ═══════════════════════════════════════════════════════════════

using System.ComponentModel.DataAnnotations;

namespace MedicineBackend.DTOs.Admin;

public class VerifyVideoRequest
{
    [Required(ErrorMessage = "IsVerified es obligatorio")]
    public bool IsVerified { get; set; }
}