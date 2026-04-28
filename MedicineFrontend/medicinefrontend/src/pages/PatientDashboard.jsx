import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import patientService from '../services/patientService';
import chatService from '../services/chatService';
import professionalsService from '../services/professionalsService';
import api from '../services/api';
import ProfileCompletionAlert from '../components/ProfileCompletionAlert';
import BookingModal from '../components/BookingModal';
import { Calendar, FileText, GraduationCap, User, Clock, Video, MapPin, ChevronDown, ChevronUp, XCircle, Phone, Pencil, Check, X, MessageCircle, Crown, Zap, Stethoscope, CalendarPlus, Loader2 } from 'lucide-react';
import PhoneInput from '../components/PhoneInput';
import { Link, useNavigate } from 'react-router-dom';

// ── Helpers ─────────────────────────────────────────────────────
const STATUS_COLORS = {
    Confirmada: 'bg-blue-100 text-blue-700',
    Pendiente:  'bg-yellow-100 text-yellow-700',
    Completada: 'bg-green-100 text-green-700',
    Cancelada:  'bg-red-100 text-red-700',
};

const LOCALE_MAP = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', de: 'de-DE' };

const formatAppointmentDate = (dateStr, locale = 'es-ES') => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
        + ' · ' + d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
};

const getInitials = (name = '') =>
    name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

