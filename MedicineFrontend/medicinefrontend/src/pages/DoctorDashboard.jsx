// ═══════════════════════════════════════════════════════════════
// DoctorDashboard.jsx - Dashboard Principal del Doctor
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, DollarSign, Users, Star, Video, BookOpen,
    Clock, TrendingUp, Award, AlertCircle,
    ArrowRight, FileText, BarChart3, Settings
} from 'lucide-react';

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: Fetch real data from API
        setTimeout(() => {
            setStats({
                status: 'Active',
                profileCompletion: 75,
                thisMonthEarnings: 2450.00,
                upcomingAppointments: 12,
                activePatients: 34,
                averageRating: 4.8,
                totalReviews: 127,
                publishedCourses: 3,
                uploadedVideos: 8,
                recentAppointments: [
                    { id: 1, patient: 'María García', date: '2026-03-10', time: '10:00', status: 'Confirmada', price: 75 },
                    { id: 2, patient: 'Carlos Ruiz', date: '2026-03-10', time: '12:00', status: 'Pendiente', price: 75 },
                    { id: 3, patient: 'Ana López', date: '2026-03-11', time: '09:00', status: 'Confirmada', price: 75 },
                ],
                recentEarnings: [
                    { id: 1, patient: 'Luis Martínez', amount: 75, date: '2026-03-08', status: 'Pagado' },
                    { id: 2, patient: 'Elena Sánchez', amount: 150, date: '2026-03-07', status: 'Pagado' },
                ],
                pendingTasks: [
                    { id: 1, task: 'Completar biografía profesional', priority: 'high' },
                    { id: 2, task: 'Subir vídeo de presentación', priority: 'high' },
                    { id: 3, task: 'Configurar horarios de disponibilidad', priority: 'medium' },
                ]
            });
            setLoading(false);
        }, 1000);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-slate-600 font-medium">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    const getStatusBadge = (status) => {
        const badges = {
            Active: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Activo' },
            PendingReview: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pendiente Revisión' },
            Suspended: { bg: 'bg-red-100', text: 'text-red-700', label: 'Suspendido' }
        };
        const badge = badges[status] || badges.PendingReview;
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Panel Profesional</h1>
                                <p className="text-sm text-slate-600">Dr. Juan Pérez González</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {getStatusBadge(stats.status)}
                            <button
                                onClick={() => navigate('/doctor/settings')}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <Settings className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Profile Completion Alert */}
                {stats.profileCompletion < 100 && (
                    <div className="mb-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-6 shadow-lg">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle className="w-5 h-5" />
                                    <h3 className="font-bold text-lg">Completa tu perfil profesional</h3>
                                </div>
                                <p className="text-white/90 mb-4">
                                    Tu perfil está al {stats.profileCompletion}%. Complétalo para que los pacientes puedan encontrarte.
                                </p>
                                <div className="w-full bg-white/20 rounded-full h-2 mb-4">
                                    <div
                                        className="bg-white h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${stats.profileCompletion}%` }}
                                    />
                                </div>
                                <button
                                    onClick={() => navigate('/doctor/profile/complete')}
                                    className="bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors inline-flex items-center gap-2"
                                >
                                    Completar ahora
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Earnings */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-emerald-600" />
                            </div>
                            <span className="text-emerald-600 text-sm font-semibold flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                +12%
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">€{stats.thisMonthEarnings.toFixed(2)}</h3>
                        <p className="text-slate-600 text-sm">Ingresos este mes</p>
                    </div>

                    {/* Appointments */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">{stats.upcomingAppointments}</h3>
                        <p className="text-slate-600 text-sm">Citas próximas</p>
                    </div>

                    {/* Active Patients */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">{stats.activePatients}</h3>
                        <p className="text-slate-600 text-sm">Pacientes activos</p>
                    </div>

                    {/* Rating */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                <Star className="w-6 h-6 text-amber-500" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2 mb-1">
                            <h3 className="text-3xl font-bold text-slate-900">{stats.averageRating}</h3>
                            <span className="text-slate-500 text-sm">/ 5.0</span>
                        </div>
                        <p className="text-slate-600 text-sm">{stats.totalReviews} valoraciones</p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Acciones rápidas</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <button
                                    onClick={() => navigate('/doctor/profile/complete')}
                                    className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all group"
                                >
                                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <FileText className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700 text-center">Completar perfil</span>
                                </button>

                                <button
                                    onClick={() => navigate('/doctor/availability')}
                                    className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all group"
                                >
                                    <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Clock className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700 text-center">Horarios</span>
                                </button>

                                <button
                                    onClick={() => navigate('/doctor/videos/upload')}
                                    className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 transition-all group"
                                >
                                    <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Video className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700 text-center">Subir vídeo</span>
                                </button>

                                <button
                                    onClick={() => navigate('/doctor/courses/new')}
                                    className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 transition-all group"
                                >
                                    <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <BookOpen className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700 text-center">Nuevo curso</span>
                                </button>

                                <button
                                    onClick={() => navigate('/doctor/earnings')}
                                    className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 transition-all group"
                                >
                                    <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <BarChart3 className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700 text-center">Ingresos</span>
                                </button>

                                <button
                                    onClick={() => navigate('/doctor/pricing')}
                                    className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 hover:from-slate-100 hover:to-gray-100 transition-all group"
                                >
                                    <div className="w-12 h-12 bg-slate-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <DollarSign className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700 text-center">Precios</span>
                                </button>
                            </div>
                        </div>

                        {/* Upcoming Appointments */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-900">Próximas citas</h2>
                                <button
                                    onClick={() => navigate('/doctor/appointments')}
                                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1"
                                >
                                    Ver todas
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-3">
                                {stats.recentAppointments.map((apt) => (
                                    <div
                                        key={apt.id}
                                        className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                                                {apt.patient.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">{apt.patient}</p>
                                                <p className="text-sm text-slate-600">{apt.date} • {apt.time}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${apt.status === 'Confirmada'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {apt.status}
                                            </span>
                                            <span className="font-bold text-slate-900">€{apt.price}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Earnings */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-900">Ingresos recientes</h2>
                                <button
                                    onClick={() => navigate('/doctor/earnings')}
                                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1"
                                >
                                    Ver todos
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-3">
                                {stats.recentEarnings.map((earning) => (
                                    <div
                                        key={earning.id}
                                        className="flex items-center justify-between p-4 rounded-xl bg-emerald-50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                                                <DollarSign className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">{earning.patient}</p>
                                                <p className="text-sm text-slate-600">{earning.date}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-emerald-600 text-lg">+€{earning.amount}</p>
                                            <p className="text-xs text-emerald-700 font-semibold">{earning.status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Pending Tasks */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Tareas pendientes</h2>
                            <div className="space-y-3">
                                {stats.pendingTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        <div className={`w-2 h-2 rounded-full mt-2 ${task.priority === 'high' ? 'bg-red-500' : 'bg-amber-500'
                                            }`} />
                                        <p className="flex-1 text-sm text-slate-700">{task.task}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Stats Summary */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 shadow-lg text-white">
                            <h2 className="text-xl font-bold mb-6">Resumen</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-5 h-5" />
                                        <span>Cursos publicados</span>
                                    </div>
                                    <span className="font-bold text-xl">{stats.publishedCourses}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Video className="w-5 h-5" />
                                        <span>Vídeos subidos</span>
                                    </div>
                                    <span className="font-bold text-xl">{stats.uploadedVideos}</span>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-white/20">
                                    <div className="flex items-center gap-2">
                                        <Award className="w-5 h-5" />
                                        <span>Nivel profesional</span>
                                    </div>
                                    <span className="font-bold text-xl">PRO</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;