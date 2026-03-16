// ═══════════════════════════════════════════════════════════════
// PricingPage.jsx - Configuración de Precios
// SIN MOCKS - Conectado con backend real
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, DollarSign, TrendingUp, Package, Info
} from 'lucide-react';
import doctorDashboardService from '../services/doctordashboardService';

const PricingPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [pricePerSession, setPricePerSession] = useState('');
    const [packagePrices, setPackagePrices] = useState({
        single: 0,
        pack3: 0,
        pack5: 0,
        pack10: 0
    });

    useEffect(() => {
        loadPricing();
    }, []);

    useEffect(() => {
        if (pricePerSession) {
            calculatePackages();
        }
    }, [pricePerSession]);

    const loadPricing = async () => {
        try {
            setLoadingData(true);
            const data = await doctorDashboardService.getPricing();
            setPricePerSession(data.pricePerSession.toString());
            setPackagePrices(data.packagePrices);
        } catch (error) {
            console.error('Error al cargar precios:', error);
            alert('Error al cargar la configuración de precios');
        } finally {
            setLoadingData(false);
        }
    };

    const calculatePackages = () => {
        const base = parseFloat(pricePerSession) || 0;
        setPackagePrices({
            single: base,
            pack3: base * 3 * 0.95,      // 5% descuento
            pack5: base * 5 * 0.917,     // 8.3% descuento
            pack10: base * 10 * 0.85     // 15% descuento
        });
    };

    const handleSave = async () => {
        if (!pricePerSession || parseFloat(pricePerSession) <= 0) {
            alert('Introduce un precio válido');
            return;
        }

        setLoading(true);

        try {
            await doctorDashboardService.updatePricing({
                pricePerSession: parseFloat(pricePerSession)
            });

            alert('✅ Precios actualizados correctamente');
            navigate('/doctor/dashboard');

        } catch (error) {
            console.error('Error al guardar:', error);
            alert('❌ Error al actualizar los precios');
        } finally {
            setLoading(false);
        }
    };

    const calculateEarnings = (price) => {
        const platformFee = price * 0.15;
        const netEarnings = price - platformFee;
        return { platformFee, netEarnings };
    };

    if (loadingData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-amber-50 to-yellow-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Cargando precios...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-yellow-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate('/doctor/dashboard')}
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Volver</span>
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-6 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-lg font-semibold hover:from-amber-700 hover:to-yellow-700 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Guardar cambios
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Configuración de precios</h1>
                    <p className="text-slate-600">
                        Define tu precio por sesión y genera automáticamente paquetes con descuentos
                    </p>
                </div>

                {/* Base Price */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-amber-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Precio base por sesión</h2>
                    </div>

                    <div className="max-w-md">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Precio por consulta (€)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-xl">
                                €
                            </span>
                            <input
                                type="number"
                                value={pricePerSession}
                                onChange={(e) => setPricePerSession(e.target.value)}
                                min="0"
                                step="0.01"
                                placeholder="75.00"
                                className="w-full pl-12 pr-4 py-4 text-2xl font-bold rounded-lg border-2 border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                        </div>
                        <p className="text-sm text-slate-500 mt-2">
                            Este será el precio que verán los pacientes para una sesión individual
                        </p>
                    </div>
                </div>

                {/* Package Prices */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-purple-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Paquetes con descuento</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Single */}
                        <div className="p-6 rounded-xl border-2 border-slate-200 bg-slate-50">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-slate-900">1 Sesión</h3>
                                <span className="text-xs text-slate-500">Precio base</span>
                            </div>
                            <p className="text-3xl font-bold text-slate-900 mb-1">
                                €{packagePrices.single.toFixed(2)}
                            </p>
                            <p className="text-sm text-slate-600">Por sesión: €{packagePrices.single.toFixed(2)}</p>
                        </div>

                        {/* Pack 3 */}
                        <div className="p-6 rounded-xl border-2 border-blue-200 bg-blue-50">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-slate-900">3 Sesiones</h3>
                                <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                                    -5%
                                </span>
                            </div>
                            <p className="text-3xl font-bold text-blue-600 mb-1">
                                €{packagePrices.pack3.toFixed(2)}
                            </p>
                            <p className="text-sm text-slate-600">
                                Por sesión: €{(packagePrices.pack3 / 3).toFixed(2)}
                            </p>
                        </div>

                        {/* Pack 5 */}
                        <div className="p-6 rounded-xl border-2 border-purple-200 bg-purple-50">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-slate-900">5 Sesiones</h3>
                                <span className="px-2 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
                                    -8.3%
                                </span>
                            </div>
                            <p className="text-3xl font-bold text-purple-600 mb-1">
                                €{packagePrices.pack5.toFixed(2)}
                            </p>
                            <p className="text-sm text-slate-600">
                                Por sesión: €{(packagePrices.pack5 / 5).toFixed(2)}
                            </p>
                        </div>

                        {/* Pack 10 */}
                        <div className="p-6 rounded-xl border-2 border-emerald-200 bg-emerald-50">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-slate-900">10 Sesiones</h3>
                                <span className="px-2 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full">
                                    -15%
                                </span>
                            </div>
                            <p className="text-3xl font-bold text-emerald-600 mb-1">
                                €{packagePrices.pack10.toFixed(2)}
                            </p>
                            <p className="text-sm text-slate-600">
                                Por sesión: €{(packagePrices.pack10 / 10).toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Earnings Breakdown */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Desglose de ingresos</h2>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6 mb-6">
                        <h3 className="font-semibold text-slate-900 mb-4">Por sesión individual:</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600">Precio bruto</span>
                                <span className="font-bold text-slate-900">
                                    €{packagePrices.single.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600">Comisión plataforma (15%)</span>
                                <span className="font-bold text-red-600">
                                    -€{calculateEarnings(packagePrices.single).platformFee.toFixed(2)}
                                </span>
                            </div>
                            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                                <span className="text-slate-900 font-semibold">Ganancias netas</span>
                                <span className="font-bold text-2xl text-emerald-600">
                                    €{calculateEarnings(packagePrices.single).netEarnings.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-amber-900 mb-2">Precio recomendado</h4>
                                <p className="text-sm text-amber-800">
                                    El precio promedio en la plataforma es de <strong>€75-85 por sesión</strong>.
                                    Considera tu experiencia, especialización y mercado local al definir tus precios.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;