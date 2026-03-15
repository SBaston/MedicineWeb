// ═══════════════════════════════════════════════════════════════
// PricingPage.jsx - Configuración de Precios
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, DollarSign, TrendingUp, Info,
    Calendar, CheckCircle, AlertCircle
} from 'lucide-react';

const PricingPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [pricing, setPricing] = useState({
        pricePerSession: '',
        discountPercentage: 0,
        packagePrices: {
            single: '',
            pack3: '',
            pack5: '',
            pack10: '',
        }
    });
    const [errors, setErrors] = useState({});
    const [showDiscounts, setShowDiscounts] = useState(false);

    useEffect(() => {
        // TODO: Fetch current pricing from API
        setPricing({
            pricePerSession: '75.00',
            discountPercentage: 0,
            packagePrices: {
                single: '75.00',
                pack3: '213.75', // 5% discount
                pack5: '343.75', // 8.3% discount
                pack10: '637.50', // 15% discount
            }
        });
    }, []);

    const calculatePackagePrice = (sessions, discount) => {
        const basePrice = parseFloat(pricing.pricePerSession) || 0;
        const total = basePrice * sessions;
        return (total * (1 - discount / 100)).toFixed(2);
    };

    const handlePriceChange = (e) => {
        const { value } = e.target;
        setPricing(prev => ({
            ...prev,
            pricePerSession: value,
            packagePrices: {
                single: value,
                pack3: calculatePackagePrice(3, 5),
                pack5: calculatePackagePrice(5, 8.3),
                pack10: calculatePackagePrice(10, 15),
            }
        }));

        if (errors.pricePerSession) {
            setErrors(prev => ({ ...prev, pricePerSession: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!pricing.pricePerSession || parseFloat(pricing.pricePerSession) <= 0) {
            newErrors.pricePerSession = 'El precio debe ser mayor que 0';
        }

        if (parseFloat(pricing.pricePerSession) < 30) {
            newErrors.pricePerSession = 'El precio mínimo recomendado es €30';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);

        try {
            // TODO: Submit to API
            console.log('Updating pricing:', pricing);

            setTimeout(() => {
                setLoading(false);
                navigate('/doctor');
            }, 2000);
        } catch (error) {
            console.error('Error al actualizar precios:', error);
            setLoading(false);
        }
    };

    const platformFee = parseFloat(pricing.pricePerSession) * 0.15 || 0;
    const netEarnings = parseFloat(pricing.pricePerSession) - platformFee || 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-yellow-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate('/doctor')}
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Volver</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Configuración de precios</h1>
                    <p className="text-slate-600">
                        Define el precio de tus sesiones y paquetes de descuento
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Main Price */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-amber-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Precio por sesión</h2>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Precio base (€) *
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xl">
                                    €
                                </span>
                                <input
                                    type="number"
                                    value={pricing.pricePerSession}
                                    onChange={handlePriceChange}
                                    min="0"
                                    step="0.01"
                                    placeholder="75.00"
                                    className={`w-full pl-12 pr-4 py-4 text-2xl font-bold rounded-lg border ${errors.pricePerSession ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                        } focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                                />
                            </div>
                            {errors.pricePerSession && (
                                <p className="text-red-600 text-sm mt-2">{errors.pricePerSession}</p>
                            )}
                            <p className="text-sm text-slate-500 mt-2">
                                Este es el precio que verán los pacientes por una sesión individual
                            </p>
                        </div>

                        {/* Earnings Breakdown */}
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                            <h3 className="font-bold text-slate-900 mb-4">Desglose de ganancias por sesión</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Precio de la sesión</span>
                                    <span className="font-bold text-slate-900 text-lg">
                                        €{parseFloat(pricing.pricePerSession || 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Comisión plataforma (15%)</span>
                                    <span className="font-semibold text-red-600">
                                        -€{platformFee.toFixed(2)}
                                    </span>
                                </div>
                                <div className="pt-3 border-t border-emerald-200 flex items-center justify-between">
                                    <span className="font-bold text-slate-900">Tus ganancias netas</span>
                                    <span className="font-bold text-emerald-600 text-2xl">
                                        €{netEarnings.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Package Prices */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-purple-600" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">Paquetes de sesiones</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDiscounts(!showDiscounts)}
                                className="text-sm font-semibold text-purple-600 hover:text-purple-700"
                            >
                                {showDiscounts ? 'Ocultar' : 'Personalizar'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Single Session */}
                            <div className="p-4 rounded-xl border-2 border-slate-200 bg-slate-50">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-slate-900">1 Sesión</h3>
                                    <span className="text-xs text-slate-500">Precio base</span>
                                </div>
                                <p className="text-2xl font-bold text-slate-900">
                                    €{parseFloat(pricing.packagePrices.single || 0).toFixed(2)}
                                </p>
                                <p className="text-sm text-slate-600 mt-1">€{parseFloat(pricing.packagePrices.single || 0).toFixed(2)} por sesión</p>
                            </div>

                            {/* 3 Sessions */}
                            <div className="p-4 rounded-xl border-2 border-purple-200 bg-purple-50">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-slate-900">3 Sesiones</h3>
                                    <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full font-semibold">
                                        -5%
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-purple-600">
                                    €{parseFloat(pricing.packagePrices.pack3 || 0).toFixed(2)}
                                </p>
                                <p className="text-sm text-slate-600 mt-1">
                                    €{(parseFloat(pricing.packagePrices.pack3 || 0) / 3).toFixed(2)} por sesión
                                </p>
                            </div>

                            {/* 5 Sessions */}
                            <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-slate-900">5 Sesiones</h3>
                                    <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-semibold">
                                        -8.3%
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-blue-600">
                                    €{parseFloat(pricing.packagePrices.pack5 || 0).toFixed(2)}
                                </p>
                                <p className="text-sm text-slate-600 mt-1">
                                    €{(parseFloat(pricing.packagePrices.pack5 || 0) / 5).toFixed(2)} por sesión
                                </p>
                            </div>

                            {/* 10 Sessions */}
                            <div className="p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-slate-900">10 Sesiones</h3>
                                    <span className="px-2 py-1 bg-emerald-600 text-white text-xs rounded-full font-semibold">
                                        -15%
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-emerald-600">
                                    €{parseFloat(pricing.packagePrices.pack10 || 0).toFixed(2)}
                                </p>
                                <p className="text-sm text-slate-600 mt-1">
                                    €{(parseFloat(pricing.packagePrices.pack10 || 0) / 10).toFixed(2)} por sesión
                                </p>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-900">
                                <p className="font-semibold mb-1">Los paquetes ayudan a fidelizar pacientes</p>
                                <p>Los descuentos incrementales incentivan a los pacientes a comprometerse con más sesiones, aumentando tus ingresos totales.</p>
                            </div>
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Recomendaciones de precio</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-slate-900 mb-1">Precio competitivo</p>
                                    <p className="text-sm text-slate-600">
                                        El precio promedio en la plataforma es €70-€90 por sesión. Tu precio actual está {
                                            parseFloat(pricing.pricePerSession) < 70 ? 'por debajo' :
                                                parseFloat(pricing.pricePerSession) > 90 ? 'por encima' :
                                                    'dentro'
                                        } del rango.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-slate-900 mb-1">Considera tu experiencia</p>
                                    <p className="text-sm text-slate-600">
                                        Profesionales con más de 10 años de experiencia suelen cobrar €80-€120 por sesión.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-slate-900 mb-1">Ajusta según demanda</p>
                                    <p className="text-sm text-slate-600">
                                        Puedes modificar tus precios en cualquier momento según la demanda de tus servicios.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/doctor')}
                            className="px-6 py-3 rounded-lg font-semibold text-slate-600 hover:bg-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-lg font-semibold hover:from-amber-700 hover:to-yellow-700 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Guardar precios
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PricingPage;