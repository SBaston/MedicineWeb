// ═══════════════════════════════════════════════════════════════
// Controllers/PaymentController.cs
// Endpoints de pago con Stripe Checkout
// ═══════════════════════════════════════════════════════════════

using MedicineBackend.Data;
using MedicineBackend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MedicineBackend.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly AppDbContext _context;
    private readonly ILogger<PaymentController> _logger;

    public PaymentController(IPaymentService paymentService, AppDbContext context, ILogger<PaymentController> logger)
    {
        _paymentService = paymentService;
        _context        = context;
        _logger         = logger;
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/payments/appointment-checkout
    // Crea una sesión de Stripe para pagar una cita
    // ─────────────────────────────────────────────────────────────
    /// <summary>
    /// El paciente llama a este endpoint con el ID de la cita ya creada (en estado PendientePago).
    /// Devuelve la URL de Stripe a la que redirigir al usuario.
    /// </summary>
    [HttpPost("appointment-checkout")]
    [Authorize(Roles = "Patient")]
    public async Task<IActionResult> AppointmentCheckout([FromBody] AppointmentCheckoutRequest req)
    {
        try
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out var userId))
                return Unauthorized(new { message = "Token inválido" });

            var appointment = await _context.Appointments
                .Include(a => a.Doctor)
                .FirstOrDefaultAsync(a => a.Id == req.AppointmentId);

            if (appointment == null)
                return NotFound(new { message = "Cita no encontrada" });

            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
            if (patient == null || appointment.PatientId != patient.Id)
                return Forbid();

            var checkoutUrl = await _paymentService.CreateAppointmentCheckoutAsync(
                userId,
                appointment.DoctorId,
                appointment.Id,
                appointment.Price
            );

            return Ok(new { url = checkoutUrl });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creando checkout para cita {AppointmentId}", req.AppointmentId);
            return StatusCode(500, new { message = "Error al crear la sesión de pago", error = ex.Message });
        }
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/payments/course-checkout
    // Crea una sesión de Stripe para matricularse en un curso
    // ─────────────────────────────────────────────────────────────
    /// <summary>
    /// Paciente o Doctor llaman a este endpoint para pagar un curso.
    /// Devuelve la URL de Stripe. La matrícula se crea en el webhook.
    /// </summary>
    [HttpPost("course-checkout")]
    [Authorize(Roles = "Patient,Doctor")]
    public async Task<IActionResult> CourseCheckout([FromBody] CourseCheckoutRequest req)
    {
        try
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var role      = User.FindFirst(ClaimTypes.Role)?.Value;

            if (!int.TryParse(userIdStr, out var userId) || string.IsNullOrEmpty(role))
                return Unauthorized(new { message = "Token inválido" });

            var course = await _context.Courses.FindAsync(req.CourseId);
            if (course == null)
                return NotFound(new { message = "Curso no encontrado" });

            if (!course.IsPublished)
                return BadRequest(new { message = "El curso no está disponible" });

            // Un doctor no puede pagar su propio curso
            if (role == "Doctor")
            {
                var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
                if (doctor != null && course.DoctorId == doctor.Id)
                    return BadRequest(new { message = "No puedes matricularte en tu propio curso" });
            }

            var checkoutUrl = await _paymentService.CreateCourseCheckoutAsync(userId, role, req.CourseId, course.Price);
            return Ok(new { url = checkoutUrl });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creando checkout para curso {CourseId}", req.CourseId);
            return StatusCode(500, new { message = "Error al crear la sesión de pago", error = ex.Message });
        }
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/payments/webhook
    // Recibe eventos de Stripe (checkout.session.completed, etc.)
    // ─────────────────────────────────────────────────────────────
    /// <summary>
    /// IMPORTANTE: Este endpoint debe estar en la lista de endpoints del webhook de Stripe.
    /// Stripe envía aquí un POST cuando el pago se completa.
    /// NO debe tener [Authorize] — Stripe firma el payload.
    /// </summary>
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> Webhook()
    {
        var payload   = await new StreamReader(Request.Body).ReadToEndAsync();
        var signature = Request.Headers["Stripe-Signature"].ToString();

        try
        {
            await _paymentService.HandleWebhookAsync(payload, signature);
            return Ok();
        }
        catch (Stripe.StripeException ex)
        {
            _logger.LogWarning("Stripe webhook inválido: {Message}", ex.Message);
            return BadRequest(new { message = "Firma de webhook inválida" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error procesando webhook");
            return StatusCode(500);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/payments/session/{sessionId}
    // Verificar estado de una sesión de Stripe (para la página de éxito)
    // ─────────────────────────────────────────────────────────────
    [HttpGet("session/{sessionId}")]
    [Authorize]
    public async Task<IActionResult> GetSessionStatus(string sessionId)
    {
        try
        {
            var payment = await _context.Payments
                .Include(p => p.Appointment)
                .Include(p => p.Course)
                .FirstOrDefaultAsync(p => p.TransactionId == sessionId);

            if (payment == null)
                return NotFound(new { message = "Sesión no encontrada" });

            return Ok(new
            {
                status       = payment.Status,
                paymentType  = payment.PaymentType,
                amount       = payment.Amount,
                currency     = payment.Currency,
                appointmentId = payment.AppointmentId,
                courseId     = payment.CourseId,
                courseTitle  = payment.Course?.Title,
                processedAt  = payment.ProcessedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error consultando sesión {SessionId}", sessionId);
            return StatusCode(500, new { message = "Error al consultar el estado del pago" });
        }
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/payments/my-payments
    // Historial de pagos del usuario autenticado
    // ─────────────────────────────────────────────────────────────
    [HttpGet("my-payments")]
    [Authorize(Roles = "Patient,Doctor")]
    public async Task<IActionResult> GetMyPayments()
    {
        try
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var role      = User.FindFirst(ClaimTypes.Role)?.Value;

            if (!int.TryParse(userIdStr, out var userId))
                return Unauthorized();

            List<object> result;

            if (role == "Patient")
            {
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
                if (patient == null) return NotFound();

                result = await _context.Payments
                    .Where(p => p.PatientId == patient.Id && p.Status == "Completado")
                    .OrderByDescending(p => p.CreatedAt)
                    .Include(p => p.Doctor)
                    .Include(p => p.Course)
                    .Select(p => (object)new
                    {
                        p.Id,
                        p.Amount,
                        p.Currency,
                        p.PaymentType,
                        p.Status,
                        p.CreatedAt,
                        p.ProcessedAt,
                        DoctorName  = p.Doctor.FirstName + " " + p.Doctor.LastName,
                        CourseTitle = p.Course != null ? p.Course.Title : null,
                        p.AppointmentId,
                        p.CourseId
                    })
                    .ToListAsync();
            }
            else // Doctor
            {
                var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
                if (doctor == null) return NotFound();

                result = await _context.Payments
                    .Where(p => p.DoctorId == doctor.Id && p.Status == "Completado")
                    .OrderByDescending(p => p.CreatedAt)
                    .Include(p => p.Patient).ThenInclude(pt => pt.User)
                    .Include(p => p.Course)
                    .Select(p => (object)new
                    {
                        p.Id,
                        p.Amount,
                        p.DoctorAmount,
                        p.PlatformFee,
                        p.Currency,
                        p.PaymentType,
                        p.Status,
                        p.CreatedAt,
                        p.ProcessedAt,
                        PatientEmail = p.Patient.User.Email,
                        CourseTitle  = p.Course != null ? p.Course.Title : null,
                        p.AppointmentId,
                        p.CourseId
                    })
                    .ToListAsync();
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error obteniendo historial de pagos");
            return StatusCode(500, new { message = "Error al obtener los pagos" });
        }
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/payments/{paymentId}/cancel
    // El usuario cancela explícitamente un pago pendiente
    // (ej. desde la página de cancelación de Stripe)
    // ─────────────────────────────────────────────────────────────
    [HttpPost("{paymentId}/cancel")]
    [Authorize(Roles = "Patient,Doctor")]
    public async Task<IActionResult> CancelPayment(int paymentId)
    {
        try
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var role      = User.FindFirst(ClaimTypes.Role)?.Value;
            if (!int.TryParse(userIdStr, out var userId)) return Unauthorized();

            var payment = await _context.Payments
                .Include(p => p.Appointment)
                .FirstOrDefaultAsync(p => p.Id == paymentId);

            if (payment == null) return NotFound(new { message = "Pago no encontrado" });

            // Verificar que el pago pertenece al usuario que solicita la cancelación
            bool owns = false;
            if (role == "Patient")
            {
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
                owns = patient != null && payment.PatientId == patient.Id;
            }
            else if (role == "Doctor")
            {
                var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
                owns = doctor != null && payment.DoctorId == doctor.Id;
            }

            if (!owns) return Forbid();

            // Solo se pueden cancelar pagos aún pendientes
            if (payment.Status != "Pendiente")
                return BadRequest(new { message = "Solo se pueden cancelar pagos en estado Pendiente" });

            // Marcar el pago como cancelado
            payment.Status = "Cancelado";

            // Si hay una cita asociada en PendientePago → cancelarla también
            if (payment.Appointment != null && payment.Appointment.Status == "PendientePago")
                payment.Appointment.Status = "Cancelada";

            await _context.SaveChangesAsync();
            _logger.LogInformation("Pago {PaymentId} cancelado por el usuario {UserId}", paymentId, userId);

            return Ok(new { message = "Pago cancelado correctamente" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelando pago {PaymentId}", paymentId);
            return StatusCode(500, new { message = "Error al cancelar el pago" });
        }
    }
}

// ─────────────────────────────────────────────────────────────
// DTOs de entrada
// ─────────────────────────────────────────────────────────────
public record AppointmentCheckoutRequest(int AppointmentId);
public record CourseCheckoutRequest(int CourseId);
