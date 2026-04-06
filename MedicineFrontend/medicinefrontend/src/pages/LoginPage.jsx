import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/nexussalud-logo1.jpg';
import { Mail, Lock, AlertCircle, Heart, CheckCircle } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // ✅ Mensaje de éxito desde el registro
    const registrationSuccess = location.state?.registrationSuccess;
    const successMessage = location.state?.message;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await login(email, password);
            const userRole = response.user?.role;

            if (userRole === 'Admin') {
                // Admins (incluido SuperAdmin) → Dashboard de admin
                navigate('/admin');
            } else if (userRole === 'Doctor') {
                // Doctores → Dashboard de doctor
                navigate('/doctor/dashboard');
            } else if (userRole === 'Patient') {
                // Pacientes → Dashboard de paciente
                navigate('/dashboard');
            } else {
                // Fallback por si hay otro rol
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Email o contraseña incorrectos');
        } finally {
            setLoading(false);
        }
    };

    // ✅ DETECTAR TIPO DE ERROR Y MOSTRAR ESTILO APROPIADO
    const getErrorStyle = () => {
        if (error.includes('pendiente de aprobación') || error.includes('pendiente de verificación')) {
            return 'bg-yellow-50 border-yellow-300';
        } else if (error.includes('rechazada')) {
            return 'bg-red-50 border-red-300';
        } else if (error.includes('suspendida')) {
            return 'bg-orange-50 border-orange-300';
        } else if (error.includes('desactivada')) {
            return 'bg-gray-50 border-gray-300';
        } else {
            return 'bg-red-50 border-red-300';
        }
    };

    const getErrorIcon = () => {
        if (error.includes('pendiente de aprobación') || error.includes('pendiente de verificación')) {
            return (
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        } else {
            return <AlertCircle className="w-5 h-5 text-red-600" />;
        }
    };

    const getErrorTextColor = () => {
        if (error.includes('pendiente de aprobación') || error.includes('pendiente de verificación')) {
            return 'text-yellow-800';
        } else if (error.includes('rechazada')) {
            return 'text-red-800';
        } else if (error.includes('suspendida')) {
            return 'text-orange-800';
        } else if (error.includes('desactivada')) {
            return 'text-gray-800';
        } else {
            return 'text-red-700';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4">
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
                    <p className="text-gray-600">Inicia sesión en tu cuenta</p>
                </div>

                {/* Formulario */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* ✅ MENSAJE DE ÉXITO DESDE REGISTRO */}
                        {registrationSuccess && successMessage && (
                            <div className="bg-green-50 border border-green-300 rounded-lg p-4 flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-green-800 text-sm font-medium whitespace-pre-line">
                                        {successMessage}
                                    </p>
                                    <p className="text-xs text-green-700 mt-2">
                                        💡 Recibirás un email cuando tu cuenta sea aprobada.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ✅ ERROR CON ESTILOS DINÁMICOS */}
                        {error && (
                            <div className={`border rounded-lg p-4 flex items-start gap-3 ${getErrorStyle()}`}>
                                <div className="flex-shrink-0 mt-0.5">
                                    {getErrorIcon()}
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm font-medium whitespace-pre-line ${getErrorTextColor()}`}>
                                        {error}
                                    </p>
                                    {error.includes('pendiente de aprobación') && (
                                        <p className="text-xs text-yellow-700 mt-2">
                                            💡 Tu cuenta está siendo revisada. Recibirás un email cuando sea aprobada.
                                        </p>
                                    )}
                                    {error.includes('pendiente de verificación') && (
                                        <p className="text-xs text-yellow-700 mt-2">
                                            💡 Tu documentación está siendo verificada por nuestro equipo.
                                        </p>
                                    )}
                                    {error.includes('rechazada') && (
                                        <p className="text-xs text-red-700 mt-2">
                                            💡 Contacta con soporte si necesitas más información.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Email */}
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
                                />
                            </div>
                        </div>

                        {/* Contraseña */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Contraseña
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
                                <span className="text-gray-600">Recordarme</span>
                            </label>
                            <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700 font-medium">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>

                        {/* Botón submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </button>
                    </form>

                    {/* Registro */}
                    <div className="mt-6 text-center space-y-3">
                        <p className="text-gray-600 text-sm">
                            ¿No tienes cuenta?{' '}
                            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                                Regístrate aquí
                            </Link>
                        </p>

                        
                        
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;