import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/nexussalud-logo1.jpg';
import { Mail, Lock, AlertCircle, Heart, CheckCircle, ShieldCheck, KeyRound, ScanLine, Copy } from 'lucide-react';
import DarkModeToggle from '../components/DarkModeToggle';
import { useLanguage } from '../context/LanguageContext';
import { translateError } from '../utils/translateError';
import authService from '../services/authService';

// ─────────────────────────────────────────────────────────────
// Paso 1: email + contraseña
// ─────────────────────────────────────────────────────────────
const StepCredentials = ({ email, setEmail, password, setPassword, error, loading, onSubmit, registrationSuccess, registrationMessage, t }) => (
    <form onSubmit={onSubmit} className="space-y-6">
        {registrationSuccess && (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-green-800 font-semibold text-sm mb-1">{t('login.successTitle')}</p>
                        <p className="text-green-700 text-sm leading-relaxed">{registrationMessage || t('login.successDefault')}</p>
                    </div>
                </div>
            </div>
        )}

        {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-700 text-sm">{error}</span>
            </div>
        )}

        <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('login.emailLabel')}
            </label>
            <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="tu@email.com"
                />
            </div>
        </div>

        <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('login.passwordLabel')}
            </label>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10"
                    placeholder="••••••••"
                />
            </div>
        </div>

        <div className="flex items-center justify-between text-sm">
            <label className="flex items-center">
                <input type="checkbox" className="mr-2 rounded border-gray-300" />
                <span className="text-gray-600">{t('login.remember')}</span>
            </label>
            <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700 font-medium">
                {t('login.forgotPassword')}
            </Link>
        </div>

        <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading ? t('login.loading') : t('login.submit')}
        </button>
    </form>
);

