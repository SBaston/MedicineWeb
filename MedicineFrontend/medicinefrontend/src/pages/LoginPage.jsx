import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/nexussalud-logo1.jpg';
import { Mail, Lock, AlertCircle, Heart, CheckCircle } from 'lucide-react';
import DarkModeToggle from '../components/DarkModeToggle';
import { useLanguage } from '../context/LanguageContext';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    // ✅ NUEVO: Detectar si viene de registro exitoso
    const registrationSuccess = location.state?.registrationSuccess;
    const registrationMessage = location.state?.message;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await login(email, password);
            const userRole = response.user?.role;

            if (userRole === 'Admin') {
                navigate('/admin');
            } else if (userRole === 'Doctor') {
                navigate('/doctor/dashboard');
            } else if (userRole === 'Patient') {
                navigate('/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || t('login.errorDefault'));
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
                    <div className="flex items-center justify-center space-x-2 mb-2">
                        <Link to="/" className="flex items-center space-x-3">
                            <img
                                src={logo}
                                alt="NexusSalud Logo"
                                className="h-12 w-12 object-contain rounded-lg"
                            />
                            <span className="text-4xl font-bold text-primary-600">NexusSalud</span>
                        </Link>
                    </div>
                    <p className="text-gray-600">{t('login.subtitle')}</p>
                </div>

                {/* Formulario */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* ✅ NUEVO: Mensaje verde de registro exitoso */}
                        {registrationSuccess && (
                            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-green-800 font-semibold text-sm mb-1">
                                            {t('login.successTitle')}
                                        </p>
                                        <p className="text-green-700 text-sm leading-relaxed">
                                            {registrationMessage || t('login.successDefault')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <span className="text-red-700 text-sm">{error}</span>
                            </div>
                        )}

                        {/* Email */}
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

                        {/* Contraseña */}
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

                        {/* Recordar / Olvidé contraseña */}
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center">
                                <input type="checkbox" className="mr-2 rounded border-gray-300" />
                                <span className="text-gray-600">{t('login.remember')}</span>
                            </label>
                            <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700 font-medium">
                                {t('login.forgotPassword')}
                            </Link>
                        </div>

                        {/* Botón submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? t('login.loading') : t('login.submit')}
                        </button>
                    </form>

                    {/* Registro */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600 text-sm">
                            {t('login.noAccount')}{' '}
                            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                                {t('login.registerHere')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;