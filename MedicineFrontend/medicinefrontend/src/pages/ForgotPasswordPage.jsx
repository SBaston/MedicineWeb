// ═══════════════════════════════════════════════════════════════
// ForgotPasswordPage.jsx
// El usuario introduce su email y recibe un enlace de reset
// ═══════════════════════════════════════════════════════════════
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, Send } from 'lucide-react';
import api from '../services/api';
import logo from '../assets/nexussalud-logo1.jpg';
import DarkModeToggle from '../components/DarkModeToggle';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al enviar el email. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

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
                    <p className="text-gray-600 mt-2">Recuperación de contraseña</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {!sent ? (
                        <>
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Mail className="w-8 h-8 text-blue-600" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">¿Olvidaste tu contraseña?</h1>
                                <p className="text-gray-500 text-sm">
                                    Introduce tu email y te enviaremos un enlace para crear una nueva contraseña.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
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
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                                </button>
                            </form>
                        </>
                    ) : (
                        /* Pantalla de confirmación */
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">¡Email enviado!</h2>
                            <p className="text-gray-600 text-sm mb-2">
                                Si <strong>{email}</strong> está registrado en NexusSalud, recibirás un
                                enlace para restablecer tu contraseña en breve.
                            </p>
                            <p className="text-gray-400 text-xs mb-6">
                                El enlace caduca en 15 minutos. Revisa también tu carpeta de spam.
                            </p>
                            <button
                                onClick={() => { setSent(false); setEmail(''); }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                                ¿No recibiste el email? Intentar de nuevo
                            </button>
                        </div>
                    )}

                    {/* Volver al login */}
                    <div className="mt-6 text-center border-t border-gray-100 pt-5">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver al inicio de sesión
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