// ── Appointment Card ─────────────────────────────────────────────
const AppointmentCard = ({ appointment, onCancel }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [now, setNow] = useState(() => new Date());

    // Actualizar "ahora" cada 30 segundos para habilitar/deshabilitar el botón
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 30_000);
        return () => clearInterval(timer);
    }, []);

    const isOnline    = appointment.appointmentType === 'online';
    const startTime   = new Date(appointment.appointmentDate);
    const duration    = appointment.durationMinutes || 30;
    const earlyOpen   = new Date(startTime.getTime() - 5 * 60_000);    // 5 min antes
    const endTime     = new Date(startTime.getTime() + duration * 60_000);
    const isFuture    = startTime > now;
    const isActive    = now >= earlyOpen && now <= endTime;
    const isUpcoming  = now < earlyOpen;
    const isCancellable = isFuture && appointment.status !== 'Cancelada' && appointment.status !== 'Completada';

    // Botón habilitado solo dentro de la ventana de la cita
    const showCallButton = isOnline
        && appointment.status !== 'Cancelada'
        && appointment.status !== 'Completada';
    const canJoinCall    = showCallButton && isActive;
    const callIsUpcoming = showCallButton && isUpcoming;

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
            <div className="flex items-start gap-3">
                {/* Avatar */}
                {appointment.doctorProfilePicture ? (
                    <img
                        src={appointment.doctorProfilePicture}
                        alt={appointment.doctorName}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-300">
                            {getInitials(appointment.doctorName)}
                        </span>
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{appointment.doctorName}</p>
                        {/* Status badge */}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[appointment.status] || 'bg-gray-100 text-gray-600'}`}>
                            {appointment.status}
                        </span>
                        {/* Type badge */}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${isOnline ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-700'}`}>
                            {isOnline ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                            {isOnline ? 'Online' : t('patientDashboard.appointment.inPerson')}
                        </span>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatAppointmentDate(appointment.appointmentDate)}
                        {appointment.durationMinutes && ` · ${appointment.durationMinutes} min`}
                    </p>

                    {appointment.price != null && (
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{appointment.price.toFixed(2)} €</p>
                    )}

                    {appointment.reason && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-2 line-clamp-1">
                            {t('patientDashboard.appointment.reason')} {appointment.reason}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        {canJoinCall && (
                            <button
                                onClick={() => navigate(`/videollamada/${appointment.id}`)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                            >
                                <Video className="w-3 h-3" />
                                Unirse a videollamada
                            </button>
                        )}
                        {callIsUpcoming && (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-medium rounded-lg border border-indigo-200 dark:border-indigo-700">
                                <Clock className="w-3 h-3" />
                                Disponible a las {startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}

                        {isCancellable && (
                            <button
                                onClick={() => onCancel(appointment)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg border border-red-200 transition-colors"
                            >
                                <XCircle className="w-3 h-3" />
                                {t('patientDashboard.appointment.cancel')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const PatientDashboard = () => {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const locale = LOCALE_MAP[language] || 'es-ES';
    const queryClient = useQueryClient();
    const [showHistory, setShowHistory] = useState(false);
    const [cancellingId, setCancellingId] = useState(null);
    const [editingPhone, setEditingPhone] = useState(false);
    const [phoneInput, setPhoneInput] = useState('');
    const [savingPhone, setSavingPhone] = useState(false);
    // Modal de reserva rápida desde "Mis profesionales"
    const [bookingPro, setBookingPro] = useState(null);      // professional completo
    const [loadingBookingPro, setLoadingBookingPro] = useState(false);

    // Obtener datos del paciente
    const { data: profileData, isLoading: isLoadingProfile } = useQuery({
        queryKey: ['patient-profile'],
        queryFn: patientService.getMyProfile,
        enabled: !!user && user.role === 'Patient',
    });

    // Obtener citas del paciente
    const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery({
        queryKey: ['patient-appointments'],
        queryFn: async () => {
            const response = await api.get('/patients/me/appointments');
            return response.data;
        },
        enabled: !!user && user.role === 'Patient',
    });

    // Obtener cursos del paciente
    const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
        queryKey: ['patient-courses'],
        queryFn: async () => {
            const response = await api.get('/patients/me/courses');
            return response.data;
        },
        enabled: !!user && user.role === 'Patient',
    });

    // Obtener suscripciones de chat del paciente
    const { data: chatSubscriptions = [] } = useQuery({
        queryKey: ['my-chat-subscriptions'],
        queryFn: chatService.getMySubscriptions,
        enabled: !!user && user.role === 'Patient',
        refetchInterval: 60000, // refrescar cada minuto para detectar expiradas
    });

    const activeChats = chatSubscriptions.filter(s => s.status === 'Active');

    // ── Mis profesionales: consolidar doctores de citas + chats sin duplicados ──
    const myProfessionals = (() => {
        const map = new Map(); // doctorId → { doctorId, name, picture, specialty, chatSub, lastAppointment }

        // 1. Agregar desde citas (cualquier estado excepto cancelada)
        appointments
            .filter(a => a.status !== 'Cancelada')
            .forEach(a => {
                if (!map.has(a.doctorId)) {
                    map.set(a.doctorId, {
                        doctorId:   a.doctorId,
                        name:       a.doctorName,
                        picture:    a.doctorProfilePicture,
                        specialty:  a.doctorSpecialty ?? null,
                        chatSub:    null,
                        lastAppointment: a.appointmentDate,
                    });
                } else {
                    // guardar la cita más reciente
                    const entry = map.get(a.doctorId);
                    if (new Date(a.appointmentDate) > new Date(entry.lastAppointment)) {
                        entry.lastAppointment = a.appointmentDate;
                    }
                }
            });

        // 2. Sobreescribir / añadir suscripciones de chat activas
        chatSubscriptions.forEach(sub => {
            const existing = map.get(sub.doctorId);
            if (existing) {
                existing.chatSub = sub;
                if (!existing.picture) existing.picture = sub.doctorProfilePictureUrl;
            } else {
                map.set(sub.doctorId, {
                    doctorId:   sub.doctorId,
                    name:       sub.doctorName,
                    picture:    sub.doctorProfilePictureUrl,
                    specialty:  null,
                    chatSub:    sub,
                    lastAppointment: null,
                });
            }
        });

        // 3. Ordenar: primero los que tienen chat activo, luego por nombre
        return [...map.values()].sort((a, b) => {
            const aActive = a.chatSub?.status === 'Active' ? 0 : 1;
            const bActive = b.chatSub?.status === 'Active' ? 0 : 1;
            if (aActive !== bActive) return aActive - bActive;
            return a.name.localeCompare(b.name);
        });
    })();

    // Cancel appointment handler
    const handleCancelAppointment = async (appointment) => {
        const confirmed = window.confirm(
            t('patientDashboard.appointment.cancelConfirm')
                .replace('{doctor}', appointment.doctorName)
                .replace('{date}', formatAppointmentDate(appointment.appointmentDate, locale))
        );
        if (!confirmed) return;
        setCancellingId(appointment.id);
        try {
            await api.put(`/appointments/${appointment.id}/cancel`, { reason: '' });
            queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
        } catch (err) {
            alert(t('patientDashboard.appointment.cancelError'));
        } finally {
            setCancellingId(null);
        }
    };

    // Abrir BookingModal con datos completos del profesional
    const handleQuickBook = async (doctorId) => {
        setLoadingBookingPro(true);
        try {
            const pro = await professionalsService.getById(doctorId);
            setBookingPro(pro);
        } catch {
            alert('No se pudo cargar la información del profesional. Inténtalo de nuevo.');
        } finally {
            setLoadingBookingPro(false);
        }
    };

    const handleEditPhone = () => {
        setPhoneInput(patient?.phoneNumber || '');
        setEditingPhone(true);
    };

    const handleSavePhone = async () => {
        if (!phoneInput.trim()) return;
        setSavingPhone(true);
        try {
            await patientService.updateProfile({ phoneNumber: phoneInput.trim() });
            queryClient.invalidateQueries({ queryKey: ['patient-profile'] });
            setEditingPhone(false);
        } catch {
            alert(t('patientDashboard.phoneUpdateError'));
        } finally {
            setSavingPhone(false);
        }
    };

    const patient = profileData?.patient || profileData;
    const profileCompletion = profileData?.profileCompletion ??
        (profileData ? patientService.getProfileCompletion(profileData) : 0);
    const missingFields = patient ? patientService.getMissingFields(profileData) : [];

    // Calcular estadísticas reales
    const now = new Date();

    const upcomingList = appointments
        .filter(apt => apt.status !== 'Cancelada' && new Date(apt.appointmentDate) > now)
        .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));

    const pastList = appointments
        .filter(apt => apt.status === 'Completada' || apt.status === 'Cancelada' || new Date(apt.appointmentDate) <= now)
        .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

    const upcomingAppointments = upcomingList.length;

    const completedAppointments = appointments.filter(
        apt => apt.status === 'Completada'
    ).length;

    const enrolledCourses = courses.length;

    const isLoading = isLoadingProfile || isLoadingAppointments || isLoadingCourses;
    const activeChatCount = activeChats.length;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <>
        <div className="container-custom py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {t('patientDashboard.welcomePrefix')} {patient?.firstName} 👋
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    {t('patientDashboard.subtitle')}
                </p>
            </div>

            {/* Teléfono de contacto */}
            <div className="mb-6 flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 px-5 py-4">
                <Phone className="w-5 h-5 text-primary-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-1">
                    {t('patientDashboard.phoneLabel')}
                </span>

                {editingPhone ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                            <PhoneInput
                                value={phoneInput}
                                onChange={setPhoneInput}
                            />
                        </div>
                        <button
                            onClick={handleSavePhone}
                            disabled={savingPhone || !phoneInput.replace(/^\+\d{1,4}/, '')}
                            className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 transition-colors flex-shrink-0"
                        >
                            {savingPhone
                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <Check className="w-4 h-4" />
                            }
                        </button>
                        <button
                            onClick={() => setEditingPhone(false)}
                            className="p-1.5 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg transition-colors flex-shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1">
                            {patient?.phoneNumber || (
                                <span className="text-gray-400 italic">{t('patientDashboard.phoneNotSet')}</span>
                            )}
                        </span>
                        <button
                            onClick={handleEditPhone}
                            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                            {t('patientDashboard.phoneEdit')}
                        </button>
                    </>
                )}
            </div>

            {/* Alerta de perfil incompleto */}
            {profileCompletion < 100 && (
                <div className="mb-8">
                    <ProfileCompletionAlert
                        completion={profileCompletion}
                        missingFields={missingFields}
                    />
                </div>
            )}

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
                    <div className="flex items-center justify-between mb-2">
                        <Calendar className="w-7 h-7 text-blue-500" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{upcomingAppointments}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">{t('patientDashboard.stats.scheduledAppointments')}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
                    <div className="flex items-center justify-between mb-2">
                        <FileText className="w-7 h-7 text-green-500" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{completedAppointments}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">{t('patientDashboard.stats.completedConsultations')}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
                    <div className="flex items-center justify-between mb-2">
                        <GraduationCap className="w-7 h-7 text-purple-500" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{enrolledCourses}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">{t('patientDashboard.stats.enrolledCourses')}</p>
                </div>

                {/* Chat Premium stat */}
                <div className={`rounded-xl shadow-md p-5 ${activeChatCount > 0 ? 'bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700' : 'bg-white dark:bg-gray-800'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <MessageCircle className={`w-7 h-7 ${activeChatCount > 0 ? 'text-violet-500' : 'text-gray-400'}`} />
                        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{activeChatCount}</span>
                    </div>
                    <p className={`text-xs ${activeChatCount > 0 ? 'text-violet-600 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                        Chats Premium activos
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
                    <div className="flex items-center justify-between mb-2">
                        <User className="w-7 h-7 text-orange-500" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profileCompletion}%</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">{t('patientDashboard.stats.profileCompleted')}</p>
                </div>
            </div>

            {/* Acciones rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-6 text-white">
                    <h3 className="text-xl font-bold mb-2">{t('patientDashboard.bookAppointment.title')}</h3>
                    <p className="text-primary-100 mb-4">
                        {t('patientDashboard.bookAppointment.desc')}
                    </p>
                    <Link
                        to="/doctors"
                        className="inline-flex items-center gap-2 bg-white text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                        {t('patientDashboard.bookAppointment.btn')}
                        <Calendar className="w-4 h-4" />
                    </Link>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 text-white">
                    <h3 className="text-xl font-bold mb-2">{t('patientDashboard.exploreCourses.title')}</h3>
                    <p className="text-purple-100 mb-4">
                        {t('patientDashboard.exploreCourses.desc')}
                    </p>
                    <Link
                        to="/courses"
                        className="inline-flex items-center gap-2 bg-white text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                        {t('patientDashboard.exploreCourses.btn')}
                        <GraduationCap className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Próximas citas */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Clock className="w-6 h-6 text-primary-600" />
                    {t('patientDashboard.upcomingAppointments.title')}
                    {upcomingList.length > 0 && (
                        <span className="ml-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-bold rounded-full">
                            {upcomingList.length}
                        </span>
                    )}
                </h2>

                {upcomingList.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm">{t('patientDashboard.upcomingAppointments.empty')}</p>
                        <Link
                            to="/doctors"
                            className="text-primary-600 hover:text-primary-700 font-semibold text-sm mt-2 inline-block"
                        >
                            {t('patientDashboard.upcomingAppointments.book')}
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {upcomingList.map(apt => (
                            <AppointmentCard
                                key={apt.id}
                                appointment={apt}
                                onCancel={handleCancelAppointment}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Historial de citas (collapsible) */}
            {pastList.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
                    <button
                        onClick={() => setShowHistory(v => !v)}
                        className="w-full flex items-center justify-between"
                    >
                        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                            <FileText className="w-6 h-6 text-gray-500" />
                            {t('patientDashboard.appointmentHistory.title')}
                            <span className="ml-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-full">
                                {pastList.length}
                            </span>
                        </h2>
                        {showHistory
                            ? <ChevronUp className="w-5 h-5 text-gray-400" />
                            : <ChevronDown className="w-5 h-5 text-gray-400" />
                        }
                    </button>

                    {showHistory && (
                        <div className="mt-4 space-y-3">
                            {pastList.map(apt => (
                                <AppointmentCard
                                    key={apt.id}
                                    appointment={apt}
                                    onCancel={handleCancelAppointment}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Mis profesionales ── */}
            {myProfessionals.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
                    <h2 className="text-xl font-bold mb-5 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <Stethoscope className="w-6 h-6 text-primary-600" />
                        Mis profesionales
                        <span className="ml-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-bold rounded-full">
                            {myProfessionals.length}
                        </span>
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {myProfessionals.map(pro => {
                            const avatarUrl = pro.picture ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.name)}&background=3b82f6&color=fff&size=160&bold=true`;
                            const hasActiveChat = pro.chatSub?.status === 'Active';
                            const hasExpiredChat = pro.chatSub && !hasActiveChat;
                            const daysLeft = hasActiveChat && pro.chatSub.endDate
                                ? Math.max(0, Math.ceil((new Date(pro.chatSub.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
                                : 0;

                            return (
                                <div
                                    key={pro.doctorId}
                                    className="flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 overflow-hidden hover:shadow-md transition-all"
                                >
                                    {/* Header */}
                                    <div className="flex items-center gap-3 p-4">
                                        <img
                                            src={avatarUrl}
                                            alt={pro.name}
                                            className="w-14 h-14 rounded-full object-cover flex-shrink-0 border-2 border-white dark:border-gray-600 shadow-sm"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 dark:text-gray-100 truncate">
                                                Dr. {pro.name}
                                            </p>
                                            {pro.specialty && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{pro.specialty}</p>
                                            )}
                                            {/* Badge Premium */}
                                            {hasActiveChat && (
                                                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-semibold rounded-full">
                                                    <Crown className="w-3 h-3" />
                                                    Premium · {daysLeft}d restantes
                                                </span>
                                            )}
                                            {hasExpiredChat && (
                                                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">
                                                    <Crown className="w-3 h-3" />
                                                    Premium expirado
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex gap-2 px-4 pb-4 mt-auto">
                                        <button
                                            onClick={() => handleQuickBook(pro.doctorId)}
                                            disabled={loadingBookingPro}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                                        >
                                            {loadingBookingPro
                                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                : <CalendarPlus className="w-3.5 h-3.5" />
                                            }
                                            Reservar
                                        </button>
                                        {hasActiveChat && (
                                            <Link
                                                to={`/chat/${pro.chatSub.id}`}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors"
                                            >
                                                <MessageCircle className="w-3.5 h-3.5" />
                                                Chat
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Mis chats Premium */}
            {chatSubscriptions.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <MessageCircle className="w-6 h-6 text-violet-600" />
                        Mis chats Premium
                        <span className="ml-1 px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-bold rounded-full">
                            {activeChats.length} activo{activeChats.length !== 1 ? 's' : ''}
                        </span>
                    </h2>

                    <div className="space-y-3">
                        {chatSubscriptions.map(sub => {
                            const isExpired = sub.status === 'Expired' || sub.isReadOnly;
                            const daysLeft = sub.endDate
                                ? Math.max(0, Math.ceil((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
                                : 0;

                            return (
                                <div
                                    key={sub.id}
                                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                                        isExpired
                                            ? 'border-gray-200 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600'
                                            : 'border-violet-200 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-700 hover:shadow-md'
                                    }`}
                                >
                                    <img
                                        src={sub.doctorProfilePictureUrl ||
                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(sub.doctorName)}&background=3b82f6&color=fff&size=80&bold=true`}
                                        alt={sub.doctorName}
                                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                                    />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                Dr. {sub.doctorName}
                                            </p>
                                            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                isExpired
                                                    ? 'bg-gray-200 text-gray-500'
                                                    : 'bg-violet-100 text-violet-700'
                                            }`}>
                                                <Crown className="w-3 h-3" />
                                                {sub.planName}
                                            </span>
                                            {sub.unreadCount > 0 && (
                                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                    {sub.unreadCount} nuevo{sub.unreadCount !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {isExpired ? (
                                                <span className="text-red-500">Expirado</span>
                                            ) : (
                                                <span className="text-violet-600 font-medium">
                                                    {daysLeft} día{daysLeft !== 1 ? 's' : ''} restante{daysLeft !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                            {sub.lastMessage && (
                                                <>
                                                    <span>·</span>
                                                    <span className="truncate max-w-[180px]">{sub.lastMessage.content}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <Link
                                        to={`/chat/${sub.id}`}
                                        className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                            isExpired
                                                ? 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300'
                                                : 'bg-violet-600 text-white hover:bg-violet-700'
                                        }`}
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        {isExpired ? 'Ver historial' : 'Abrir chat'}
                                    </Link>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <Link
                            to="/professionals"
                            className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 font-semibold"
                        >
                            <Zap className="w-4 h-4" />
                            Contratar chat Premium con otro profesional →
                        </Link>
                    </div>
                </div>
            )}

            {/* Mis cursos */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <GraduationCap className="w-6 h-6 text-primary-600" />
                    {t('patientDashboard.myCourses.title')} ({enrolledCourses})
                </h2>

                {courses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm mb-2">{t('patientDashboard.myCourses.empty')}</p>
                        <Link
                            to="/courses"
                            className="text-primary-600 hover:text-primary-700 font-semibold text-sm mt-2 inline-block"
                        >
                            {t('patientDashboard.myCourses.explore')}
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {courses.slice(0, 3).map((enrollment) => (
                            <div key={enrollment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow dark:bg-gray-750">
                                {enrollment.course.coverImageUrl && (
                                    <img
                                        src={enrollment.course.coverImageUrl}
                                        alt={enrollment.course.title}
                                        className="w-full h-32 object-cover rounded-lg mb-3"
                                    />
                                )}
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                                    {enrollment.course.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                    {enrollment.course.description}
                                </p>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">{t('patientDashboard.myCourses.progress')}</span>
                                    <span className="font-semibold text-primary-600">{enrollment.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                                    <div
                                        className="bg-primary-600 h-2 rounded-full transition-all"
                                        style={{ width: `${enrollment.progress}%` }}
                                    />
                                </div>
                                {enrollment.isCompleted && (
                                    <span className="inline-block mt-3 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-semibold rounded-full">
                                        {t('patientDashboard.myCourses.completed')}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {courses.length > 3 && (
                    <div className="text-center mt-4">
                        <Link
                            to="/my-courses"
                            className="text-primary-600 hover:text-primary-700 font-semibold text-sm"
                        >
                            {t('patientDashboard.myCourses.viewAll')}
                        </Link>
                    </div>
                )}
            </div>
        </div>

        {bookingPro && (
            <BookingModal
                professional={bookingPro}
                onClose={() => setBookingPro(null)}
            />
        )}
        </>
    );
};

export default PatientDashboard;
