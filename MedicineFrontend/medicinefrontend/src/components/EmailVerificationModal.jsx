// ═══════════════════════════════════════════════════════════════
// EmailVerificationModal.jsx
// Modal con 6 inputs OTP, contador de 60 segundos y reenvío
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldCheck, Mail, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';

const TOTAL_SECONDS = 60;

const EmailVerificationModal = ({ email, onVerified, onClose }) => {
    const [digits, setDigits] = useState(['', '', '', '', '', '']);
    const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const inputRefs = useRef([]);

    // ── Temporizador ────────────────────────────────────────────
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    // ── Input handling ──────────────────────────────────────────
    const handleChange = (index, value) => {
        if (!/^\d?$/.test(value)) return; // solo dígitos
        const next = [...digits];
        next[index] = value;
        setDigits(next);
        setError('');

        // Avanzar al siguiente input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit cuando los 6 están rellenos
        if (value && next.every(d => d !== '')) {
            submitCode(next.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
        if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            const next = pasted.split('');
            setDigits(next);
            inputRefs.current[5]?.focus();
            submitCode(pasted);
        }
    };

    // ── Verificar código ────────────────────────────────────────
    const submitCode = useCallback(async (code) => {
        if (loading) return;
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/verify-email', { email, code });
            setSuccess(true);
            setTimeout(() => onVerified(), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Código incorrecto');
            setDigits(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    }, [email, loading, onVerified]);

    // ── Reenviar código ─────────────────────────────────────────
    const handleResend = async () => {
        setResending(true);
        setError('');
        setDigits(['', '', '', '', '', '']);
        try {
            await api.post('/auth/send-verification', { email });
            setTimeLeft(TOTAL_SECONDS);
            inputRefs.current[0]?.focus();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo reenviar el código');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-fade-in">

                {/* Cabecera */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        {success
                            ? <CheckCircle className="w-8 h-8 text-green-500" />
                            : <ShieldCheck className="w-8 h-8 text-blue-600" />
                        }
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {success ? '¡Email verificado!' : 'Verifica tu email'}
                    </h2>
                    {!success && (
                        <>
                            <p className="text-gray-500 text-sm">
                                Hemos enviado un código de 6 dígitos a
                            </p>
                            <p className="font-semibold text-blue-600 text-sm mt-1 flex items-center justify-center gap-1">
                                <Mail className="w-4 h-4" />
                                {email}
                            </p>
                        </>
                    )}
                    {success && (
                        <p className="text-gray-500 text-sm">Tu cuenta está lista. Redirigiendo...</p>
                    )}
                </div>

                {!success && (
                    <>
                        {/* Inputs OTP */}
                        <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
                            {digits.map((d, i) => (
                                <input
                                    key={i}
                                    ref={el => inputRefs.current[i] = el}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={d}
                                    onChange={e => handleChange(i, e.target.value)}
                                    onKeyDown={e => handleKeyDown(i, e)}
                                    disabled={loading}
                                    className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl outline-none transition-all
                                        ${d ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-900'}
                                        ${error ? 'border-red-400 bg-red-50' : ''}
                                        focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                                        disabled:opacity-60`}
                                    autoFocus={i === 0}
                                />
                            ))}
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <span className="text-red-700 text-sm">{error}</span>
                            </div>
                        )}

                        {/* Temporizador */}
                        <div className="text-center mb-4">
                            {timeLeft > 0 ? (
                                <p className="text-sm text-gray-500">
                                    El código expira en{' '}
                                    <span className={`font-bold ${timeLeft <= 15 ? 'text-red-500' : 'text-blue-600'}`}>
                                        {formatTime(timeLeft)}
                                    </span>
                                </p>
                            ) : (
                                <p className="text-sm text-red-500 font-medium">
                                    El código ha expirado
                                </p>
                            )}
                        </div>

                        {/* Reenviar */}
                        <div className="text-center mb-4">
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resending || timeLeft > 50}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 mx-auto"
                            >
                                <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
                                {resending ? 'Enviando...' : 'Reenviar código'}
                            </button>
                            {timeLeft > 50 && (
                                <p className="text-xs text-gray-400 mt-1">
                                    Podrás reenviar en {timeLeft - 50}s
                                </p>
                            )}
                        </div>

                        {/* Botón manual */}
                        <button
                            type="button"
                            onClick={() => submitCode(digits.join(''))}
                            disabled={loading || digits.some(d => d === '') || timeLeft === 0}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Verificando...' : 'Verificar código'}
                        </button>

                        {/* Cancelar */}
                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700"
                            >
                                Cancelar
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default EmailVerificationModal;
