import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import patientService from '../services/patientService';
import api from '../services/api';
import ProfileCompletionAlert from '../components/ProfileCompletionAlert';
import { Calendar, FileText, GraduationCap, User, Clock, Video, MapPin, ChevronDown, ChevronUp, ExternalLink, XCircle, Phone, Pencil, Check, X } from 'lucide-react';
import PhoneInput from '../components/PhoneInput';
import { Link } from 'react-router-dom';

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
    const isOnline = appointment.appointmentType === 'online';
    const isFuture = new Date(appointment.appointmentDate) > new Date();
    const isCancellable = isFuture && appointment.status !== 'Cancelada' && appointment.status !== 'Completada';

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
                        {isOnline && appointment.meetingLink && (
                            <a
                                href={appointment.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                                <ExternalLink className="w-3 h-3" />
                                {t('patientDashboard.appointment.joinCall')} {appointment.meetingPlatform ? `· ${appointment.meetingPlatform}` : ''}
                            </a>
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

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                        <Calendar className="w-8 h-8 text-blue-500" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{upcomingAppointments}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{t('patientDashboard.stats.scheduledAppointments')}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                        <FileText className="w-8 h-8 text-green-500" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{completedAppointments}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{t('patientDashboard.stats.completedConsultations')}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                        <GraduationCap className="w-8 h-8 text-purple-500" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{enrolledCourses}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{t('patientDashboard.stats.enrolledCourses')}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                        <User className="w-8 h-8 text-orange-500" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profileCompletion}%</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{t('patientDashboard.stats.profileCompleted')}</p>
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
    );
};

export default PatientDashboard;
