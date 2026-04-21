// ═══════════════════════════════════════════════════════════════
// PaymentCancelPage.jsx
// Página de retorno tras cancelar un pago en Stripe
// Route: /payment/cancel
// ═══════════════════════════════════════════════════════════════

import { Link, useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';

const PaymentCancelPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-orange-50">
            <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full mx-4 text-center">
                <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-12 h-12 text-orange-500" />
                </div>

                <h1 className="text-2xl font-bold text-slate-800 mb-2">
                    Pago cancelado
                </h1>
                <p className="text-slate-500 mb-8">
                    Has cancelado el proceso de pago. No se ha realizado ningún cargo.
                    Puedes intentarlo de nuevo cuando quieras.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver
                    </button>
                    <Link to="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
                        Ir al inicio
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentCancelPage;
