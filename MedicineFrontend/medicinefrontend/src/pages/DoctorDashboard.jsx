// ═══════════════════════════════════════════════════════════════
// DoctorDashboard.jsx - Dashboard Principal del Doctor
// ✅ Con botón "Ver mi perfil" cuando está completado al 100%
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign, Calendar, Users, Star, TrendingUp, TrendingDown,
    User, Clock, Video, BookOpen, AlertCircle,
    ArrowRight, CheckCircle, Eye
} from 'lucide-react';
import doctorDashboardService from '../services/doctordashboardService';

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

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

                {/* ⚠️ PERFIL INCOMPLETO - Alerta con progreso */}
                {stats.profileCompletion < 100 && (
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-6 mb-8 shadow-lg">
                        <div className="flex items-start gap-4">
                            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <h3 className="font-bold text-lg mb-2">Completa tu perfil profesional</h3>
                                <p className="mb-4 text-white/90">
                                    Tu perfil está al {stats.profileCompletion}%. Completa la información para empezar a recibir pacientes.
                                </p>

                                {/* Barra de progreso */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-white/90">Progreso</span>
                                        <span className="text-sm font-bold text-white">{stats.profileCompletion}%</span>
                                    </div>
                                    <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-white h-full rounded-full transition-all duration-500 ease-out shadow-lg"
                                            style={{ width: `${stats.profileCompletion}%` }}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate('/doctor/profile/complete')}
                                    className="px-6 py-2.5 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors shadow-md hover:shadow-lg"
                                >
                                    Completar ahora
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Earnings */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-white" />
                            </div>
                            {stats.growth >= 0 ? (
                                <div className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                                    <TrendingUp className="w-4 h-4" />
                                    +{stats.growth.toFixed(1)}%
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-red-600 text-sm font-semibold">
                                    <TrendingDown className="w-4 h-4" />
                                    {stats.growth.toFixed(1)}%
                                </div>
                            )}
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">€{stats.thisMonthEarnings.toFixed(2)}</h3>
                        <p className="text-slate-600 text-sm">Ingresos este mes</p>
                    </div>

                    {/* Appointments */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">{stats.thisMonthAppointments}</h3>
                        <p className="text-slate-600 text-sm">Citas este mes</p>
                    </div>

                    {/* Total Patients */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">{stats.totalPatients}</h3>
                        <p className="text-slate-600 text-sm">Pacientes totales</p>
                    </div>

                    {/* Average Rating */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                                <Star className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">{stats.averageRating.toFixed(1)}</h3>
                        <p className="text-slate-600 text-sm">Valoración media</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <button
                        onClick={() => navigate('/doctor/appointments')}
                        className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all text-center"
                    >
                        <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-700">Disponibilidad</p>
                    </button>

                    <button
                        onClick={() => navigate('/doctor/videos/upload')}
                        className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-red-200 transition-all text-center"
                    >
                        <Video className="w-6 h-6 text-red-600 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-700">Subir vídeo</p>
                    </button>

                    <button
                        onClick={() => navigate('/doctor/courses/new')}
                        className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-emerald-200 transition-all text-center"
                    >
                        <BookOpen className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-700">Nuevo curso</p>
                    </button>

                    <button
                        onClick={() => navigate('/doctor/earnings')}
                        className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-green-200 transition-all text-center"
                    >
                        <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-700">Ingresos</p>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Appointments */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Próximas citas</h2>
                            <button
                                onClick={() => navigate('/doctor/appointments')}
                                className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1"
                            >
                                Ver todas
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        {stats.recentAppointments.length === 0 ? (
                            <div className="text-center py-12">
                                <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-600">No tienes citas próximas</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {stats.recentAppointments.map((appointment) => (
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
                            {stats.recentEarnings.length === 0 ? (
                                <p className="text-slate-600 text-sm text-center py-4">Sin ingresos recientes</p>
                            ) : (
                                <div className="space-y-3">
                                    {stats.recentEarnings.slice(0, 5).map((earning) => (
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
                            {stats.pendingTasks.length === 0 ? (
                                <div className="text-center py-4">
                                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                                    <p className="text-sm text-slate-600">¡Todo al día!</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {stats.pendingTasks.map((task) => (
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
                                    <span className="font-bold text-xl">{stats.publishedCourses}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-blue-100">Vídeos activos</span>
                                    <span className="font-bold text-xl">{stats.uploadedVideos}</span>
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