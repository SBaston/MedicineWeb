// ═══════════════════════════════════════════════════════════════
// PaymentCancelPage.jsx
// Página de retorno tras cancelar un pago en Stripe
// Route: /payment/cancel?payment_id=X&type=appointment|course
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { XCircle, RefreshCcw, Trash2, Loader2 } from 'lucide-react';
import api from '../services/api';

const PaymentCancelPage = () => {
    const [searchParams]    = useSearchParams();
    const navigate          = useNavigate();
    const paymentId         = searchParams.get('payment_id');
    const type              = searchParams.get('type'); // 'appointment' | 'course'

    const [cancelling,   setCancelling]   = useState(false);
    const [cancelDone,   setCancelDone]   = useState(false);
    const [cancelError,  setCancelError]  = useState('');

    const handleCancelReservation = async () => {
        if (!paymentId) return;
        setCancelling(true);
        setCancelError('');
        try {
            await api.post(`/payments/${paymentId}/cancel`);
            setCancelDone(true);
        } catch (err) {
            const msg = err.response?.data?.message || 'No se pudo cancelar. Inténtalo más tarde.';
            setCancelError(msg);
        } finally {
            setCancelling(false);
        }
    };

    // Destino del botón "Reintentar": volver al listado correspondiente
    const retryDestination = type === 'course' ? '/courses' : '/professionals';
    const retryLabel       = type === 'course' ? 'Volver a los cursos' : 'Volver a los profesionales';

    if (cancelDone) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-green-50">
                <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full mx-4 text-center">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Trash2 className="w-12 h-12 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Reserva cancelada</h1>
                    <p className="text-slate-500 mb-8">
                        {type === 'course'
                            ? 'La matrícula ha sido cancelada. No se ha realizado ningún cargo.'
                            : 'La cita ha sido cancelada. No se ha realizado ningún cargo.'}
                    </p>
                    <Link
                        to={retryDestination}
                        className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                    >
                        {retryLabel}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-orange-50">
            <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full mx-4 text-center">
                <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-12 h-12 text-orange-500" />
                </div>

                <h1 className="text-2xl font-bold text-slate-800 mb-2">
                    Pago no completado
                </h1>
                <p className="text-slate-500 mb-8">
                    No se ha realizado ningún cargo. ¿Qué quieres hacer?
                </p>

                {cancelError && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3 mb-4">{cancelError}</p>
                )}

                <div className="flex flex-col gap-3">
                    {/* Reintentar: volver al listado para hacer una nueva reserva */}
                    <Link
                        to={retryDestination}
                        className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Reintentar el pago
                    </Link>

                    {/* Cancelar la reserva pendiente */}
                    {paymentId && (
                        <button
                            onClick={handleCancelReservation}
                            disabled={cancelling}
                            className="w-full py-3 bg-white border-2 border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {cancelling ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Cancelando...</>
                            ) : (
                                <><Trash2 className="w-4 h-4" /> Cancelar la reserva</>
                            )}
                        </button>
                    )}

                    <Link to="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors mt-1">
                        Ir al inicio
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentCancelPage;
