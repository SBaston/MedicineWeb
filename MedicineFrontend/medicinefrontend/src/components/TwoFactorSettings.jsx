// ═══════════════════════════════════════════════════════════════
// TwoFactorSettings.jsx
// Sección de configuración de 2FA (TOTP) para el panel de ajustes
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { ShieldCheck, ShieldOff, Smartphone, Copy, Check, AlertCircle, KeyRound, Loader2, Download } from 'lucide-react';
import authService from '../services/authService';

const qrUrl = (data) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;

// ── Panel de códigos de recuperación ─────────────────────────────
const RecoveryCodesPanel = ({ codes, onDismiss }) => {
    const [copied, setCopied] = useState(false);

    const handleCopyAll = () => {
        navigator.clipboard.writeText(codes.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob(
            [`Códigos de recuperación NexusSalud\nGuárdalos en un lugar seguro — cada uno solo se puede usar una vez.\n\n${codes.join('\n')}`],
            { type: 'text/plain' }
        );
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'nexussalud-recovery-codes.txt';
        a.click();
        URL.revokeObjectURL(a.href);
    };

    return (
        <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                    <strong>Guarda estos códigos ahora.</strong> No volverán a mostrarse.
                    Úsalos si pierdes acceso a tu aplicación de autenticación.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {codes.map((code, i) => (
                    <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center font-mono text-sm font-semibold text-gray-800 tracking-widest">
                        {code}
                    </div>
                ))}
            </div>

            <div className="flex gap-2">
                <button
                    onClick={handleCopyAll}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiados' : 'Copiar todos'}
                </button>
                <button
                    onClick={handleDownload}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Descargar .txt
                </button>
            </div>

            <button
                onClick={onDismiss}
                className="w-full btn-primary text-sm px-4 py-2"
            >
                He guardado mis códigos
            </button>
        </div>
    );
};

// ── Componente principal ─────────────────────────────────────────
const TwoFactorSettings = ({ twoFactorEnabled: initialEnabled }) => {
    const [enabled, setEnabled]       = useState(initialEnabled ?? false);
    const [phase, setPhase]           = useState('idle'); // idle | setup | verify-enable | verify-disable | recovery-codes
    const [setupData, setSetupData]   = useState(null);
    const [recoveryCodes, setRecoveryCodes] = useState([]);
    const [code, setCode]             = useState('');
    const [copied, setCopied]         = useState(false);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const clearMessages = () => { setError(''); setSuccessMsg(''); };

    // ── ACTIVAR: paso 1 → pedir QR ──
    const handleStartSetup = async () => {
        setLoading(true);
        clearMessages();
        try {
            const data = await authService.setupTwoFactor();
            setSetupData(data);
            setCode('');
            setPhase('setup');
        } catch {
            setError('No se pudo iniciar la configuración. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    // ── ACTIVAR: paso 2 → verificar primer código ──
    const handleEnable = async (e) => {
        e.preventDefault();
        setLoading(true);
        clearMessages();
        try {
            const result = await authService.enableTwoFactor(code);
            setEnabled(true);
            setCode('');
            // Mostrar códigos de recuperación
            setRecoveryCodes(result.recoveryCodes ?? []);
            setPhase('recovery-codes');
        } catch (err) {
            setError(err.response?.data?.message || 'Código incorrecto. Comprueba tu app de autenticación.');
        } finally {
            setLoading(false);
        }
    };

    // ── DESACTIVAR ──
    const handleStartDisable = () => {
        clearMessages();
        setCode('');
        setPhase('verify-disable');
    };

    const handleDisable = async (e) => {
        e.preventDefault();
        setLoading(true);
        clearMessages();
        try {
            await authService.disableTwoFactor(code);
            setEnabled(false);
            setPhase('idle');
            setSuccessMsg('El 2FA ha sido desactivado.');
            setCode('');
        } catch (err) {
            setError(err.response?.data?.message || 'Código incorrecto.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyKey = () => {
        if (setupData?.manualEntryKey) {
            navigator.clipboard.writeText(setupData.manualEntryKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCancel = () => { setPhase('idle'); setCode(''); clearMessages(); };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            {/* Cabecera */}
            <div className="flex items-center gap-3">
                {enabled
                    ? <ShieldCheck className="w-6 h-6 text-green-600" />
                    : <ShieldOff className="w-6 h-6 text-gray-400" />
                }
                <div>
                    <h3 className="font-semibold text-gray-900">Autenticación en dos factores (2FA)</h3>
                    <p className="text-sm text-gray-500">
                        {enabled
                            ? 'Tu cuenta está protegida con un segundo factor de verificación.'
                            : 'Añade una capa extra de seguridad a tu cuenta.'}
                    </p>
                </div>
                <span className={`ml-auto px-2.5 py-1 rounded-full text-xs font-semibold ${
                    enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                    {enabled ? 'Activo' : 'Inactivo'}
                </span>
            </div>

            {/* Mensajes de éxito / error */}
            {successMsg && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-green-700 text-sm">
                    <Check className="w-4 h-4" /> {successMsg}
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4" /> {error}
                </div>
            )}

            {/* ── FASE: idle ── */}
            {phase === 'idle' && (
                enabled ? (
                    <button
                        onClick={handleStartDisable}
                        className="px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors"
                    >
                        Desactivar 2FA
                    </button>
                ) : (
                    <button
                        onClick={handleStartSetup}
                        disabled={loading}
                        className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                        Activar 2FA
                    </button>
                )
            )}

            {/* ── FASE: setup (mostrar QR) ── */}
            {phase === 'setup' && setupData && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-700 font-medium flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        Escanea el código QR con Google Authenticator o Authy
                    </p>

                    {/* Aviso: si ya tenías una entrada antigua, elimínala antes */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800">
                            Si ya tenías NexusSalud en tu app de autenticación,{' '}
                            <strong>elimina la entrada antigua</strong> antes de escanear este QR.
                            Si no, el código que genere será incorrecto.
                        </p>
                    </div>

                    <div className="flex justify-center">
                        <img src={qrUrl(setupData.otpAuthUri)} alt="QR 2FA"
                            className="w-48 h-48 border border-gray-200 rounded-lg" />
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 mb-1">¿No puedes escanear el QR? Introduce esta clave manualmente:</p>
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                            <code className="text-xs font-mono text-gray-700 flex-1 break-all">{setupData.manualEntryKey}</code>
                            <button onClick={handleCopyKey} className="text-gray-400 hover:text-gray-700 flex-shrink-0">
                                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleEnable} className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                            Introduce el código de 6 dígitos de tu app para confirmar:
                        </label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text" inputMode="numeric" maxLength={6} pattern="\d{6}" required
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="input-field pl-10 text-center text-xl tracking-widest font-mono"
                                placeholder="000000"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" disabled={loading || code.length !== 6}
                                className="btn-primary text-sm px-4 py-2 disabled:opacity-50 flex-1">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                                Confirmar y activar
                            </button>
                            <button type="button" onClick={handleCancel}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── FASE: recovery-codes ── */}
            {phase === 'recovery-codes' && (
                <RecoveryCodesPanel
                    codes={recoveryCodes}
                    onDismiss={() => {
                        setPhase('idle');
                        setSuccessMsg('✅ 2FA activado. Guarda tus códigos de recuperación en un lugar seguro.');
                    }}
                />
            )}

            {/* ── FASE: verify-disable ── */}
            {phase === 'verify-disable' && (
                <form onSubmit={handleDisable} className="space-y-3">
                    <p className="text-sm text-gray-700">
                        Para desactivar el 2FA introduce el código actual de tu app de autenticación:
                    </p>
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text" inputMode="numeric" maxLength={6} pattern="\d{6}" required autoFocus
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="input-field pl-10 text-center text-xl tracking-widest font-mono"
                            placeholder="000000"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" disabled={loading || code.length !== 6}
                            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex-1">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                            Desactivar 2FA
                        </button>
                        <button type="button" onClick={handleCancel}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                            Cancelar
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default TwoFactorSettings;
