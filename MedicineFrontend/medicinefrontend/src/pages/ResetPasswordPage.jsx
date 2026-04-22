// ═══════════════════════════════════════════════════════════════
// ResetPasswordPage.jsx
// Página a la que llega el usuario desde el enlace del email
// URL: /reset-password?token=xxxxxx
// ═══════════════════════════════════════════════════════════════
import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import logo from '../assets/nexussalud-logo1.jpg';
import DarkModeToggle from '../components/DarkModeToggle';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const validatePassword = (pwd) => {
        if (pwd.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
        if (!/[A-Z]/.test(pwd)) return 'Debe contener al menos una mayúscula';
        if (!/[a-z]/.test(pwd)) return 'Debe contener al menos una minúscula';
        if (!/\d/.test(pwd)) return 'Debe contener al menos un número';
        if (!/[@$!%*?&]/.test(pwd)) return 'Debe contener al menos un carácter especial (@$!%*?&)';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!token) {
            setError('El enlace de recuperación no es válido. Solicita uno nuevo.');
            return;
        }

        const pwdError = validatePassword(newPassword);
        if (pwdError) { setError(pwdError); return; }

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/reset-password', { token, newPassword });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al restablecer la contraseña');
        } finally {
            setLoading(false);
        }
    };

    // Token ausente o inválido
    if (!token) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-3">Enlace no válido</h2>
                    <p className="text-gray-500 text-sm mb-6">
                        Este enlace de recuperación no es válido o ya fue utilizado.
                    </p>
                    <Link to="/forgot-password" className="btn-primary inline-block">
                        Solicitar nuevo enlace
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4">
            <DarkModeToggle />
            <div className="max-w-md w-full">

                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center space-x-3 mb-2">
                        <img src={logo} alt="NexusSalud Logo" className="h-12 w-12 object-contain rounded-lg" />
                        <span className="text-4xl font-bold text-primary-600">NexusSalud</span>
                    </Link>
                    <p className="text-gray-600 mt-2">Restablecer contraseña</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {!success ? (
                        <>
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Lock className="w-8 h-8 text-blue-600" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">Nueva contraseña</h1>
                                <p className="text-gray-500 text-sm">
                                    Elige una contraseña segura para tu cuenta de NexusSalud.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-start gap-2">
                                        <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        {error}
                                    </div>
                                )}

                                {/* Nueva contraseña */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nueva contraseña
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="input-field pl-10 pr-10"
                                            placeholder="••••••••"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <PasswordStrengthIndicator password={newPassword} />
                                </div>

                                {/* Confirmar contraseña */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirmar contraseña
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="input-field pl-10"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    {confirmPassword && newPassword !== confirmPassword && (
                                        <p className="text-red-500 text-xs mt-1">Las contraseñas no coinciden</p>
                                    )}
                                    {confirmPassword && newPassword === confirmPassword && (
                                        <p className="text-green-500 text-xs mt-1 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Las contraseñas coinciden
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
                                </button>
                            </form>
                        </>
                    ) : (
                        /* Éxito */
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">¡Contraseña restablecida!</h2>
                            <p className="text-gray-600 text-sm mb-6">
                                Tu contraseña se ha actualizado correctamente. Redirigiendo al login...
                            </p>
                            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                                Ir al login ahora
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
