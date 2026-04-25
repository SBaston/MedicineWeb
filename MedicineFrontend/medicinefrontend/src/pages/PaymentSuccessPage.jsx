// ═══════════════════════════════════════════════════════════════
// PaymentSuccessPage.jsx
// Página de retorno tras un pago exitoso en Stripe
// Soporta: citas, cursos y suscripciones de chat Premium
// Route: /payment/success?session_id=...
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, Calendar, BookOpen, MessageCircle, Crown } from 'lucide-react';
import api from '../services/api';

const PaymentSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');

    const [status, setStatus] = useState('loading'); // loading | success | error | pending
    const [paymentInfo, setPaymentInfo] = useState(null);

    useEffect(() => {
        if (!sessionId) {
            setStatus('error');
            return;
        }

        let attempts = 0;
        const MAX_ATTEMPTS = 15; // 30 segundos máximo

        const checkStatus = async () => {
            // 1. Intentar buscar en Payments (citas y cursos)
            try {
                const { data } = await api.get(`/payments/session/${sessionId}`);
                setPaymentInfo(data);
                if (data.status === 'Completado') {
                    setStatus('success');
                    return;
                }
            } catch (err) {
                if (err.response?.status !== 404) {
                    // Error inesperado — continuar intentando
                }
            }

            // 2. Intentar buscar en ChatSubscriptions
            try {
                const { data } = await api.get(`/chat/session/${sessionId}`);
                setPaymentInfo(data);
                if (data.status === 'Completado') {
                    setStatus('success');
                    return;
                }
            } catch {
                // no encontrado en chat tampoco
            }

            attempts++;
            if (attempts >= MAX_ATTEMPTS) {
                setStatus('pending');
            } else {
                setTimeout(checkStatus, 2000);
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

    if (status === 'error' || status === 'pending') {
        const isCourseError = paymentInfo?.paymentType === 'Curso';
        const redirectTo = isCourseError && paymentInfo?.courseId
            ? `/courses/${paymentInfo.courseId}`
            : '/dashboard';
        const redirectLabel = isCourseError ? 'Volver al curso' : 'Ir a mi panel';

        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-amber-50">
                <div className="text-center max-w-md px-6">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-amber-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-3">
                        Pago recibido, verificando...
                    </h1>
                    <p className="text-slate-500 mb-6">
                        El cargo se ha realizado correctamente. La confirmación puede tardar
                        unos minutos. Si no ves el cambio en breve, contacta con soporte.
                    </p>
                    <Link
                        to={redirectTo}
                        className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                    >
                        {redirectLabel}
                    </Link>
                </div>
            </div>
        );
    }

    // ── Determinar tipo de pago ────────────────────────────────
    const isChatSubscription = paymentInfo?.type === 'chat_subscription';
    const isCourse = !isChatSubscription && paymentInfo?.paymentType === 'Curso';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50">
            <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full mx-4 text-center">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
                    isChatSubscription ? 'bg-violet-100' : 'bg-emerald-100'
                }`}>
                    {isChatSubscription
                        ? <MessageCircle className="w-12 h-12 text-violet-500" />
                        : <CheckCircle className="w-12 h-12 text-emerald-500" />
                    }
                </div>

                <h1 className="text-2xl font-bold text-slate-800 mb-2">
                    {isChatSubscription ? '¡Chat Premium activado!' : '¡Pago completado!'}
                </h1>

                <p className="text-slate-500 mb-6">
                    {isChatSubscription
                        ? <span>Tu chat con <strong>Dr. {paymentInfo?.doctorName}</strong> está listo.</span>
                        : <span>Tu pago de{' '}
                            <span className="font-semibold text-slate-700">
                                {paymentInfo?.amount?.toFixed(2)} {paymentInfo?.currency}
                            </span>{' '}
                            se ha procesado correctamente.
                          </span>
                    }
                </p>

                {/* ── Chat Premium info ── */}
                {isChatSubscription && (
                    <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-6 text-left">
                        <div className="flex items-center gap-2 text-violet-700 font-semibold mb-2">
                            <Crown className="w-4 h-4" />
                            Plan: {paymentInfo?.planName}
                        </div>
                        <p className="text-sm text-slate-600">
                            Tienes acceso de chat durante <strong>{paymentInfo?.durationDays} días</strong>.
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Mensajes almacenados conforme a la LOPD
                        </p>
                    </div>
                )}

                {/* ── Curso info ── */}
                {isCourse && paymentInfo?.courseTitle && (
                    <div className="bg-emerald-50 rounded-xl p-4 mb-6 text-left">
                        <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-1">
                            <BookOpen className="w-4 h-4" />
                            Curso
                        </div>
                        <p className="text-slate-700">{paymentInfo.courseTitle}</p>
                        <p className="text-sm text-slate-500 mt-1">Ya estás matriculado. ¡Empieza cuando quieras!</p>
                    </div>
                )}

                {/* ── Cita info ── */}
                {!isChatSubscription && !isCourse && (
                    <div className="bg-emerald-50 rounded-xl p-4 mb-6 text-left">
                        <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-1">
                            <Calendar className="w-4 h-4" />
                            Cita médica
                        </div>
                        <p className="text-sm text-slate-500">Tu cita ha sido reservada y confirmada.</p>
                    </div>
                )}

                {/* ── CTAs ── */}
                <div className="flex flex-col gap-3">
                    {isChatSubscription && paymentInfo?.subscriptionId ? (
                        <Link
                            to={`/chat/${paymentInfo.subscriptionId}`}
                            className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all"
                        >
                            Abrir chat ahora →
                        </Link>
                    ) : isCourse ? (
                        <Link
                            to={`/courses/${paymentInfo.courseId}`}
                            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all"
                        >
                            Ir al curso
                        </Link>
                    ) : (
                        <Link
                            to="/dashboard"
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
