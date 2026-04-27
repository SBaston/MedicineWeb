// ═══════════════════════════════════════════════════════════════
// ChatPage.jsx — Chat premium en tiempo real (SignalR + REST)
// Almacenamiento legal de todos los mensajes en BD
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as signalR from '@microsoft/signalr';
import { useAuth } from '../context/AuthContext';
import chatService from '../services/chatService';
import {
    ArrowLeft, Send, MessageCircle, Clock,
    Lock, Loader2, AlertCircle, CheckCheck, Check,
    Crown, Calendar, Shield
} from 'lucide-react';

// ── Helper: formatear hora ─────────────────────────────────────
const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) {
        return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
        + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

// ── Burbuja de mensaje ─────────────────────────────────────────
const MessageBubble = ({ message, isOwn }) => (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
        <div
            className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                isOwn
                    ? 'bg-primary-600 text-white rounded-br-sm'
                    : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'
            }`}
        >
            {!isOwn && (
                <p className="text-xs font-semibold text-primary-600 mb-1">{message.senderName || message.senderRole}</p>
            )}
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
                <span className="text-[10px]">{formatTime(message.sentAt)}</span>
                {isOwn && (
                    message.isRead
                        ? <CheckCheck className="w-3 h-3" />
                        : <Check className="w-3 h-3" />
                )}
            </div>
        </div>
    </div>
);

// ── Separador de fecha ─────────────────────────────────────────
const DateDivider = ({ dateStr }) => (
    <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">{formatDate(dateStr)}</span>
        <div className="flex-1 h-px bg-gray-200" />
    </div>
);

// ── Componente principal ───────────────────────────────────────
const ChatPage = () => {
    const { subscriptionId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const subId = parseInt(subscriptionId, 10);

    const isDoctor = user?.role === 'Doctor';

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [connectionState, setConnectionState] = useState('connecting'); // connecting | connected | error
    const [hubError, setHubError] = useState('');

    const connectionRef = useRef(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // ── Datos de la suscripción (según rol) ───────────────────
    // Paciente: busca entre sus suscripciones
    const { data: subscriptions = [], isLoading: loadingPatientSubs } = useQuery({
        queryKey: ['my-chat-subscriptions'],
        queryFn: chatService.getMySubscriptions,
        enabled: !!user && !isDoctor,
    });

    // Doctor: endpoint dedicado para una suscripción concreta
    const { data: doctorSub, isLoading: loadingDoctorSub } = useQuery({
        queryKey: ['doctor-chat-sub', subId],
        queryFn: () => chatService.getDoctorSubscriptionById(subId),
        enabled: !!user && isDoctor && !!subId,
        retry: false,
    });

    const subscription = isDoctor
        ? doctorSub
        : subscriptions.find(s => s.id === subId);

    const loadingSubs = isDoctor ? loadingDoctorSub : loadingPatientSubs;

    // true solo cuando la suscripción ya cargó Y pertenece al usuario actual
    const isAuthorized = !loadingSubs && !!subscription;

    // ── Nombre e imagen de la "otra persona" ──────────────────
    const otherPersonName = isDoctor
        ? (subscription?.patientName ?? 'Paciente')
        : `Dr. ${subscription?.doctorName ?? ''}`;

    const otherPersonAvatar = isDoctor
        ? null  // los pacientes no tienen foto de perfil en este sistema
        : subscription?.doctorProfilePictureUrl;

    const dashboardPath = isDoctor ? '/doctor/dashboard' : '/dashboard';

    // ── Cargar historial de mensajes ───────────────────────────
    useEffect(() => {
        if (!subId || !isAuthorized) return;
        chatService.getMessages(subId, 1)
            .then(data => {
                // Los mensajes vienen en orden descendente (más reciente primero), invertimos
                setMessages([...data].reverse());
            })
            .catch(console.error);
    }, [subId, isAuthorized]);

    // ── Hacer scroll al fondo ──────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Marcar como leídos ─────────────────────────────────────
    useEffect(() => {
        if (subId && user && isAuthorized) {
            chatService.markRead(subId).catch(console.error);
        }
    }, [subId, user, messages.length, isAuthorized]);

    // ── Conexión SignalR ───────────────────────────────────────
    // Solo se inicia cuando sabemos que la suscripción pertenece al usuario
    useEffect(() => {
        if (!isAuthorized) return;

        const token = localStorage.getItem('token');
        if (!token || !subId) return;

        let mounted = true; // guard para evitar actualizar estado si ya se desmontó

        const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

        // Logger personalizado: filtra los errores de abort que React StrictMode
        // provoca en desarrollo (doble montaje → stop() interrumpe el start()).
        // En producción estos mensajes nunca aparecen porque StrictMode no ejecuta
        // el doble ciclo.
        const hubLogger = {
            log: (logLevel, message) => {
                if (typeof message === 'string' && (
                    message.includes('stop() was called') ||
                    message.includes('stopped during negotiation') ||
                    message.includes('Failed to start the HttpConnection before stop')
                )) return; // silenciar artefactos de StrictMode
                if (logLevel >= signalR.LogLevel.Warning) {
                    console.warn('[Chat Hub]', message);
                }
            }
        };

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${backendUrl}/hubs/chat`, {
                accessTokenFactory: () => localStorage.getItem('token') || '',
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets,
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
            .configureLogging(hubLogger)
            .build();

        connection.on('ReceiveMessage', (message) => {
            if (!mounted) return;
            setMessages(prev => {
                // Evitar duplicados
                if (prev.some(m => m.id === message.id)) return prev;
                return [...prev, message];
            });
            // Marcar leído si el mensaje es del otro participante
            if (message.senderUserId !== user?.id) {
                chatService.markRead(subId).catch(console.error);
            }
        });

        connection.on('MessagesRead', () => {
            if (!mounted) return;
            setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
        });

        connection.onreconnecting(() => {
            if (mounted) setConnectionState('connecting');
        });
        connection.onreconnected(() => {
            if (mounted) {
                setConnectionState('connected');
                setHubError(''); // limpiar el aviso de error al reconectar con éxito
                connection.invoke('JoinChat', subId).catch(console.error);
            }
        });
        connection.onclose(() => {
            if (mounted) setConnectionState('error');
        });

        connection.start()
            .then(() => {
                if (!mounted) return;
                setConnectionState('connected');
                setHubError('');
                return connection.invoke('JoinChat', subId);
            })
            .catch(err => {
                if (!mounted) return;
                console.warn('SignalR: primer intento fallido, reintentando…', err.message);
                setConnectionState('error');
                // Solo mostrar aviso si no hay conexión tras varios intentos
                setTimeout(() => {
                    if (mounted && connection.state !== signalR.HubConnectionState.Connected) {
                        setHubError('No se pudo conectar al chat en tiempo real. Los mensajes se enviarán igualmente.');
                    }
                }, 6000);
            });

        connectionRef.current = connection;

        return () => {
            mounted = false;
            connection.stop();
        };
    }, [subId, user?.id, isAuthorized]);

    // ── Enviar mensaje ─────────────────────────────────────────
    const handleSend = useCallback(async () => {
        const content = inputText.trim();
        if (!content || sending) return;
        if (subscription?.isReadOnly) return;

        setInputText('');
        setSending(true);

        try {
            const conn = connectionRef.current;
            if (conn && conn.state === signalR.HubConnectionState.Connected) {
                // Enviar vía SignalR (el hub persiste el mensaje en BD y hace broadcast)
                await conn.invoke('SendMessage', subId, content);
            } else {
                // Fallback REST si SignalR no está disponible
                const msg = await chatService.sendMessage(subId, content);
                setMessages(prev => [...prev, msg]);
            }
        } catch (err) {
            console.error('Error enviando mensaje:', err);
            // Fallback REST
            try {
                const msg = await chatService.sendMessage(subId, content);
                setMessages(prev => [...prev, msg]);
            } catch {
                setInputText(content); // Restaurar texto
            }
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    }, [inputText, sending, subId, subscription?.isReadOnly]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ── Agrupar mensajes por fecha ─────────────────────────────
    const groupedMessages = messages.reduce((groups, msg) => {
        const date = new Date(msg.sentAt).toDateString();
        if (!groups[date]) groups[date] = [];
        groups[date].push(msg);
        return groups;
    }, {});

    // ── Loading ────────────────────────────────────────────────
    if (loadingSubs) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            </div>
        );
    }

    // ── Suscripción no encontrada ──────────────────────────────
    if (!loadingSubs && !subscription) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-sm">
                    <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Chat no disponible</h2>
                    <p className="text-gray-500 mb-6">
                        No tienes acceso a este chat o la suscripción no existe.
                    </p>
                    <Link to={dashboardPath} className="btn-primary">Volver al panel</Link>
                </div>
            </div>
        );
    }

    const isExpired = subscription.status === 'Expired' || subscription.isReadOnly;
    const daysLeft = subscription.endDate
        ? Math.max(0, Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
        : 0;

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* ── Header ── */}
            <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => navigate(dashboardPath)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>

                    <img
                        src={otherPersonAvatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(otherPersonName)}&background=3b82f6&color=fff&size=80&bold=true`}
                        alt={otherPersonName}
                        className="w-10 h-10 rounded-full object-cover"
                    />

                    <div className="flex-1 min-w-0">
                        <h1 className="font-bold text-gray-900 truncate">{otherPersonName}</h1>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                                connectionState === 'connected' ? 'bg-green-500' :
                                connectionState === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                                'bg-red-400'
                            }`} />
                            <span className="text-xs text-gray-500">
                                {connectionState === 'connected' ? 'En línea' :
                                 connectionState === 'connecting' ? 'Conectando…' : 'Desconectado'}
                            </span>
                        </div>
                    </div>

                    {/* Badge de plan */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                        isExpired ? 'bg-gray-100 text-gray-500' : 'bg-violet-100 text-violet-700'
                    }`}>
                        <Crown className="w-3.5 h-3.5" />
                        {subscription.planName}
                    </div>
                </div>

                {/* Info de suscripción */}
                <div className={`max-w-3xl mx-auto px-4 pb-2 flex items-center gap-4 text-xs ${isExpired ? 'text-red-500' : 'text-gray-500'}`}>
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {isExpired
                            ? `Expiró el ${formatDate(subscription.endDate)}`
                            : `Expira el ${formatDate(subscription.endDate)} (${daysLeft} días restantes)`}
                    </span>
                    <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Mensajes almacenados (LOPD)
                    </span>
                </div>
            </div>

            {/* ── Error de conexión ── */}
            {hubError && (
                <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {hubError}
                </div>
            )}

            {/* ── Área de mensajes ── */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-4 py-6">
                    {messages.length === 0 ? (
                        <div className="text-center py-16">
                            <MessageCircle className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                            <h3 className="font-semibold text-gray-600 mb-1">Empieza la conversación</h3>
                            <p className="text-sm text-gray-400">
                                {isDoctor
                                    ? `Escribe tu primer mensaje a ${otherPersonName}`
                                    : `Escribe tu primera consulta a ${otherPersonName}`}
                            </p>
                        </div>
                    ) : (
                        Object.entries(groupedMessages).map(([date, dayMsgs]) => (
                            <div key={date}>
                                <DateDivider dateStr={dayMsgs[0].sentAt} />
                                {dayMsgs.map(msg => (
                                    <MessageBubble
                                        key={msg.id}
                                        message={msg}
                                        isOwn={msg.senderUserId === user?.id}
                                    />
                                ))}
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* ── Input de mensaje ── */}
            <div className="flex-shrink-0 bg-white border-t border-gray-200">
                <div className="max-w-3xl mx-auto px-4 py-3">
                    {isExpired ? (
                        <div className="flex items-center justify-center gap-2 py-4 text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
                            <Lock className="w-4 h-4" />
                            <span className="text-sm font-medium">Suscripción expirada — solo lectura</span>
                            <Link
                                to="/professionals"
                                className="ml-2 text-sm text-primary-600 hover:underline font-semibold"
                            >
                                Renovar →
                            </Link>
                        </div>
                    ) : (
                        <div className="flex items-end gap-3">
                            <div className="flex-1 relative">
                                <textarea
                                    ref={inputRef}
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Escribe tu mensaje… (Enter para enviar)"
                                    rows={1}
                                    className="w-full resize-none border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent max-h-32 overflow-y-auto"
                                    style={{ minHeight: '46px' }}
                                    onInput={(e) => {
                                        e.target.style.height = 'auto';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                                    }}
                                />
                            </div>
                            <button
                                onClick={handleSend}
                                disabled={!inputText.trim() || sending}
                                className="flex-shrink-0 w-11 h-11 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors"
                            >
                                {sending
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <Send className="w-4 h-4" />
                                }
                            </button>
                        </div>
                    )}
                    <p className="text-xs text-center text-gray-400 mt-2">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Todos los mensajes se almacenan de forma segura conforme a la LOPD
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
