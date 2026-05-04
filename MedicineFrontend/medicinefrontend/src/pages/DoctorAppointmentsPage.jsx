// ═══════════════════════════════════════════════════════════════
// DoctorAppointmentsPage.jsx
// Listado completo de citas del doctor
// Route: /doctor/my-appointments
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Calendar, Search, Video, MapPin, Clock,
    ClipboardList, Loader2, UserCircle, Filter
} from 'lucide-react';
import appointmentService from '../services/appointmentService';

const STATUS_COLORS = {
    Confirmada: 'bg-blue-100 text-blue-700',
    Completada: 'bg-green-100 text-green-700',
    Cancelada:  'bg-red-100 text-red-700',
    Pendiente:  'bg-yellow-100 text-yellow-700',
};

const STATUS_OPTIONS = ['Todas', 'Pendiente', 'Confirmada', 'Completada', 'Cancelada'];

const DoctorAppointmentsPage = () => {
    const navigate   = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [search, setSearch]             = useState('');
    const [statusFilter, setStatusFilter] = useState('Todas');
    const [now, setNow]                   = useState(() => new Date());

    useEffect(() => {
        appointmentService.getDoctorAppointments()
            .then(data => setAppointments(data))
            .catch(err => console.error('Error al cargar citas:', err))
            .finally(() => setLoading(false));

        const timer = setInterval(() => setNow(new Date()), 30_000);
        return () => clearInterval(timer);
    }, []);

    const filtered = appointments.filter(a => {
        const matchSearch = !search ||
            (a.patientName ?? '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'Todas' || a.status === statusFilter;
        return matchSearch && matchStatus;
    });

    // Agrupar: próximas (futuras) primero, luego pasadas
    const upcoming = filtered.filter(a => new Date(a.appointmentDate) >= now)
        .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
    const past = filtered.filter(a => new Date(a.appointmentDate) < now)
        .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/doctor/dashboard')}
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Dashboard</span>
                        </button>
                        <span className="text-slate-300">/</span>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            <h1 className="text-lg font-bold text-slate-900">Mis citas</h1>
                        </div>
                    </div>
                    <span className="text-sm text-slate-500">
                        {appointments.length} cita{appointments.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8 space-y-5">
                {/* Controles */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar paciente por nombre…"
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm overflow-x-auto">
                            {STATUS_OPTIONS.map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                                        statusFilter === s
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Contenido */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 text-center">
                        <UserCircle className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                        <p className="font-semibold text-slate-500">
                            {search || statusFilter !== 'Todas'
                                ? 'No hay citas que coincidan con tu búsqueda.'
                                : 'Aún no tienes citas registradas.'}
                        </p>
                    </div>
                ) : (
                    <>
                        {upcoming.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                    Próximas ({upcoming.length})
                                </h2>
                                <div className="space-y-3">
                                    {upcoming.map(appt => (
                                        <AppointmentCard
                                            key={appt.id}
                                            appt={appt}
                                            now={now}
                                            navigate={navigate}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {past.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 mt-2">
                                    Pasadas ({past.length})
                                </h2>
                                <div className="space-y-3 opacity-80">
                                    {past.map(appt => (
                                        <AppointmentCard
                                            key={appt.id}
                                            appt={appt}
                                            now={now}
                                            navigate={navigate}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// ── Tarjeta de cita ──────────────────────────────────────────────
const AppointmentCard = ({ appt, now, navigate }) => {
    const isOnline   = appt.appointmentType === 'online';
    const startTime  = new Date(appt.appointmentDate);
    const duration   = appt.durationMinutes || 30;
    const earlyOpen  = new Date(startTime.getTime() - 5 * 60_000);
    const endTime    = new Date(startTime.getTime() + duration * 60_000);
    const isActive   = now >= earlyOpen && now <= endTime;
    const isUpcoming = now < earlyOpen;
    const showCall   = isOnline && appt.status !== 'Cancelada' && appt.status !== 'Completada';

    return (
        <div className={`bg-white rounded-xl border p-5 shadow-sm transition-all ${
            isActive && showCall ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200'
        }`}>
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                    {(appt.patientName ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-900">{appt.patientName}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[appt.status] || 'bg-gray-100 text-gray-700'}`}>
                            {appt.status}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-1">
                        {startTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        {' · '}
                        {startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        {' – '}
                        {endTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className="flex items-center gap-1">
                        {isOnline
                            ? <Video className="w-3.5 h-3.5 text-blue-500" />
                            : <MapPin className="w-3.5 h-3.5 text-green-500" />
                        }
                        <span className={`text-xs font-medium ${isOnline ? 'text-blue-600' : 'text-green-600'}`}>
                            {isOnline ? 'Online' : 'Presencial'}
                            {appt.price != null && ` · ${appt.price.toFixed(2)} €`}
                        </span>
                    </div>
                    {appt.reason && (
                        <p className="text-xs text-slate-400 mt-1">Motivo: {appt.reason}</p>
                    )}
                </div>

                {/* Acciones */}
                <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                    <button
                        onClick={() => navigate(`/doctor/patients/${appt.patientId}/clinical-history`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                    >
                        <ClipboardList className="w-3.5 h-3.5" />
                        Historial clínico
                    </button>

                    {showCall && (
                        isActive ? (
                            <button
                                onClick={() => navigate(`/videollamada/${appt.id}`)}
                                className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                            >
                                <Video className="w-3.5 h-3.5" />
                                Iniciar videollamada
                            </button>
                        ) : isUpcoming ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg border border-indigo-200">
                                <Clock className="w-3.5 h-3.5" />
                                Disponible a las {startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        ) : null
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoctorAppointmentsPage;
