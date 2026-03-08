import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Calendar, FileText, Heart, Stethoscope, Users } from 'lucide-react';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import ErrorAlert from '../components/ErrorAlert';

const RegisterPage = () => {
    const [searchParams] = useSearchParams();
    const initialRole = searchParams.get('role') === 'doctor' ? 'Doctor' : 'Patient';

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        role: initialRole,
        firstName: '',
        lastName: '',
        dateOfBirth: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const validatePassword = (password) => {
        const minLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[@$!%*?&]/.test(password);

        if (!minLength) return 'La contraseña debe tener al menos 8 caracteres';
        if (!hasUpperCase) return 'La contraseña debe contener al menos una mayúscula';
        if (!hasLowerCase) return 'La contraseña debe contener al menos una minúscula';
        if (!hasNumber) return 'La contraseña debe contener al menos un número';
        if (!hasSpecialChar) return 'La contraseña debe contener al menos un carácter especial (@$!%*?&)';

        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Si es doctor, redirigir a formulario especializado
        if (formData.role === 'Doctor') {
            navigate('/register/doctor');
            return;
        }

        // Validación de contraseña
        const passwordError = validatePassword(formData.password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        // Validación de coincidencia de contraseñas
        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        // Validación de fecha de nacimiento para pacientes
        if (formData.role === 'Patient' && !formData.dateOfBirth) {
            setError('La fecha de nacimiento es obligatoria');
            return;
        }

        setLoading(true);

        try {
            const {...registerData } = formData;
            await register(registerData);
            navigate('/dashboard');
        } catch (err) {
            if (err.response?.data?.errors) {
                const backendErrors = err.response.data.errors;
                const firstError = Object.values(backendErrors)[0][0];
                setError(firstError);
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Error al registrar usuario. Intenta de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                        <Heart className="w-12 h-12 text-primary-600" />
                        <Link to="/">
                            <span className="text-4xl font-bold text-primary-600">NexusSalud</span>
                        </Link>
                    </div>
                    <p className="text-gray-600">Crea tu cuenta</p>
                </div>

                {/* Formulario */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error */}
                        <ErrorAlert error={error} onClose={() => setError('')} />

                        {/* Selector de rol */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                ¿Cómo quieres registrarte?
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'Patient' })}
                                    className={`p-4 rounded-lg border-2 transition-all ${formData.role === 'Patient'
                                        ? 'border-primary-600 bg-primary-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="text-center">
                                        <Users className="w-12 h-12 mx-auto mb-2 text-blue-600" />
                                        <div className="font-semibold">Paciente</div>
                                        <div className="text-xs text-gray-500 mt-1">Buscar doctores y reservar citas</div>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'Doctor' })}
                                    className={`p-4 rounded-lg border-2 transition-all ${formData.role === 'Doctor'
                                        ? 'border-primary-600 bg-primary-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="text-center">
                                        <Stethoscope className="w-12 h-12 mx-auto mb-2 text-green-600" />
                                        <div className="font-semibold">Doctor</div>
                                        <div className="text-xs text-gray-500 mt-1">Ofrecer consultas médicas</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {formData.role === 'Patient' ? (
                            <>
                                {/* Nombre y Apellido */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                                            Nombre
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                id="firstName"
                                                name="firstName"
                                                type="text"
                                                required
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                className="input-field pl-10"
                                                placeholder="Juan"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                                            Apellido
                                        </label>
                                        <input
                                            id="lastName"
                                            name="lastName"
                                            type="text"
                                            required
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            className="input-field"
                                            placeholder="Pérez"
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="input-field pl-10"
                                            placeholder="tu@email.com"
                                        />
                                    </div>
                                </div>

                                {/* Fecha de nacimiento */}
                                <div>
                                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                                        Fecha de Nacimiento *
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="dateOfBirth"
                                            name="dateOfBirth"
                                            type="date"
                                            required
                                            value={formData.dateOfBirth}
                                            onChange={handleChange}
                                            className="input-field pl-10"
                                        />
                                    </div>
                                </div>

                                {/* Contraseña */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                            Contraseña
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                id="password"
                                                name="password"
                                                type="password"
                                                required
                                                value={formData.password}
                                                onChange={handleChange}
                                                className="input-field pl-10"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <PasswordStrengthIndicator password={formData.password} />
                                    </div>
                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                            Confirmar Contraseña
                                        </label>
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            required
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="input-field"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                {/* Términos */}
                                <div className="flex items-start">
                                    <input
                                        id="terms"
                                        type="checkbox"
                                        required
                                        className="mt-1 mr-3 rounded border-gray-300"
                                    />
                                    <label htmlFor="terms" className="text-sm text-gray-600">
                                        Acepto los{' '}
                                        <Link to="/terms" className="text-primary-600 hover:text-primary-700">
                                            términos y condiciones
                                        </Link>{' '}
                                        y la{' '}
                                        <Link to="/privacy" className="text-primary-600 hover:text-primary-700">
                                            política de privacidad
                                        </Link>
                                    </label>
                                </div>

                                {/* Botón submit */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Registrando...' : 'Crear Cuenta'}
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Mensaje para doctores */}
                                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                                    <Stethoscope className="w-16 h-16 mx-auto mb-4 text-green-600" />
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                                        Registro de Profesional Médico
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        El registro para doctores requiere información adicional y validación de documentos.
                                    </p>
                                    <ul className="text-sm text-gray-600 text-left space-y-2 mb-6 max-w-md mx-auto">
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 mt-0.5">✓</span>
                                            <span>Datos personales y profesionales</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 mt-0.5">✓</span>
                                            <span>Escaneo del carnet de colegiado con validación OCR</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 mt-0.5">✓</span>
                                            <span>Selección de especialidades</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 mt-0.5">✓</span>
                                            <span>Revisión por administrador (24-48h)</span>
                                        </li>
                                    </ul>
                                    <button
                                        type="submit"
                                        className="btn-primary w-full max-w-md mx-auto"
                                    >
                                        Continuar con Registro Profesional
                                    </button>
                                </div>
                            </>
                        )}
                    </form>

                    {/* Login */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600 text-sm">
                            ¿Ya tienes cuenta?{' '}
                            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                                Inicia sesión aquí
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;