// ─────────────────────────────────────────────────────────────
// Paso 2: código TOTP
// ─────────────────────────────────────────────────────────────
const StepTwoFactor = ({ code, setCode, error, loading, onSubmit, onBack }) => (
    <div className="space-y-6">
        {/* Icono */}
        <div className="flex flex-col items-center text-center gap-2 mb-2">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Verificación en dos pasos</h3>
            <p className="text-sm text-gray-500">
                Abre tu app de autenticación (Google Authenticator, Authy…) e introduce el código de 6 dígitos.
            </p>
        </div>

        {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-700 text-sm">{error}</span>
            </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de verificación
                </label>
                <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        pattern="\d{6}"
                        required
                        autoFocus
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="input-field pl-10 text-center text-2xl tracking-widest font-mono"
                        placeholder="000000"
                    />
                </div>
                <p className="text-xs text-gray-400 mt-1 text-center">El código cambia cada 30 segundos</p>
            </div>

            <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Verificando...' : 'Verificar y entrar'}
            </button>

            <button
                type="button"
                onClick={onBack}
                className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
            >
                ← Volver al inicio de sesión
            </button>
        </form>
    </div>
);

// ─────────────────────────────────────────────────────────────
// Paso 3 (solo Admins): configuración obligatoria de 2FA
// ─────────────────────────────────────────────────────────────
const StepForcedSetup = ({ onComplete }) => {
    const [setupData, setSetupData] = useState(null);
    const [code, setCode]           = useState('');
    const [error, setError]         = useState('');
    const [loading, setLoading]     = useState(false);
    const [copied, setCopied]       = useState(false);

    // Cargar QR al montar
    useEffect(() => {
        authService.setupTwoFactor()
            .then(data => setSetupData(data))
            .catch(() => setError('Error al generar el código QR. Recarga la página.'));
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(setupData?.manualEntryKey || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authService.enableTwoFactor(code);
            onComplete();
        } catch {
            setError('Código incorrecto. Asegúrate de escanearlo bien e inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const qrUrl = setupData?.otpAuthUri
        ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.otpAuthUri)}`
        : null;

    return (
        <div className="space-y-5">
            <div className="flex flex-col items-center text-center gap-2">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Configuración obligatoria de 2FA</h3>
                <p className="text-sm text-gray-500">
                    Las cuentas de administrador requieren autenticación en dos pasos.<br />
                    Escanea el código QR con Google Authenticator o Authy para continuar.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span className="text-red-700 text-sm">{error}</span>
                </div>
            )}

            {/* QR Code */}
            <div className="flex flex-col items-center gap-3">
                {qrUrl ? (
                    <img src={qrUrl} alt="QR 2FA" className="w-44 h-44 border-2 border-gray-200 rounded-xl" />
                ) : (
                    <div className="w-44 h-44 bg-gray-100 rounded-xl flex items-center justify-center">
                        <ScanLine className="w-8 h-8 text-gray-400 animate-pulse" />
                    </div>
                )}

                {/* Clave manual */}
                {setupData?.manualEntryKey && (
                    <div className="w-full">
                        <p className="text-xs text-gray-500 mb-1 text-center">O introduce esta clave manualmente:</p>
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                            <code className="text-xs font-mono text-gray-700 flex-1 break-all">
                                {setupData.manualEntryKey}
                            </code>
                            <button type="button" onClick={handleCopy} className="text-primary-600 hover:text-primary-700 flex-shrink-0">
                                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Verificar código */}
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Introduce el código de 6 dígitos para confirmar
                    </label>
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            pattern="\d{6}"
                            required
                            autoFocus
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="input-field pl-10 text-center text-2xl tracking-widest font-mono"
                            placeholder="000000"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Activando...' : 'Activar 2FA y entrar'}
                </button>
            </form>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────
const LoginPage = () => {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);

    // Estado pasos
    const [step, setStep] = useState('credentials'); // 'credentials' | 'totp' | 'forced-setup'
    const [twoFactorUserId, setTwoFactorUserId] = useState(null);
    const [totpCode, setTotpCode] = useState('');

    const { t } = useLanguage();
    const location = useLocation();

    const registrationSuccess = location.state?.registrationSuccess;
    const registrationMessage = location.state?.message;

    const goToApp = (role) => {
        // Recarga completa para que AuthContext lea el token del localStorage
        window.location.href =
            role === 'Admin'   ? '/admin' :
            role === 'Doctor'  ? '/doctor/dashboard' :
                                 '/dashboard';
    };

    // ── Paso 1: credenciales ──
    const handleCredentialsSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Llamamos directamente a authService para inspeccionar los flags
            // antes de que AuthContext cargue el perfil completo
            const data = await authService.login(email, password);

            if (data.requiresTwoFactorSetup) {
                // Admin sin 2FA: token temporal ya guardado en localStorage
                setStep('forced-setup');
            } else if (data.requiresTwoFactor) {
                // Usuario con 2FA activo
                setTwoFactorUserId(data.userId);
                setStep('totp');
            } else {
                // Login normal
                goToApp(data.role);
            }
        } catch (err) {
            setError(translateError(err.response?.data?.message, t) || t('login.errorDefault'));
        } finally {
            setLoading(false);
        }
    };

    // ── Paso 2: código TOTP ──
    const handleTotpSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await authService.verifyTwoFactorLogin(twoFactorUserId, totpCode);
            goToApp(data.role);
        } catch (err) {
            setError(err.response?.data?.message || 'Código incorrecto o expirado. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        setStep('credentials');
        setTwoFactorUserId(null);
        setTotpCode('');
        setError('');
        // Limpiar token temporal si el admin cancela
        authService.logout();
    };

    const isCredentials = step === 'credentials';

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4">
            <DarkModeToggle />
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                        <Link to="/" className="flex items-center space-x-3">
                            <img src={logo} alt="NexusSalud Logo" className="h-12 w-12 object-contain rounded-lg" />
                            <span className="text-4xl font-bold text-primary-600">NexusSalud</span>
                        </Link>
                    </div>
                    <p className="text-gray-600">{t('login.subtitle')}</p>
                </div>

                {/* Tarjeta */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {step === 'totp' && (
                        <StepTwoFactor
                            code={totpCode}
                            setCode={setTotpCode}
                            error={error}
                            loading={loading}
                            onSubmit={handleTotpSubmit}
                            onBack={handleBack}
                        />
                    )}
                    {step === 'forced-setup' && (
                        <StepForcedSetup onComplete={() => goToApp('Admin')} />
                    )}
                    {step === 'credentials' && (
                        <StepCredentials
                            email={email}
                            setEmail={setEmail}
                            password={password}
                            setPassword={setPassword}
                            error={error}
                            loading={loading}
                            onSubmit={handleCredentialsSubmit}
                            registrationSuccess={registrationSuccess}
                            registrationMessage={registrationMessage}
                            t={t}
                        />
                    )}

                    {isCredentials && (
                        <div className="mt-6 text-center">
                            <p className="text-gray-600 text-sm">
                                {t('login.noAccount')}{' '}
                                <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                                    {t('login.registerHere')}
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
