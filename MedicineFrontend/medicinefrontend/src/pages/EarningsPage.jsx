// ═══════════════════════════════════════════════════════════════
// EarningsPage.jsx - Panel de Ingresos del Doctor
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, DollarSign, TrendingUp, Calendar, Download,
    Users, BookOpen, CreditCard, Filter, Search, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const EarningsPage = () => {
    const navigate = useNavigate();
    const [timeRange, setTimeRange] = useState('month'); // week, month, year
    const [filterType, setFilterType] = useState('all'); // all, appointments, courses
    const [earnings, setEarnings] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: Fetch from API
        setTimeout(() => {
            setEarnings({
                total: 12450.00,
                thisMonth: 2450.00,
                lastMonth: 2100.00,
                growth: 16.7,
                fromAppointments: 8900.00,
                fromCourses: 3550.00,
                platformFees: 1867.50,
                netEarnings: 10582.50,
                pendingPayouts: 450.00,
                totalPatients: 34,
                totalSessions: 156,
                avgSessionPrice: 75.00,
            });

            setTransactions([
                {
                    id: 1,
                    type: 'appointment',
                    patient: 'María García',
                    amount: 75.00,
                    platformFee: 11.25,
                    netAmount: 63.75,
                    date: '2026-03-09',
                    status: 'completed'
                },
                {
                    id: 2,
                    type: 'course',
                    patient: 'Carlos Ruiz',
                    courseName: 'Nutrición Deportiva Avanzada',
                    amount: 150.00,
                    platformFee: 22.50,
                    netAmount: 127.50,
                    date: '2026-03-08',
                    status: 'completed'
                },
                {
                    id: 3,
                    type: 'appointment',
                    patient: 'Ana López',
                    amount: 75.00,
                    platformFee: 11.25,
                    netAmount: 63.75,
                    date: '2026-03-08',
                    status: 'completed'
                },
                {
                    id: 4,
                    type: 'appointment',
                    patient: 'Luis Martínez',
                    amount: 75.00,
                    platformFee: 11.25,
                    netAmount: 63.75,
                    date: '2026-03-07',
                    status: 'pending'
                },
            ]);

            setLoading(false);
        }, 1000);
    }, [timeRange, filterType]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-slate-600 font-medium">Cargando ingresos...</p>
                </div>
            </div>
        );
    }

    const filteredTransactions = transactions.filter(t => {
        if (filterType === 'all') return true;
        if (filterType === 'appointments') return t.type === 'appointment';
        if (filterType === 'courses') return t.type === 'course';
        return true;
    });

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
                        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Exportar informe
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Panel de ingresos</h1>
                    <p className="text-slate-600">
                        Gestiona tus ganancias y consulta el historial de transacciones
                    </p>
                </div>

                {/* Time Range Selector */}
                <div className="flex items-center gap-3 mb-8">
                    <button
                        onClick={() => setTimeRange('week')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${timeRange === 'week'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        Esta semana
                    </button>
                    <button
                        onClick={() => setTimeRange('month')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${timeRange === 'month'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        Este mes
                    </button>
                    <button
                        onClick={() => setTimeRange('year')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${timeRange === 'year'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        Este año
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Earnings */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-emerald-600" />
                            </div>
                            <span className={`text-sm font-semibold flex items-center gap-1 ${earnings.growth >= 0 ? 'text-emerald-600' : 'text-red-600'
                                }`}>
                                {earnings.growth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                {Math.abs(earnings.growth)}%
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">€{earnings.thisMonth.toFixed(2)}</h3>
                        <p className="text-slate-600 text-sm">Ingresos este mes</p>
                    </div>

                    {/* Net Earnings */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">€{earnings.netEarnings.toFixed(2)}</h3>
                        <p className="text-slate-600 text-sm">Neto después de comisiones</p>
                    </div>

                    {/* Sessions */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">{earnings.totalSessions}</h3>
                        <p className="text-slate-600 text-sm">Sesiones completadas</p>
                    </div>

                    {/* Avg Price */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">€{earnings.avgSessionPrice.toFixed(2)}</h3>
                        <p className="text-slate-600 text-sm">Precio medio por sesión</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Transactions */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-900">Transacciones recientes</h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setFilterType('all')}
                                        className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${filterType === 'all'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        Todas
                                    </button>
                                    <button
                                        onClick={() => setFilterType('appointments')}
                                        className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${filterType === 'appointments'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        Citas
                                    </button>
                                    <button
                                        onClick={() => setFilterType('courses')}
                                        className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${filterType === 'courses'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        Cursos
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {filteredTransactions.map(transaction => (
                                    <div
                                        key={transaction.id}
                                        className="p-4 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${transaction.type === 'appointment'
                                                        ? 'bg-blue-100'
                                                        : 'bg-purple-100'
                                                    }`}>
                                                    {transaction.type === 'appointment' ? (
                                                        <Calendar className="w-5 h-5 text-blue-600" />
                                                    ) : (
                                                        <BookOpen className="w-5 h-5 text-purple-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{transaction.patient}</p>
                                                    <p className="text-sm text-slate-600">
                                                        {transaction.type === 'appointment' ? 'Cita médica' : transaction.courseName}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-emerald-600 text-lg">+€{transaction.amount.toFixed(2)}</p>
                                                <p className="text-xs text-slate-500">
                                                    Neto: €{transaction.netAmount.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span>{transaction.date}</span>
                                            <span className={`px-2 py-1 rounded-full font-semibold ${transaction.status === 'completed'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {transaction.status === 'completed' ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-6">
                        {/* Revenue Breakdown */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-4">Desglose de ingresos</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-slate-600">Citas médicas</span>
                                        <span className="font-bold text-slate-900">€{earnings.fromAppointments.toFixed(2)}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all"
                                            style={{ width: `${(earnings.fromAppointments / earnings.total) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-slate-600">Cursos</span>
                                        <span className="font-bold text-slate-900">€{earnings.fromCourses.toFixed(2)}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div
                                            className="bg-purple-600 h-2 rounded-full transition-all"
                                            style={{ width: `${(earnings.fromCourses / earnings.total) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-slate-600">Comisión plataforma (15%)</span>
                                        <span className="font-bold text-red-600">-€{earnings.platformFees.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-900">Total neto</span>
                                        <span className="font-bold text-emerald-600 text-xl">€{earnings.netEarnings.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pending Payouts */}
                        <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl p-6 border border-amber-200">
                            <div className="flex items-center gap-2 mb-3">
                                <Clock className="w-5 h-5 text-amber-700" />
                                <h3 className="font-bold text-slate-900">Pagos pendientes</h3>
                            </div>
                            <p className="text-3xl font-bold text-amber-700 mb-2">€{earnings.pendingPayouts.toFixed(2)}</p>
                            <p className="text-sm text-slate-700">
                                Se procesarán el próximo día 15
                            </p>
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
                            <h3 className="font-bold mb-4">Estadísticas</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-emerald-100">Pacientes atendidos</span>
                                    <span className="font-bold text-xl">{earnings.totalPatients}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-emerald-100">Sesiones totales</span>
                                    <span className="font-bold text-xl">{earnings.totalSessions}</span>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-white/20">
                                    <span className="text-emerald-100">Tasa de éxito</span>
                                    <span className="font-bold text-xl">98%</span>
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