// ═══════════════════════════════════════════════════════════════
// PaymentSuccessPage.jsx
// Página de retorno tras un pago exitoso en Stripe
// Route: /payment/success?session_id=...
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, Calendar, BookOpen } from 'lucide-react';
import api from '../services/api';

const PaymentSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');

    const [status, setStatus] = useState('loading'); // loading | success | error
    const [paymentInfo, setPaymentInfo] = useState(null);

    useEffect(() => {
        if (!sessionId) {
            setStatus('error');
            return;
        }

        const checkStatus = async () => {
            try {
                const { data } = await api.get(`/payments/session/${sessionId}`);
                if (data.status === 'Completado') {
                    setPaymentInfo(data);
                    setStatus('success');
                } else {
                    // El webhook puede tardar unos segundos — reintentar
                    setTimeout(checkStatus, 2000);
                }
            } catch {
                setStatus('error');
            }
        };

        checkStatus();
    }, [sessionId]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
                    <p className="text-slate-600 text-lg">Verificando tu pago...</p>
                    <p className="text-slate-400 text-sm mt-1">Esto puede tardar unos segundos</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-red-50">
                <div className="text-center max-w-md px-6">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-3">
                        No se pudo verificar el pago
                    </h1>
                    <p className="text-slate-500 mb-6">
                        Si el cargo apareció en tu tarjeta, el pago se confirmará automáticamente
                        en unos minutos. Puedes revisar el estado en tu panel.
                    </p>
                    <Link
                        to="/patient"
                        className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                    >
                        Ir a mi panel
                    </Link>
                </div>
            </div>
        );
    }

    const isCourse = paymentInfo?.paymentType === 'Curso';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50">
            <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full mx-4 text-center">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                </div>

                <h1 className="text-2xl font-bold text-slate-800 mb-2">
                    ¡Pago completado!
                </h1>
                <p className="text-slate-500 mb-6">
                    Tu pago de{' '}
                    <span className="font-semibold text-slate-700">
                        {paymentInfo?.amount?.toFixed(2)} {paymentInfo?.currency}
                    </span>{' '}
                    se ha procesado correctamente.
                </p>

                {isCourse && paymentInfo.courseTitle && (
                    <div className="bg-emerald-50 rounded-xl p-4 mb-6 text-left">
                        <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-1">
                            <BookOpen className="w-4 h-4" />
                            Curso
                        </div>
                        <p className="text-slate-700">{paymentInfo.courseTitle}</p>
                        <p className="text-sm text-slate-500 mt-1">Ya estás matriculado. ¡Empieza cuando quieras!</p>
                    </div>
                )}

                {!isCourse && (
                    <div className="bg-emerald-50 rounded-xl p-4 mb-6 text-left">
                        <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-1">
                            <Calendar className="w-4 h-4" />
                            Cita médica
                        </div>
                        <p className="text-sm text-slate-500">Tu cita ha sido reservada y confirmada.</p>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    {isCourse ? (
                        <Link
                            to={`/courses/${paymentInfo.courseId}`}
                            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all"
                        >
                            Ir al curso
                        </Link>
                    ) : (
                        <Link
                            to="/patient"
                            className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
                        >
                            Ver mis citas
                        </Link>
                    )}
                    <Link to="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
                        Volver al inicio
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccessPage;
