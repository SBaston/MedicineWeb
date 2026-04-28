// ═══════════════════════════════════════════════════════════════
// VideoCallPage.jsx — Videollamada con Jitsi Meet
// Sin Navbar ni Footer: pantalla completa durante la llamada.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Loader2, PhoneOff, AlertCircle, Video, Clock } from 'lucide-react';

const JITSI_DOMAIN = 'meet.jit.si';

const VideoCallPage = () => {
    const { appointmentId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const jitsiRef  = useRef(null);   // div donde se monta Jitsi
    const apiRef    = useRef(null);   // instancia de JitsiMeetExternalAPI

    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState(null);
    const [errorCode,    setErrorCode]    = useState(null);  // 403 = aún no, 410 = finalizada
    const [callInfo,     setCallInfo]     = useState(null);  // datos de la cita
    const [callStarted,  setCallStarted]  = useState(false);

    const dashboardPath = user?.role === 'Doctor' ? '/doctor/dashboard' : '/dashboard';

    // ── 1. Obtener la sala del backend ────────────────────────────
    useEffect(() => {
        if (!appointmentId || !user) return;

        const getRoom = async () => {
            try {
                const res = await api.post(`/appointments/${appointmentId}/video-room`);
                setCallInfo(res.data);
            } catch (err) {
                const status = err.response?.status;
                const msg = err.response?.data?.message || 'No se pudo iniciar la videollamada.';
                setErrorCode(status ?? null);
                setError(msg);
            } finally {
                setLoading(false);
            }
        };

        getRoom();
    }, [appointmentId, user]);

    // ── 2. Cargar el SDK de Jitsi e iniciar la llamada ────────────
    useEffect(() => {
        if (!callInfo || callStarted) return;

        const initJitsi = () => {
            if (!window.JitsiMeetExternalAPI) {
                setError('No se pudo cargar el SDK de Jitsi. Comprueba tu conexión.');
                return;
            }

            // Extraer solo el nombre de sala de la URL completa
            const roomName = callInfo.roomUrl.split('/').pop();

            apiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
                roomName,
                width:      '100%',
                height:     '100%',
                parentNode: jitsiRef.current,
                userInfo: {
                    displayName: callInfo.displayName,
                },
                configOverwrite: {
                    startWithAudioMuted:           false,
                    startWithVideoMuted:           false,
                    disableModeratorIndicator:     false,
                    enableWelcomePage:             false,
                    prejoinPageEnabled:            false,
                    disableDeepLinking:            true,
                    requireDisplayName:            true,

                    // ── Seguridad: sala de espera (lobby) ────────
                    // El moderador (primer participante) debe aprobar
                    // a cada persona antes de que acceda a la sala.
                    lobbyModeEnabled:              true,

                    // Deshabilitar invitaciones externas
                    enableInsecureRoomNameWarning: false,
                    disableInviteFunctions:        true,

                    // Botones visibles en la barra de herramientas
                    toolbarButtons: [
                        'microphone', 'camera', 'desktop', 'fullscreen',
                        'hangup', 'participants-pane', 'settings',
                        'tileview', 'select-background', 'security',
                    ],
                },
                interfaceConfigOverwrite: {
                    SHOW_JITSI_WATERMARK:         false,
                    SHOW_WATERMARK_FOR_GUESTS:    false,
                    DISPLAY_WELCOME_PAGE_CONTENT: false,
                    MOBILE_APP_PROMO:             false,
                    HIDE_INVITE_MORE_HEADER:      true,
                    DEFAULT_REMOTE_DISPLAY_NAME:  'Participante',
                    APP_NAME:                     'NexusSalud',
                    NATIVE_APP_NAME:              'NexusSalud',
                    PROVIDER_NAME:                'NexusSalud',
                },
            });

            // Cuando el usuario cuelga desde el botón de Jitsi
            apiRef.current.on('readyToClose', () => {
                handleHangUp();
            });

            setCallStarted(true);
        };

        // Si el SDK ya está cargado, iniciar directamente
        if (window.JitsiMeetExternalAPI) {
            initJitsi();
            return;
        }

        // Si no, cargar el script y luego iniciar
        const script = document.createElement('script');
        script.src   = `https://${JITSI_DOMAIN}/external_api.js`;
        script.async = true;
        script.onload  = initJitsi;
        script.onerror = () => setError('No se pudo cargar el SDK de Jitsi.');
        document.head.appendChild(script);

        return () => {
            // Limpiar si el componente se desmonta antes de cargar
            if (!window.JitsiMeetExternalAPI) {
                document.head.removeChild(script);
            }
        };
    }, [callInfo]);

    // ── Cleanup al desmontar ──────────────────────────────────────
    useEffect(() => {
        return () => {
            apiRef.current?.dispose();
        };
    }, []);

    // ── Colgar y volver al dashboard ──────────────────────────────
    const handleHangUp = () => {
        apiRef.current?.dispose();
        apiRef.current = null;
        navigate(dashboardPath);
    };

    // ── Estados de carga y error ──────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-400" />
                <p className="text-lg">Preparando la videollamada…</p>
            </div>
        );
    }

    if (error) {
        const isTooEarly = errorCode === 403;
        const isExpired  = errorCode === 410;
        const iconColor  = isTooEarly ? 'text-yellow-400' : 'text-red-400';
        const bgColor    = isTooEarly ? 'bg-yellow-500/20' : 'bg-red-500/20';
        const title      = isTooEarly
            ? 'La videollamada aún no ha comenzado'
            : isExpired
                ? 'La cita ha finalizado'
                : 'No se pudo iniciar la llamada';

        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white gap-6 px-4">
                <div className={`w-16 h-16 ${bgColor} rounded-full flex items-center justify-center`}>
                    {isTooEarly
                        ? <Clock className={`w-8 h-8 ${iconColor}`} />
                        : <AlertCircle className={`w-8 h-8 ${iconColor}`} />
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

    return (
        <div className="flex flex-col h-screen bg-gray-900">
            {/* ── Barra superior ── */}
            <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <Video className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-white font-semibold text-sm">
                            {user?.role === 'Doctor'
                                ? `Consulta con ${callInfo?.patientName}`
                                : `Consulta con ${callInfo?.doctorName}`}
                        </p>
                        <p className="text-gray-400 text-xs">
                            NexusSalud · Videollamada segura
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleHangUp}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                    <PhoneOff className="w-4 h-4" />
                    Colgar
                </button>
            </div>

            {/* ── Contenedor Jitsi (pantalla completa) ── */}
            <div ref={jitsiRef} className="flex-1 w-full" />
        </div>
    );
};

export default VideoCallPage;
