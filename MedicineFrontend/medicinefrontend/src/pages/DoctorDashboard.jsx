// ═══════════════════════════════════════════════════════════════
// DoctorDashboard.jsx - Dashboard Principal del Doctor
// ✅ Con sección de Redes Sociales integrada
// ✅ Con botón "Ver mi perfil" cuando está completado al 100%
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    DollarSign, Calendar, Users, Star, TrendingUp, TrendingDown,
    User, Clock, Video, BookOpen, AlertCircle,
    ArrowRight, CheckCircle, Eye,
    MapPin, Loader2, ChevronDown, ChevronUp,
    CreditCard, FileText, BarChart2, MessageCircle, Crown, Search, ClipboardList,
    ShieldCheck, ShieldAlert, KeyRound, Copy, ScanLine, X
} from 'lucide-react';
import doctorDashboardService from '../services/doctordashboardService';
import SocialMediaSection from '../components/SocialMediaSection';
import appointmentService from '../services/appointmentService';
import chatService from '../services/chatService';
import authService from '../services/authService';

// ── Modal de configuración 2FA ────────────────────────────────────
const TwoFactorModal = ({ onClose, onSuccess }) => {
    const [setupData, setSetupData]         = useState(null);
    const [code, setCode]                   = useState('');
    const [error, setError]                 = useState('');
    const [loading, setLoading]             = useState(false);
    const [copied, setCopied]               = useState(false);
    const [recoveryCodes, setRecoveryCodes] = useState(null);
    const [codesCopied, setCodesCopied]     = useState(false);
    const setupCalled = useRef(false);

    useEffect(() => {
        if (setupCalled.current) return;
        setupCalled.current = true;
        authService.setupTwoFactor()
            .then(data => setSetupData(data))
            .catch(() => setError('Error al generar el código QR. Inténtalo de nuevo.'));
    }, []);

    const qrUrl = setupData?.otpAuthUri
        ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.otpAuthUri)}`
        : null;

    const handleCopy = () => {
        navigator.clipboard.writeText(setupData?.manualEntryKey || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyAllCodes = () => {
        navigator.clipboard.writeText((recoveryCodes || []).join('\n'));
        setCodesCopied(true);
        setTimeout(() => setCodesCopied(false), 2000);
    };

    const handleDownloadCodes = () => {
        const blob = new Blob(
            [`Códigos de recuperación NexusSalud\nGuárdalos en un lugar seguro — cada uno solo se puede usar una vez.\n\n${(recoveryCodes || []).join('\n')}`],
            { type: 'text/plain' }
        );
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'nexussalud-recovery-codes.txt';
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await authService.enableTwoFactor(code);
            setRecoveryCodes(result.recoveryCodes ?? []);
        } catch {
            setError('Código incorrecto. Comprueba que la hora de tu dispositivo es correcta.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
                {!recoveryCodes && (
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                )}

                {recoveryCodes ? (
                    <>
                        <div className="flex flex-col items-center text-center gap-2 mb-5">
                            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                                <ShieldCheck className="w-7 h-7 text-green-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">¡2FA activado!</h2>
                            <p className="text-sm text-gray-500">
                                Guarda estos códigos de recuperación. Si pierdes acceso a tu app de autenticación,
                                podrás usarlos para iniciar sesión. <strong>Solo se muestran una vez.</strong>
                            </p>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 mb-4">
                            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <span className="text-amber-800 text-xs">Cada código solo funciona una vez. Tendrás 8 en total.</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {recoveryCodes.map((rc, i) => (
                                <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center font-mono text-sm font-semibold text-gray-800 tracking-widest">
                                    {rc}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 mb-4">
                            <button onClick={handleCopyAllCodes}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                {codesCopied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                {codesCopied ? 'Copiados' : 'Copiar todos'}
                            </button>
                            <button onClick={handleDownloadCodes}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                <KeyRound className="w-4 h-4" />
                                Descargar .txt
                            </button>
                        </div>
                        <button onClick={onSuccess} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors">
                            He guardado mis códigos
                        </button>
                    </>
                ) : (
                    <>
                        <div className="flex flex-col items-center text-center gap-2 mb-5">
                            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
                                <ShieldCheck className="w-7 h-7 text-indigo-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Activar verificación en dos pasos</h2>
                            <p className="text-sm text-gray-500">
                                Escanea el QR con <strong>Google Authenticator</strong> o <strong>Authy</strong> e introduce el código de 6 dígitos.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 mb-4">
                                <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <span className="text-red-700 text-sm">{error}</span>
                            </div>
                        )}

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 mb-4">
                            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-amber-800 text-xs">
                                Si ya tenías NexusSalud en tu app de autenticación,{' '}
                                <strong>elimina la entrada antigua</strong> antes de escanear este nuevo código QR.
                            </p>
                        </div>

                        <div className="flex flex-col items-center gap-3 mb-5">
                            {qrUrl ? (
                                <img src={qrUrl} alt="QR 2FA" className="w-44 h-44 border-2 border-gray-200 rounded-xl" />
                            ) : (
                                <div className="w-44 h-44 bg-gray-100 rounded-xl flex items-center justify-center">
                                    <ScanLine className="w-8 h-8 text-gray-400 animate-pulse" />
                                </div>
                            )}
                            {setupData?.manualEntryKey && (
                                <div className="w-full">
                                    <p className="text-xs text-gray-400 mb-1 text-center">O introduce esta clave manualmente:</p>
                                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                        <code className="text-xs font-mono text-gray-700 flex-1 break-all">{setupData.manualEntryKey}</code>
                                        <button type="button" onClick={handleCopy} className="text-indigo-600 hover:text-indigo-700 flex-shrink-0">
                                            {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input type="text" inputMode="numeric" maxLength={6} pattern="\d{6}" required autoFocus
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="000000" />
                            </div>
                            <button type="submit" disabled={loading || code.length !== 6}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                {loading ? 'Activando...' : 'Activar verificación en dos pasos'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState([]);
    const [loadingAppointments, setLoadingAppointments] = useState(false);
    const [showAppointments, setShowAppointments] = useState(false);
    const [now, setNow] = useState(() => new Date());
    const [show2FAModal, setShow2FAModal] = useState(false);

    // Actualizar "ahora" cada 30 segundos para activar/desactivar el botón de videollamada
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 30_000);
        return () => clearInterval(timer);
    }, []);

    // ── Suscripciones de chat ──────────────────────────────────
    const { data: chatSubs = [] } = useQuery({
        queryKey: ['doctor-chat-subscriptions'],
        queryFn: chatService.getDoctorSubscriptions,
        refetchInterval: 60000,
    });

    // ── Buscadores ────────────────────────────────────────────
    const [chatSearch, setChatSearch]               = useState('');
    const [appointmentSearch, setAppointmentSearch] = useState('');

    // ── Panel de ingresos ──────────────────────────────────────
    const [showEarnings, setShowEarnings]           = useState(false);
    const [loadingEarnings, setLoadingEarnings]     = useState(false);
    const [earnings, setEarnings]                   = useState(null);
    const [earningsTimeRange, setEarningsTimeRange] = useState('month');
    const [earningsFilterType, setEarningsFilterType] = useState('all');

    useEffect(() => {
        loadDashboardStats();
    }, []);

    const loadDashboardStats = async () => {
        try {
            setLoading(true);
            const data = await doctorDashboardService.getStats();
            setStats(data);
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
            alert('Error al cargar el dashboard');
        } finally {
            setLoading(false);
        }
    };

    const loadAppointments = async () => {
        if (appointments.length > 0) {
            setShowAppointments(prev => !prev);
            return;
        }
        setLoadingAppointments(true);
        try {
            const data = await appointmentService.getDoctorAppointments();
            setAppointments(data);
            setShowAppointments(true);
        } catch (error) {
            console.error('Error al cargar citas:', error);
        } finally {
            setLoadingAppointments(false);
        }
    };

    const loadEarnings = async (timeRange = earningsTimeRange, filterType = earningsFilterType) => {
        setLoadingEarnings(true);
        try {
            const data = await doctorDashboardService.getEarnings(timeRange, filterType);
            setEarnings(data);
            setShowEarnings(true);
        } catch (error) {
            console.error('Error al cargar ingresos:', error);
        } finally {
            setLoadingEarnings(false);
        }
    };

    const handleEarningsFilter = (newTimeRange, newFilterType) => {
        const tr = newTimeRange ?? earningsTimeRange;
        const ft = newFilterType ?? earningsFilterType;
        if (newTimeRange) setEarningsTimeRange(tr);
        if (newFilterType) setEarningsFilterType(ft);
        loadEarnings(tr, ft);
    };

    const getStatusColor = (status) => {
        const colors = {
            'Pendiente': 'bg-yellow-100 text-yellow-700',
            'Confirmada': 'bg-blue-100 text-blue-700',
            'Completada': 'bg-green-100 text-green-700',
            'Cancelada': 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-600">Error al cargar datos</p>
            </div>
        );
    }

    return (
        <>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                        <p className="text-slate-600 mt-1">Bienvenido a tu panel de control</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* ✅ PERFIL COMPLETO - Mensaje de éxito con botón */}
                {stats.profileCompletion === 100 && (
                    <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl p-6 mb-8 shadow-lg">
                        <div className="flex items-start gap-4">
                            <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <h3 className="font-bold text-lg mb-2">¡Perfil completado! 🎉</h3>
                                <p className="mb-4 text-white/90">
                                    Tu perfil está completo al 100%. Ahora puedes empezar a recibir pacientes y gestionar tus servicios.
                                </p>

                                <button
                                    onClick={() => navigate('/doctor/profile')}
                                    className="px-6 py-2.5 bg-white text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                                >
                                    <Eye className="w-4 h-4" />
                                    Ver mi perfil
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile Completion Alert (si no está al 100%) */}
                {stats.profileCompletion < 100 && (
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-6 mb-8 shadow-lg">
                        <div className="flex items-start gap-4">
                            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <h3 className="font-bold text-lg mb-1">Completa tu perfil</h3>
                                <p className="text-white/90 mb-3">
                                    Tu perfil está completo al {stats.profileCompletion}%. Completa toda la información para empezar a recibir pacientes.
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 bg-white/20 rounded-full h-2">
                                        <div
                                            className="bg-white rounded-full h-2 transition-all duration-500"
                                            style={{ width: `${stats.profileCompletion}%` }}
                                        />
                                    </div>
                                    <span className="font-bold text-lg">{stats.profileCompletion}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Banner 2FA — activo */}
                {stats.twoFactorEnabled && (
                    <div className="bg-white border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-4 shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-green-800 text-sm">Verificación en dos pasos activa</p>
                            <p className="text-xs text-green-600">Tu cuenta está protegida con un segundo factor de autenticación.</p>
                        </div>
                    </div>
                )}

                {/* Banner 2FA — inactivo */}
                {!stats.twoFactorEnabled && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-indigo-900 text-sm">Protege tu cuenta con verificación en dos pasos</p>
                                <p className="text-xs text-indigo-600">Añade una capa extra de seguridad a tu historial médico y citas.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShow2FAModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            Activar 2FA
                        </button>
                    </div>
                )}

                {/* ✅ NUEVA SECCIÓN: Redes Sociales */}
                <div className="mb-8">
                    <SocialMediaSection />
                </div>

                {/* ═══ SECCIÓN: MIS CITAS ═══ */}
                <div className="mb-8">
                    <button
                        onClick={loadAppointments}
                        className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-100 rounded-xl">
                                <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-slate-900">Mis citas</h3>
                                <p className="text-sm text-slate-500">Ver todas las citas y añadir enlaces de videollamada</p>
                            </div>
                        </div>
                        {loadingAppointments
                            ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                            : showAppointments
                                ? <ChevronUp className="w-5 h-5 text-slate-400" />
                                : <ChevronDown className="w-5 h-5 text-slate-400" />
                        }
                    </button>

                    {showAppointments && (
                        <div className="mt-3 space-y-3">
                            {/* Buscador de citas */}
                            {appointments.length > 0 && (
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar paciente por nombre…"
                                        value={appointmentSearch}
                                        onChange={e => setAppointmentSearch(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                    />
                                </div>
                            )}
                            {appointments.length === 0 ? (
                                <div className="text-center py-8 bg-white rounded-2xl border border-slate-200">
                                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-600 font-medium">No tienes citas aún</p>
                                    <p className="text-slate-400 text-sm">Las citas aparecerán aquí cuando los pacientes reserven</p>
                                </div>
                            ) : (
                                appointments
                                .filter(appt =>
                                    !appointmentSearch ||
                                    (appt.patientName ?? '').toLowerCase().includes(appointmentSearch.toLowerCase())
                                )
                                .map((appt) => {
                                    const isOnline   = appt.appointmentType === 'online';
                                    const startTime  = new Date(appt.appointmentDate);
                                    const duration   = appt.durationMinutes || 30;
                                    const earlyOpen  = new Date(startTime.getTime() - 5 * 60_000);
                                    const endTime    = new Date(startTime.getTime() + duration * 60_000);
                                    const isActive   = now >= earlyOpen && now <= endTime;
                                    const isUpcoming = now < earlyOpen;
                                    const showCallSection = isOnline
                                        && appt.status !== 'Cancelada'
                                        && appt.status !== 'Completada';

                                    const statusColors = {
                                        'Confirmada': 'bg-blue-100 text-blue-700',
                                        'Completada': 'bg-green-100 text-green-700',
                                        'Cancelada':  'bg-red-100 text-red-700',
                                        'Pendiente':  'bg-yellow-100 text-yellow-700',
                                    };

                                    return (
                                        <div
                                            key={appt.id}
                                            className={`bg-white rounded-xl border p-4 shadow-sm ${isActive && showCallSection ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200'}`}
                                        >
                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-semibold text-slate-900">{appt.patientName}</p>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[appt.status] || 'bg-gray-100 text-gray-700'}`}>
                                                            {appt.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-500">
                                                        {startTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las {startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        {isOnline
                                                            ? <Video className="w-3.5 h-3.5 text-blue-500" />
                                                            : <MapPin className="w-3.5 h-3.5 text-green-500" />
                                                        }
                                                        <span className={`text-xs font-medium ${isOnline ? 'text-blue-600' : 'text-green-600'}`}>
                                                            {isOnline ? 'Online' : 'Presencial'} · {appt.price?.toFixed(2)} €
                                                        </span>
                                                    </div>
                                                    {appt.reason && (
                                                        <p className="text-xs text-slate-400 mt-1">Motivo: {appt.reason}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Historial clínico */}
                                            <div className="mt-2">
                                                <button
                                                    onClick={() => navigate(`/doctor/patients/${appt.patientId}/clinical-history`)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                                                >
                                                    <ClipboardList className="w-3.5 h-3.5" />
                                                    Historial clínico
                                                </button>
                                            </div>

                                            {/* Videollamada con Jitsi — disponible solo en la ventana horaria */}
                                            {showCallSection && (
                                                <div className="border-t border-slate-100 pt-3">
                                                    {isActive ? (
                                                        <button
                                                            onClick={() => navigate(`/videollamada/${appt.id}`)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                                                        >
                                                            <Video className="w-4 h-4" />
                                                            Iniciar videollamada
                                                        </button>
                                                    ) : isUpcoming ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg border border-indigo-200">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            Disponible a las {startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            {appointmentSearch && appointments.filter(a => (a.patientName ?? '').toLowerCase().includes(appointmentSearch.toLowerCase())).length === 0 && (
                                <div className="text-center py-6 bg-white rounded-2xl border border-slate-200">
                                    <p className="text-slate-500 text-sm">No hay citas que coincidan con "{appointmentSearch}"</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ═══ SECCIÓN: MIS INGRESOS ═══ */}
                <div className="mb-8">
                    {/* Header colapsable */}
                    <button
                        onClick={() => {
                            if (!earnings) {
                                loadEarnings();
                            } else {
                                setShowEarnings(prev => !prev);
                            }
                        }}
                        className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-100 rounded-xl">
                                <DollarSign className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-slate-900">Mis ingresos</h3>
                                <p className="text-sm text-slate-500">Consultas, cursos y comisiones</p>
                            </div>
                        </div>
                        {loadingEarnings
                            ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                            : showEarnings
                                ? <ChevronUp className="w-5 h-5 text-slate-400" />
                                : <ChevronDown className="w-5 h-5 text-slate-400" />
                        }
                    </button>

                    {/* Panel expandido */}
                    {showEarnings && earnings && (
                        <div className="mt-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            {/* Filtros */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {/* Período */}
                                {[
                                    { value: 'week',  label: 'Semana' },
                                    { value: 'month', label: 'Mes' },
                                    { value: 'year',  label: 'Año' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleEarningsFilter(opt.value, null)}
                                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                                            earningsTimeRange === opt.value
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                                <div className="w-px bg-slate-200 mx-1 self-stretch" />
                                {/* Tipo */}
                                {[
                                    { value: 'all',          label: 'Todos' },
                                    { value: 'appointments', label: 'Consultas' },
                                    { value: 'courses',      label: 'Cursos' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleEarningsFilter(null, opt.value)}
                                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                                            earningsFilterType === opt.value
                                                ? 'bg-slate-700 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                                {loadingEarnings && <Loader2 className="w-4 h-4 animate-spin text-slate-400 self-center ml-2" />}
                            </div>

                            {/* KPI cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div className="bg-emerald-50 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Total bruto</span>
                                        {earnings.growth >= 0
                                            ? <span className="text-xs text-emerald-600 flex items-center gap-0.5 font-semibold"><TrendingUp className="w-3 h-3" />+{earnings.growth?.toFixed(1)}%</span>
                                            : <span className="text-xs text-red-600 flex items-center gap-0.5 font-semibold"><TrendingDown className="w-3 h-3" />{earnings.growth?.toFixed(1)}%</span>
                                        }
                                    </div>
                                    <p className="text-2xl font-bold text-emerald-700">€{(earnings.total ?? 0).toFixed(2)}</p>
                                </div>
                                <div className="bg-blue-50 rounded-xl p-4">
                                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide block mb-2">Neto</span>
                                    <p className="text-2xl font-bold text-blue-700">€{(earnings.netEarnings ?? 0).toFixed(2)}</p>
                                    <p className="text-xs text-blue-500 mt-1">-15% comisión</p>
                                </div>
                                <div className="bg-purple-50 rounded-xl p-4">
                                    <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide block mb-2">Sesiones</span>
                                    <p className="text-2xl font-bold text-purple-700">{earnings.totalSessions ?? 0}</p>
                                    <p className="text-xs text-purple-500 mt-1">{earnings.totalPatients ?? 0} pacientes</p>
                                </div>
                                <div className="bg-amber-50 rounded-xl p-4">
                                    <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide block mb-2">Precio medio</span>
                                    <p className="text-2xl font-bold text-amber-700">€{(earnings.avgSessionPrice ?? 0).toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Transacciones + Breakdown */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Lista de transacciones */}
                                <div className="lg:col-span-2">
                                    <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">Últimas transacciones</h4>
                                    {(earnings.transactions ?? []).length === 0 ? (
                                        <p className="text-slate-500 text-sm text-center py-6">Sin transacciones en este período</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {(earnings.transactions ?? []).slice(0, 8).map(tx => (
                                                <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                            tx.type === 'appointment'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-purple-100 text-purple-700'
                                                        }`}>
                                                            {tx.type === 'appointment' ? 'Consulta' : 'Curso'}
                                                        </span>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-800">{tx.patient}</p>
                                                            {tx.courseName && <p className="text-xs text-slate-500">{tx.courseName}</p>}
                                                            <p className="text-xs text-slate-400">{tx.date}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-emerald-600">+€{tx.netAmount?.toFixed(2)}</p>
                                                        <p className="text-xs text-slate-400">Bruto €{tx.amount?.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Breakdown sidebar */}
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">Desglose</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-slate-600">Consultas</span>
                                                    <span className="font-semibold text-blue-600">€{(earnings.fromAppointments ?? 0).toFixed(2)}</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full transition-all"
                                                        style={{ width: `${earnings.total > 0 ? (earnings.fromAppointments / earnings.total) * 100 : 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-slate-600">Cursos</span>
                                                    <span className="font-semibold text-purple-600">€{(earnings.fromCourses ?? 0).toFixed(2)}</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-purple-500 rounded-full transition-all"
                                                        style={{ width: `${earnings.total > 0 ? (earnings.fromCourses / earnings.total) * 100 : 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="pt-3 border-t border-slate-100 flex justify-between text-sm">
                                                <span className="text-slate-500">Comisión (15%)</span>
                                                <span className="font-semibold text-red-500">-€{(earnings.platformFees ?? 0).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pagos pendientes */}
                                    {(earnings.pendingPayouts ?? 0) > 0 && (
                                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100 mb-1">Pagos pendientes</p>
                                            <p className="text-2xl font-bold">€{earnings.pendingPayouts.toFixed(2)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Link al panel completo */}
                            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                                <button
                                    onClick={() => navigate('/doctor/earnings')}
                                    className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 mx-auto transition-colors"
                                >
                                    Ver panel completo de ingresos <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        icon={DollarSign}
                        label="Ingresos totales"
                        value={`€${(stats.totalEarnings || 0).toFixed(2)}`}
                        trend={stats.earningsChange}
                        color="emerald"
                    />
                    <StatCard
                        icon={Calendar}
                        label="Citas este mes"
                        value={stats.appointmentsCount || 0}
                        trend={stats.appointmentsChange}
                        color="blue"
                    />
                    <StatCard
                        icon={Users}
                        label="Pacientes"
                        value={stats.patientsCount || 0}
                        color="purple"
                    />
                    <StatCard
                        icon={Star}
                        label="Valoración"
                        value={stats.averageRating > 0 ? `${Number(stats.averageRating).toFixed(1)} ⭐ (${stats.totalReviews})` : 'Sin valoraciones'}
                        color="amber"
                    />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                    <QuickActionCard
                        icon={Calendar}
                        title="Fijar Disponibilidad"
                        description="Configura tu horario"
                        onClick={() => navigate('/doctor/appointments')}
                        color="blue"
                    />
                    <QuickActionCard
                        icon={Video}
                        title="Mis Vídeos"
                        description="Sube contenido educativo"
                        onClick={() => navigate('/doctor/videos')}
                        color="red"
                    />
                    <QuickActionCard
                        icon={BookOpen}
                        title="Mis Cursos"
                        description="Gestiona tus cursos"
                        onClick={() => navigate('/doctor/my-courses')}
                        color="purple"
                    />
                    <QuickActionCard
                        icon={DollarSign}
                        title="Ingresos"
                        description="Panel de facturación"
                        onClick={() => navigate('/doctor/earnings')}
                        color="amber"
                    />
                    <QuickActionCard
                        icon={User}
                        title="Mi Perfil"
                        description="Edita tu información"
                        onClick={() => navigate('/doctor/profile')}
                        color="emerald"
                    />
                </div>

                {/* Chats Premium activos */}
                {chatSubs.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-violet-600" />
                                Chats Premium activos
                                <span className="ml-1 px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-bold rounded-full">
                                    {chatSubs.length}
                                </span>
                            </h3>
                        </div>
                        {/* Buscador de paciente */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar paciente por nombre…"
                                value={chatSearch}
                                onChange={e => setChatSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {chatSubs
                                .filter(sub =>
                                    !chatSearch ||
                                    (sub.patientName ?? '').toLowerCase().includes(chatSearch.toLowerCase())
                                )
                                .map(sub => (
                                <Link
                                    key={sub.id}
                                    to={`/chat/${sub.id}`}
                                    className="flex items-center gap-3 p-3 border border-violet-100 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary-700">
                                        {sub.patientName?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm truncate">{sub.patientName}</p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <Crown className="w-3 h-3 text-violet-500" />
                                            <span className="text-xs text-violet-600">{sub.name}</span>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-violet-400 flex-shrink-0" />
                                </Link>
                            ))}
                        </div>
                        {chatSearch && chatSubs.filter(s => (s.patientName ?? '').toLowerCase().includes(chatSearch.toLowerCase())).length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-4">No hay chats que coincidan con "{chatSearch}"</p>
                        )}
                        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            Los mensajes se almacenan de forma segura conforme a la LOPD
                        </p>
                    </div>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Appointments */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-900 text-lg">Próximas citas</h3>
                        </div>

                        {(stats.recentAppointments || []).length === 0 ? (
                            <div className="text-center py-12">
                                <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-600 font-medium mb-2">No tienes citas próximas</p>
                                <p className="text-slate-500 text-sm">Tus próximas citas aparecerán aquí</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {(stats.recentAppointments || []).map((appointment) => (
                                    <div key={appointment.id} className="p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 transition-all">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-semibold text-slate-900">{appointment.patient}</p>
                                                <p className="text-sm text-slate-600">
                                                    {appointment.date} a las {appointment.time}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(appointment.status)}`}>
                                                    {appointment.status}
                                                </span>
                                                <span className="font-bold text-blue-600">€{appointment.price.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Recent Earnings */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-4">Últimos ingresos</h3>
                            {(stats.recentEarnings || []).length === 0 ? (
                                <p className="text-slate-600 text-sm text-center py-4">Sin ingresos recientes</p>
                            ) : (
                                <div className="space-y-3">
                                    {(stats.recentEarnings || []).slice(0, 5).map((earning) => (
                                        <div key={earning.id} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-slate-900 text-sm">{earning.patient}</p>
                                                <p className="text-xs text-slate-500">{earning.date}</p>
                                            </div>
                                            <span className="font-bold text-emerald-600">+€{earning.amount.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pending Tasks */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-4">Tareas pendientes</h3>
                            {(stats.pendingTasks || []).length === 0 ? (
                                <div className="text-center py-4">
                                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                                    <p className="text-sm text-slate-600">¡Todo al día!</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {(stats.pendingTasks || []).map((task) => (
                                        <div key={task.id} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                                            <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${task.priority === 'high' ? 'text-red-500' : 'text-amber-500'}`} />
                                            <p className="text-sm text-slate-700">{task.task}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Stats Summary */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
                            <h3 className="font-bold mb-4">Resumen</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-blue-100">Cursos publicados</span>
                                    <span className="font-bold text-xl">{stats.publishedCourses || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-blue-100">Vídeos activos</span>
                                    <span className="font-bold text-xl">{stats.uploadedVideos || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Modal 2FA */}
        {show2FAModal && (
            <TwoFactorModal
                onClose={() => setShow2FAModal(false)}
                onSuccess={() => {
                    setShow2FAModal(false);
                    doctorDashboardService.getStats().then(s => setStats(s)).catch(() => {});
                }}
            />
        )}
        </>
    );
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════════════════════

const StatCard = ({ icon: Icon, label, value, trend, color }) => {
    const colors = {
        emerald: 'from-emerald-500 to-green-500',
        blue: 'from-blue-500 to-indigo-500',
        purple: 'from-purple-500 to-pink-500',
        amber: 'from-amber-500 to-orange-500'
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${colors[color]}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-sm font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
            <p className="text-sm text-slate-600">{label}</p>
        </div>
    );
};

const QuickActionCard = ({ icon: Icon, title, description, onClick, color }) => {
    const colors = {
        blue: {
            bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
            hover: 'hover:from-blue-600 hover:to-blue-700',
            shadow: 'shadow-blue-500/50'
        },
        red: {
            bg: 'bg-gradient-to-br from-red-500 to-red-600',
            hover: 'hover:from-red-600 hover:to-red-700',
            shadow: 'shadow-red-500/50'
        },
        purple: {
            bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
            hover: 'hover:from-purple-600 hover:to-purple-700',
            shadow: 'shadow-purple-500/50'
        },
        emerald: {
            bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
            hover: 'hover:from-emerald-600 hover:to-emerald-700',
            shadow: 'shadow-emerald-500/50'
        },
        amber: {
            bg: 'bg-gradient-to-br from-amber-500 to-orange-500',
            hover: 'hover:from-amber-600 hover:to-orange-600',
            shadow: 'shadow-amber-500/50'
        }
    };

    const colorScheme = colors[color] || colors.blue;

    return (
        <button
            onClick={onClick}
            className={`${colorScheme.bg} ${colorScheme.hover} text-white rounded-xl p-6 shadow-lg ${colorScheme.shadow} hover:shadow-xl transition-all transform hover:scale-105 text-left group`}
        >
            <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-white text-lg">{title}</h4>
            </div>
            <p className="text-sm text-white/90">{description}</p>
        </button>
    );
};

export default DoctorDashboard;