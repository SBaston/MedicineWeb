using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using MedicineBackend.Data;
using MedicineBackend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MedicineBackend.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IChatService _chatService;
    private readonly AppDbContext _db;

    public ChatHub(IChatService chatService, AppDbContext db)
    {
        _chatService = chatService;
        _db = db;
    }

    /// <summary>
    /// El cliente llama a esto para unirse al grupo del chat.
    /// Verifica que el usuario pertenece a la suscripción antes de añadirlo.
    /// </summary>
    public async Task JoinChat(int subscriptionId)
    {
        var userId = GetUserId();

        var sub = await _db.ChatSubscriptions
            .Include(s => s.Doctor).ThenInclude(d => d.User)
            .FirstOrDefaultAsync(s => s.Id == subscriptionId &&
                (s.PatientUserId == userId || s.Doctor.UserId == userId));

        if (sub == null)
            throw new HubException("No tienes acceso a este chat.");

        await Groups.AddToGroupAsync(Context.ConnectionId, $"chat_{subscriptionId}");
    }

    /// <summary>
    /// El cliente llama a esto para enviar un mensaje vía SignalR.
    /// </summary>
    public async Task SendMessage(int subscriptionId, string content)
    {
        var userId = GetUserId();
        var role   = GetUserRole();

        try
        {
            var message = await _chatService.SendMessageAsync(subscriptionId, userId, role, content);
            await Clients.Group($"chat_{subscriptionId}").SendAsync("ReceiveMessage", message);
        }
        catch (InvalidOperationException ex)
        {
            throw new HubException(ex.Message);
        }
    }

    /// <summary>
    /// El cliente llama a esto para marcar mensajes como leídos.
    /// </summary>
    public async Task MarkRead(int subscriptionId)
    {
        var userId = GetUserId();
        await _chatService.MarkMessagesReadAsync(subscriptionId, userId);
        await Clients.Group($"chat_{subscriptionId}").SendAsync("MessagesRead", subscriptionId, userId);
    }

    // ─── Helpers ─────────────────────────────────────────────

    private int GetUserId()
    {
        var value = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(value, out var id))
            throw new HubException("No autenticado");
        return id;
    }

    private string GetUserRole()
    {
        return Context.User?.FindFirst(ClaimTypes.Role)?.Value ?? "Patient";
    }
}
