// ═══════════════════════════════════════════════════════════════
// EarningsPage.jsx - Panel de Ingresos
// SIN MOCKS - Conectado con backend real
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, DollarSign, TrendingUp, TrendingDown, Download,
    Calendar, Users, CreditCard, FileText, Filter
} from 'lucide-react';
import doctorDashboardService from '../services/doctordashboardService';

const TIME_RANGES = [
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: 'year', label: 'Este año' }
];

const FILTER_TYPES = [
    { value: 'all', label: 'Todos' },
    { value: 'appointments', label: 'Consultas' },
    { value: 'courses', label: 'Cursos' }
];

const EarningsPage = () => {
    const navigate = useNavigate();
    const [earnings, setEarnings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('month');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        loadEarnings();
    }, [timeRange, filterType]);

    const loadEarnings = async () => {
        try {
            setLoading(true);
            const data = await doctorDashboardService.getEarnings(timeRange, filterType);
            setEarnings(data);
        } catch (error) {
            console.error('Error al cargar ingresos:', error);
            alert('Error al cargar los ingresos');
        } finally {
            setLoading(false);
        }
    };

    const getTypeColor = (type) => {
        return type === 'appointment' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700';
    };

    const getTypeLabel = (type) => {
        return type === 'appointment' ? 'Consulta' : 'Curso';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Cargando ingresos...</p>
                </div>
            </div>
        );
    }

    if (!earnings) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-600">Error al cargar datos</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate('/doctor')}
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Volver</span>
                        </button>
                        <div className="flex items-center gap-3">
                            {/* Time Range Filter */}
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 hover:border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            >
                                {TIME_RANGES.map(range => (
                                    <option key={range.value} value={range.value}>{range.label}</option>
                                ))}
                            </select>

                            {/* Type Filter */}
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 hover:border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            >
                                {FILTER_TYPES.map(filter => (
                                    <option key={filter.value} value={filter.value}>{filter.label}</option>
                                ))}
                            </select>

                            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2">
                                <Download className="w-4 h-4" />
                                Exportar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Panel de ingresos</h1>
                    <p className="text-slate-600">
                        Seguimiento detallado de tus ganancias y transacciones
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Earnings */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-white" />
                            </div>
                            {earnings.growth >= 0 ? (
                                <div className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                                    <TrendingUp className="w-4 h-4" />
                                    +{earnings.growth.toFixed(1)}%
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-red-600 text-sm font-semibold">
                                    <TrendingDown className="w-4 h-4" />
                                    {earnings.growth.toFixed(1)}%
                                </div>
                            )}
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">€{earnings.total.toFixed(2)}</h3>
                        <p className="text-slate-600 text-sm">Ingresos totales</p>
                    </div>

                    {/* Net Earnings */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                            <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">€{earnings.netEarnings.toFixed(2)}</h3>
                        <p className="text-slate-600 text-sm">Neto (después de comisiones)</p>
                    </div>

                    {/* Sessions */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">{earnings.totalSessions}</h3>
                        <p className="text-slate-600 text-sm">Sesiones completadas</p>
                    </div>

                    {/* Avg Price */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mb-4">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">€{earnings.avgSessionPrice.toFixed(2)}</h3>
                        <p className="text-slate-600 text-sm">Precio promedio</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Transactions List */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Últimas transacciones</h2>

                        {earnings.transactions.length === 0 ? (
                            <div className="text-center py-12">
                                <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-600">No hay transacciones en este período</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {earnings.transactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="p-4 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(transaction.type)}`}>
                                                        {getTypeLabel(transaction.type)}
                                                    </span>
                                                    {transaction.courseName && (
                                                        <span className="text-sm text-slate-600">
                                                            {transaction.courseName}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="font-semibold text-slate-900">{transaction.patient}</p>
                                                <p className="text-sm text-slate-600">{transaction.date}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-emerald-600">
                                                    +€{transaction.netAmount.toFixed(2)}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Bruto: €{transaction.amount.toFixed(2)}
                                                </p>
                                                <p className="text-xs text-red-500">
                                                    Comisión: -€{transaction.platformFee.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Revenue Breakdown */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-4">Desglose de ingresos</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-slate-600">Consultas</span>
                                        <span className="font-bold text-blue-600">€{earnings.fromAppointments.toFixed(2)}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 rounded-full"
                                            style={{
                                                width: `${earnings.total > 0 ? (earnings.fromAppointments / earnings.total) * 100 : 0}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-slate-600">Cursos</span>
                                        <span className="font-bold text-purple-600">€{earnings.fromCourses.toFixed(2)}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-purple-600 rounded-full"
                                            style={{
                                                width: `${earnings.total > 0 ? (earnings.fromCourses / earnings.total) * 100 : 0}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-slate-600">Comisión plataforma (15%)</span>
                                        <span className="font-bold text-red-600">-€{earnings.platformFees.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pending Payouts */}
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
                            <h3 className="font-bold mb-2">Pagos pendientes</h3>
                            <p className="text-3xl font-bold mb-1">€{earnings.pendingPayouts.toFixed(2)}</p>
                            <p className="text-emerald-100 text-sm">Se procesarán en los próximos días</p>
                        </div>

                        {/* Stats */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-4">Estadísticas</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Total pacientes</span>
                                    <span className="font-bold text-slate-900">{earnings.totalPatients}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Sesiones</span>
                                    <span className="font-bold text-slate-900">{earnings.totalSessions}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Precio medio</span>
                                    <span className="font-bold text-emerald-600">€{earnings.avgSessionPrice.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EarningsPage;