// ═══════════════════════════════════════════════════════════════
// DoctorDashboard.jsx - Dashboard Principal del Doctor
// ✅ Con sección de Redes Sociales integrada
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
import SocialMediaSection from '../components/SocialMediaSection';

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

                {/* ✅ NUEVA SECCIÓN: Redes Sociales */}
                <div className="mb-8">
                    <SocialMediaSection />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                        value={stats.rating ? `${stats.rating.toFixed(1)} ⭐` : 'Sin valoraciones'}
                        color="amber"
                    />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <QuickActionCard
                        icon={Calendar}
                        title="Ver Citas"
                        description="Gestiona tus citas"
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
                        onClick={() => navigate('/doctor/courses')}
                        color="purple"
                    />
                    <QuickActionCard
                        icon={User}
                        title="Mi Perfil"
                        description="Edita tu información"
                        onClick={() => navigate('/doctor/profile')}
                        color="emerald"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Appointments */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-900 text-lg">Próximas citas</h3>
                            <button
                                onClick={() => navigate('/doctor/appointments')}
                                className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1"
                            >
                                Ver todas <ArrowRight className="w-4 h-4" />
                            </button>
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