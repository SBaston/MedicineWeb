// ═══════════════════════════════════════════════════════════════
// ContratarModal.jsx
// Modal para elegir entre plan Gratis (reserva) y Premium (chat)
// ═══════════════════════════════════════════════════════════════
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import chatService from '../services/chatService';
import BookingModal from './BookingModal';
import {
    X, Calendar, MessageCircle, Check, Zap,
    Clock, Loader2, AlertCircle, Crown
} from 'lucide-react';

// ── Tarjeta de plan premium ────────────────────────────────────
const IVA = 0.21;

const PlanCard = ({ plan, selected, onSelect }) => {
    const priceNet   = plan.price;
    const priceFinal = priceNet * (1 + IVA);

    return (
        <button
            onClick={() => onSelect(plan)}
            className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                selected
                    ? 'border-violet-500 bg-violet-50 shadow-md'
                    : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/40'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Crown className="w-4 h-4 text-violet-600" />
                        <span className="font-semibold text-gray-900">{plan.name}</span>
                    </div>
                    {plan.description && (
                        <p className="text-sm text-gray-500 mb-2">{plan.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-3.5 h-3.5" />
                        {plan.durationDays} días de acceso al chat
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-violet-700">{priceFinal.toFixed(2)} €</p>
                    <p className="text-xs text-gray-400">IVA 21% incluido</p>
                </div>
            </div>
            {selected && (
                <div className="mt-3 pt-3 border-t border-violet-200 flex items-center gap-1.5 text-violet-700 text-sm font-medium">
                    <Check className="w-4 h-4" />
                    Plan seleccionado
                </div>
            )}
        </button>
    );
};

// ── Modal principal ────────────────────────────────────────────
const ContratarModal = ({ professional, onClose }) => {
    const { isAuthenticated, user } = useAuth();
    const [view, setView] = useState('choice');      // 'choice' | 'booking' | 'premium'
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loadingCheckout, setLoadingCheckout] = useState(false);
    const [error, setError] = useState('');

    const { data: plans = [], isLoading: loadingPlans } = useQuery({
        queryKey: ['chat-plans'],
        queryFn: chatService.getActivePlans,
        enabled: view === 'premium',
    });

    const fullName = `${professional.firstName} ${professional.lastName}`;

    // ── Flujo Gratis ───────────────────────────────────────────
    const handleFree = () => {
        if (!isAuthenticated) {
            window.location.href = '/login';
            return;
        }
        setView('booking');
    };

    // ── Flujo Premium ──────────────────────────────────────────
    const handlePremium = () => {
        if (!isAuthenticated) {
            window.location.href = '/login';
            return;
        }
        setView('premium');
    };

    const handleCheckout = async () => {
        if (!selectedPlan) return;
        setError('');
        setLoadingCheckout(true);
        try {
            const { checkoutUrl } = await chatService.createCheckout(professional.id, selectedPlan.id);
            window.location.href = checkoutUrl;
        } catch (err) {
            const msg = err.response?.data?.message || 'Error al iniciar el pago. Inténtalo de nuevo.';
            setError(msg);
        } finally {
            setLoadingCheckout(false);
        }
    };

    // ── Si eligió Gratis, mostrar BookingModal directamente ────
    if (view === 'booking') {
        return (
            <BookingModal
                professional={professional}
                onClose={onClose}
            />
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <img
                            src={professional.profilePictureUrl ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=3b82f6&color=fff&size=80&bold=true`}
                            alt={fullName}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Contratar a {fullName}</h2>
                            <p className="text-sm text-gray-500">Elige el tipo de acceso que necesitas</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Contenido */}
                <div className="p-6">
                    {/* ── Vista: Selección ────────────────────────────── */}
                    {view === 'choice' && (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {/* Opción Gratis */}
                            <div className="rounded-2xl border-2 border-gray-200 p-6 flex flex-col">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Gratis</h3>
                                        <p className="text-xs text-gray-500">Solo reserva de cita</p>
                                    </div>
                                </div>
                                <ul className="space-y-2 mb-5 flex-1 text-sm text-gray-600">
                                    <li className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        Reserva de cita online o presencial
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        Gestión de disponibilidad en tiempo real
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        Recordatorios automáticos
                                    </li>
                                </ul>
                                <button
                                    onClick={handleFree}
                                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm"
                                >
                                    Reservar cita
                                </button>
                            </div>

                            {/* Opción Premium */}
                            <div className="rounded-2xl border-2 border-violet-400 bg-gradient-to-b from-violet-50 to-white p-6 flex flex-col relative overflow-hidden">
                                <div className="absolute top-3 right-3">
                                    <span className="text-xs font-bold bg-violet-600 text-white px-2.5 py-1 rounded-full">
                                        RECOMENDADO
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center">
                                        <MessageCircle className="w-5 h-5 text-violet-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 flex items-center gap-1">
                                            Premium
                                            <Zap className="w-4 h-4 text-violet-500" />
                                        </h3>
                                        <p className="text-xs text-gray-500">Reserva + Chat directo</p>
                                    </div>
                                </div>
                                <ul className="space-y-2 mb-5 flex-1 text-sm text-gray-600">
                                    <li className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                                        Todo lo del plan gratuito
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                                        Chat directo 24h con el profesional
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                                        Mensajes almacenados y seguros
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                                        Consultas rápidas sin cita previa
                                    </li>
                                </ul>
                                <button
                                    onClick={handlePremium}
                                    className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors text-sm"
                                >
                                    Ver planes Premium
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Vista: Selección de plan Premium ────────────── */}
                    {view === 'premium' && (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <button
                                    onClick={() => { setView('choice'); setSelectedPlan(null); setError(''); }}
                                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                >
                                    ← Volver
                                </button>
                                <h3 className="font-semibold text-gray-900">Selecciona tu plan Premium</h3>
                            </div>

                            <div className="mb-4 p-3 bg-violet-50 border border-violet-200 rounded-lg text-sm text-violet-800 flex items-start gap-2">
                                <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>
                                    Tendrás acceso a un chat directo con <strong>Dr. {fullName}</strong>.
                                    Todos los mensajes se almacenan de forma segura conforme a la LOPD.
                                </span>
                            </div>

                            {loadingPlans ? (
                                <div className="flex items-center justify-center py-10">
                                    <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                                </div>
                            ) : plans.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                                    <p>No hay planes disponibles en este momento.</p>
                                    <p className="text-sm">Contacta con soporte para más información.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {plans.map(plan => (
                                        <PlanCard
                                            key={plan.id}
                                            plan={plan}
                                            selected={selectedPlan?.id === plan.id}
                                            onSelect={setSelectedPlan}
                                        />
                                    ))}
                                </div>
                            )}

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div className="mt-5 flex gap-3">
                                <button
                                    onClick={() => { setView('choice'); setSelectedPlan(null); }}
                                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
                                >
                                    Volver
                                </button>
                                <button
                                    onClick={handleCheckout}
                                    disabled={!selectedPlan || loadingCheckout}
                                    className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                                >
                                    {loadingCheckout ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Redirigiendo…
                                        </>
                                    ) : (
                                        <>Pagar {selectedPlan ? `${(selectedPlan.price * (1 + IVA)).toFixed(2)} €` : ''}</>
                                    )}
                                </button>
                            </div>

                            <p className="mt-3 text-xs text-center text-gray-400">
                                Pago seguro procesado por Stripe · IVA incluido en el precio
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContratarModal;
