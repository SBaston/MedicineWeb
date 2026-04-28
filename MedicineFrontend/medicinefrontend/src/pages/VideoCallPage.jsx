// ═══════════════════════════════════════════════════════════════
// VideoCallPage.jsx — Videollamada WebRTC nativa + SignalR
// Sin Navbar ni Footer. Comunicación P2P cifrada entre doctor y
// paciente. Sin dependencias de terceros para el video.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    Loader2, PhoneOff, AlertCircle, Video, VideoOff,
    Mic, MicOff, Clock, Wifi, WifiOff, Users, Monitor,
} from 'lucide-react';

// Servidores STUN gratuitos para traversal de NAT
const RTC_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun.services.mozilla.com' },
    ],
};

const HUB_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
    .replace('/api', '') + '/hubs/video';

// ── Formatea segundos como MM:SS ──────────────────────────────
const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const VideoCallPage = () => {
    const { appointmentId } = useParams();
    const { user }          = useAuth();
    const navigate          = useNavigate();

    // ── Refs (no disparan re-render) ──────────────────────────────
    const localVideoRef   = useRef(null);
    const remoteVideoRef  = useRef(null);
    const pcRef           = useRef(null);       // RTCPeerConnection
    const hubRef          = useRef(null);       // SignalR connection
    const localStreamRef  = useRef(null);       // MediaStream cámara local
    const screenStreamRef = useRef(null);       // MediaStream pantalla compartida
    const isCallerRef     = useRef(false);      // ¿Este peer crea la oferta?
    const videoMutedRef   = useRef(false);      // copia ref de videoMuted para callbacks estables
    const stopSharingRef  = useRef(null);       // ref estable a stopScreenShare

    // ── Estado UI ─────────────────────────────────────────────────
    const [loading,         setLoading]         = useState(true);
    const [error,           setError]           = useState(null);
    const [errorCode,       setErrorCode]       = useState(null);
    const [callInfo,        setCallInfo]        = useState(null);
    const [waiting,         setWaiting]         = useState(true);
    const [connected,       setConnected]       = useState(false);
    const [audioMuted,      setAudioMuted]      = useState(false);
    const [videoMuted,      setVideoMuted]      = useState(false);
    const [isSharing,       setIsSharing]       = useState(false);
    const [remoteCameraOff, setRemoteCameraOff] = useState(false);
    const [duration,        setDuration]        = useState(0);
    const [iceState,        setIceState]        = useState(''); // eslint-disable-line no-unused-vars

    const dashboardPath = user?.role === 'Doctor' ? '/doctor/dashboard' : '/dashboard';

    // ── Timer de duración (solo cuando hay conexión) ──────────────
    useEffect(() => {
        if (!connected) return;
        const t = setInterval(() => setDuration(d => d + 1), 1000);
        return () => clearInterval(t);
    }, [connected]);

    // ── Crear RTCPeerConnection ───────────────────────────────────
    const createPeerConnection = useCallback(() => {
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }

        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;

        // Añadir tracks locales al canal P2P
        // Si se está compartiendo pantalla, se usa ese stream; sino la cámara
        const activeStream = screenStreamRef.current || localStreamRef.current;
        activeStream?.getTracks().forEach(track =>
            pc.addTrack(track, activeStream));

        // Recibir stream remoto
        pc.ontrack = ({ streams }) => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = streams[0];
            setConnected(true);
            setWaiting(false);
        };

        // Candidatos ICE → enviar al peer vía SignalR
        pc.onicecandidate = ({ candidate }) => {
            if (candidate && hubRef.current?.state === signalR.HubConnectionState.Connected) {
                hubRef.current
                    .invoke('SendIceCandidate', appointmentId, JSON.stringify(candidate))
                    .catch(console.error);
            }
        };

        pc.oniceconnectionstatechange = () => setIceState(pc.iceConnectionState);

        // Detectar desconexión del peer
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                setConnected(false);
                setWaiting(true);
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            }
        };

        return pc;
    }, [appointmentId]);

    // ── Caller: crear y enviar oferta ─────────────────────────────
    const sendOffer = useCallback(async () => {
        const pc    = createPeerConnection();
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await pc.setLocalDescription(offer);
        await hubRef.current.invoke('SendOffer', appointmentId, JSON.stringify(offer));
    }, [appointmentId, createPeerConnection]);

    // ── Setup principal ───────────────────────────────────────────
    useEffect(() => {
        if (!appointmentId || !user) return;
        let cancelled = false;

        const setup = async () => {
            // 1. Verificar acceso en el backend (ventana horaria + permisos)
            try {
                const res = await api.post(`/appointments/${appointmentId}/video-room`);
                if (cancelled) return;
                setCallInfo(res.data);
            } catch (err) {
                if (!cancelled) {
                    setErrorCode(err.response?.status ?? null);
                    setError(err.response?.data?.message || 'No se pudo iniciar la videollamada.');
                    setLoading(false);
                }
                return;
            }

            // 2. Capturar cámara y micrófono
            let localStream;
            try {
                localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (cancelled) { localStream.getTracks().forEach(t => t.stop()); return; }
                localStreamRef.current = localStream;
                if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
            } catch {
                if (!cancelled) {
                    setError('No se pudo acceder a la cámara o al micrófono. Verifica los permisos del navegador.');
                    setLoading(false);
                }
                return;
            }

            // 3. Conectar al hub de señalización
            const hub = new signalR.HubConnectionBuilder()
                .withUrl(HUB_URL, {
                    accessTokenFactory: () => localStorage.getItem('token') || '',
                })
                .withAutomaticReconnect()
                .configureLogging(signalR.LogLevel.Warning)
                .build();
            hubRef.current = hub;

            // ─── Handlers de señalización ────────────────────────

            // El otro participante entró → nosotros somos el caller
            hub.on('PeerJoined', () => {
                isCallerRef.current = true;
                sendOffer();
            });

            // Recibimos oferta → respondemos con answer
            hub.on('ReceiveOffer', async (sdpStr) => {
                const pc = createPeerConnection();
                await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(sdpStr)));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await hub.invoke('SendAnswer', appointmentId, JSON.stringify(answer));
            });

            // Recibimos answer → completar descripción remota
            hub.on('ReceiveAnswer', async (sdpStr) => {
                await pcRef.current?.setRemoteDescription(
                    new RTCSessionDescription(JSON.parse(sdpStr)));
            });

            // Candidato ICE del peer → añadir
            hub.on('ReceiveIceCandidate', async (candidateStr) => {
                try {
                    await pcRef.current?.addIceCandidate(
                        new RTCIceCandidate(JSON.parse(candidateStr)));
                } catch { /* ignorar si la conexión ya cerró */ }
            });

            // El otro participante se fue
            hub.on('PeerLeft', () => {
                setConnected(false);
                setWaiting(true);
                setDuration(0);
                setRemoteCameraOff(false);
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                pcRef.current?.close();
                pcRef.current = null;
            });

            // Estado de cámara del peer remoto
            hub.on('ReceiveCameraState', (cameraOn) => {
                setRemoteCameraOff(!cameraOn);
            });

            // 4. Arrancar y unirse a la sala
            try {
                await hub.start();
                if (cancelled) return;
                await hub.invoke('JoinRoom', appointmentId);
                setLoading(false);
            } catch {
                if (!cancelled)
                    setError('No se pudo conectar al servidor. Comprueba tu conexión e inténtalo de nuevo.');
                setLoading(false);
            }
        };

        setup();

        return () => {
            cancelled = true;
            localStreamRef.current?.getTracks().forEach(t => t.stop());
            screenStreamRef.current?.getTracks().forEach(t => t.stop());
            pcRef.current?.close();
            hubRef.current?.invoke('LeaveRoom', appointmentId).catch(() => {});
            hubRef.current?.stop();
        };
    }, [appointmentId, user]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Colgar ────────────────────────────────────────────────────
    const handleHangUp = () => {
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        screenStreamRef.current?.getTracks().forEach(t => t.stop());
        pcRef.current?.close();
        hubRef.current?.invoke('LeaveRoom', appointmentId).catch(() => {});
        hubRef.current?.stop();
        navigate(dashboardPath);
    };

    // ── Controles de audio ────────────────────────────────────────
    const toggleAudio = () => {
        localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
        setAudioMuted(m => !m);
    };

    // ── Cámara: solo afecta el stream LOCAL y notifica al peer ────
    const toggleVideo = useCallback(() => {
        localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
        const newMuted = !videoMutedRef.current;
        videoMutedRef.current = newMuted;
        setVideoMuted(newMuted);

        // Informar al otro participante para que muestre u oculte el overlay
        if (hubRef.current?.state === signalR.HubConnectionState.Connected) {
            hubRef.current
                .invoke('SendCameraState', appointmentId, !newMuted)
                .catch(console.error);
        }
    }, [appointmentId]);

    // ── Dejar de compartir pantalla ───────────────────────────────
    const stopScreenShare = useCallback(async () => {
        screenStreamRef.current?.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;

        // Restaurar la pista de cámara (respetando el estado mute anterior)
        const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
        if (cameraTrack) {
            cameraTrack.enabled = !videoMutedRef.current;
            const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
            if (sender) await sender.replaceTrack(cameraTrack).catch(console.error);
        }

        // Restaurar PiP a la cámara local
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
        setIsSharing(false);
    }, []);

    // Ref estable para poder llamar a stopScreenShare desde el evento onended
    useEffect(() => { stopSharingRef.current = stopScreenShare; }, [stopScreenShare]);

    // ── Compartir pantalla ────────────────────────────────────────
    const toggleScreenShare = useCallback(async () => {
        if (isSharing) {
            await stopScreenShare();
            return;
        }
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: 'always' },
                audio: false, // el audio de sistema puede causar eco
            });
            screenStreamRef.current = screenStream;

            const screenTrack = screenStream.getVideoTracks()[0];

            // Reemplazar la pista de vídeo enviada al peer sin renegociar
            const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
            if (sender) await sender.replaceTrack(screenTrack).catch(console.error);

            // Mostrar la pantalla en el PiP local
            if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
            setIsSharing(true);

            // El usuario pulsó "Dejar de compartir" en el diálogo del navegador
            screenTrack.onended = () => stopSharingRef.current?.();
        } catch (err) {
            // NotAllowedError = usuario canceló el selector de pantalla
            if (err.name !== 'NotAllowedError') console.error('Error al compartir pantalla:', err);
        }
    }, [isSharing, stopScreenShare]);

    // ── Pantalla de carga ─────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-400" />
                <p className="text-lg">Preparando la videollamada…</p>
            </div>
        );
    }

    // ── Pantalla de error ─────────────────────────────────────────
    if (error) {
        const isTooEarly = errorCode === 403;
        const isExpired  = errorCode === 410;
        const title = isTooEarly
            ? 'La videollamada aún no ha comenzado'
            : isExpired ? 'La cita ha finalizado'
            : 'No se pudo iniciar la llamada';

        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white gap-6 px-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center
                    ${isTooEarly ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                    {isTooEarly
                        ? <Clock className="w-8 h-8 text-yellow-400" />
                        : <AlertCircle className="w-8 h-8 text-red-400" />
                    }
                </div>
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-2">{title}</h2>
                    <p className="text-gray-400 text-sm max-w-sm">{error}</p>
                </div>
                <button
                    onClick={() => navigate(dashboardPath)}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold transition-colors"
                >
                    Volver al panel
                </button>
            </div>
        );
    }

    // ── Interfaz de llamada ───────────────────────────────────────
    return (
        <div className="flex flex-col h-screen bg-gray-900 select-none">

            {/* ── Barra superior ── */}
            <div className="flex-shrink-0 bg-gray-800/90 backdrop-blur border-b border-gray-700 px-4 py-2.5 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Video className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-white font-semibold text-sm">
                            {user?.role === 'Doctor'
                                ? `Consulta con ${callInfo?.patientName}`
                                : `Consulta con ${callInfo?.doctorName}`}
                        </p>
                        <p className="text-gray-400 text-xs flex items-center gap-1.5">
                            {connected
                                ? <><Wifi className="w-3 h-3 text-green-400" /> Conectado · {fmt(duration)}</>
                                : waiting
                                    ? <><Users className="w-3 h-3 text-yellow-400" /> Esperando al otro participante…</>
                                    : <><WifiOff className="w-3 h-3 text-red-400" /> Reconectando…</>
                            }
                        </p>
                    </div>
                </div>

                {/* Indicador de pantalla compartida */}
                {isSharing && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-600/20 border border-green-500/40 rounded-lg">
                        <Monitor className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400 text-xs font-medium">Compartiendo pantalla</span>
                    </div>
                )}

                <button
                    onClick={handleHangUp}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                    <PhoneOff className="w-4 h-4" />
                    Colgar
                </button>
            </div>

            {/* ── Área de vídeo ── */}
            <div className="relative flex-1 bg-black overflow-hidden">

                {/* Vídeo remoto (pantalla completa) */}
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover transition-opacity duration-500 ${connected ? 'opacity-100' : 'opacity-0'}`}
                />

                {/* Overlay cuando el peer remoto apaga su cámara */}
                {connected && remoteCameraOff && (
                    <div className="absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                            <VideoOff className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-300 text-sm font-medium">Cámara desactivada</p>
                    </div>
                )}

                {/* Pantalla de espera (cuando el peer no ha llegado) */}
                {!connected && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4">
                        <div className="w-20 h-20 bg-indigo-600/30 rounded-full flex items-center justify-center animate-pulse">
                            <Users className="w-10 h-10 text-indigo-300" />
                        </div>
                        <p className="text-lg font-medium">Esperando a que el otro participante se una…</p>
                        <p className="text-gray-400 text-sm">La videollamada comenzará automáticamente</p>
                    </div>
                )}

                {/* PiP local (esquina inferior derecha) */}
                <div className="absolute bottom-24 right-4 w-36 h-24 sm:w-44 sm:h-28 rounded-xl overflow-hidden border-2 border-gray-600 shadow-2xl bg-gray-800">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted  /* siempre muted para evitar eco del propio audio */
                        className="w-full h-full object-cover"
                    />
                    {/* Overlay cámara apagada (solo cuando no se comparte pantalla) */}
                    {videoMuted && !isSharing && (
                        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                            <VideoOff className="w-6 h-6 text-gray-400" />
                        </div>
                    )}
                    {/* Etiqueta cuando se comparte pantalla */}
                    {isSharing && (
                        <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                            <span className="bg-green-600/80 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                                Tu pantalla
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Barra de controles ── */}
            <div className="flex-shrink-0 bg-gray-800/90 backdrop-blur border-t border-gray-700 px-4 py-3 flex items-center justify-center gap-4">

                {/* Micrófono */}
                <button
                    onClick={toggleAudio}
                    title={audioMuted ? 'Activar micrófono' : 'Silenciar'}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors
                        ${audioMuted
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-gray-600 hover:bg-gray-500 text-white'}`}
                >
                    {audioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Compartir pantalla */}
                <button
                    onClick={toggleScreenShare}
                    title={isSharing ? 'Dejar de compartir pantalla' : 'Compartir pantalla'}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors
                        ${isSharing
                            ? 'bg-green-600 hover:bg-green-700 text-white ring-2 ring-green-400 ring-offset-2 ring-offset-gray-800'
                            : 'bg-gray-600 hover:bg-gray-500 text-white'}`}
                >
                    <Monitor className="w-5 h-5" />
                </button>

                {/* Colgar */}
                <button
                    onClick={handleHangUp}
                    title="Colgar"
                    className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-lg"
                >
                    <PhoneOff className="w-6 h-6" />
                </button>

                {/* Cámara */}
                <button
                    onClick={toggleVideo}
                    title={videoMuted ? 'Activar cámara' : 'Apagar cámara'}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors
                        ${videoMuted
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-gray-600 hover:bg-gray-500 text-white'}`}
                >
                    {videoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
};

export default VideoCallPage;
