// ═══════════════════════════════════════════════════════════════
// Hubs/VideoHub.cs
// Hub de señalización WebRTC para videollamadas 1:1.
// Solo intercambia SDP y candidatos ICE — el video va P2P.
// Autenticado: solo Doctor o Patient pueden conectarse.
// ═══════════════════════════════════════════════════════════════

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace MedicineBackend.Hubs;

[Authorize(Roles = "Doctor,Patient")]
public class VideoHub : Hub
{
    // connectionId → roomId: para notificar en desconexiones inesperadas
    private static readonly ConcurrentDictionary<string, string> _connRoom = new();

    // ── Unirse a la sala de señalización ─────────────────────────
    // roomId = appointmentId (string)
    public async Task JoinRoom(string roomId)
    {
        _connRoom[Context.ConnectionId] = roomId;
        await Groups.AddToGroupAsync(Context.ConnectionId, roomId);

        // Avisar a quien ya esté en la sala (el otro participante)
        await Clients.OthersInGroup(roomId).SendAsync("PeerJoined");
    }

    // ── Señalización SDP ─────────────────────────────────────────
    public async Task SendOffer(string roomId, string sdp)
        => await Clients.OthersInGroup(roomId).SendAsync("ReceiveOffer", sdp);

    public async Task SendAnswer(string roomId, string sdp)
        => await Clients.OthersInGroup(roomId).SendAsync("ReceiveAnswer", sdp);

    // ── Candidatos ICE ───────────────────────────────────────────
    public async Task SendIceCandidate(string roomId, string candidate)
        => await Clients.OthersInGroup(roomId).SendAsync("ReceiveIceCandidate", candidate);

    // ── Estado de cámara (para overlay en el peer remoto) ────────
    // cameraOn = true → cámara activa, false → cámara apagada
    public async Task SendCameraState(string roomId, bool cameraOn)
        => await Clients.OthersInGroup(roomId).SendAsync("ReceiveCameraState", cameraOn);

    // ── Salir explícitamente (botón Colgar) ──────────────────────
    public async Task LeaveRoom(string roomId)
    {
        _connRoom.TryRemove(Context.ConnectionId, out _);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);
        await Clients.OthersInGroup(roomId).SendAsync("PeerLeft");
    }

    // ── Desconexión inesperada ────────────────────────────────────
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (_connRoom.TryRemove(Context.ConnectionId, out var roomId))
            await Clients.OthersInGroup(roomId).SendAsync("PeerLeft");

        await base.OnDisconnectedAsync(exception);
    }
}
