import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/adminService';
import { Crown, ArrowLeft, UserPlus, AlertCircle } from 'lucide-react';

const CreateAdminPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        department: '',
    });
    const [errors, setErrors] = useState({});

    // Si no es SuperAdmin, redirigir
    if (!user?.isSuperAdmin) {
        navigate('/admin');
        return null;
    }

    const mutation = useMutation({
        mutationFn: (data) => adminService.createAdmin(data),
        onSuccess: (response) => {
            // Mostrar mensaje de éxito y redirigir
            alert(`Admin creado exitosamente.\n\nEmail: ${response.admin.email}\nContraseña temporal enviada al correo.`);
            navigate('/admin');
        },
        onError: (error) => {
            setErrors({
                submit: error.response?.data?.message || 'Error al crear el administrador'
            });
        },
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Limpiar error del campo
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'El nombre completo es obligatorio';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'El email es obligatorio';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email no válido';
        }

        if (!formData.password) {
            newErrors.password = 'La contraseña es obligatoria';
        } else if (formData.password.length < 8) {
            newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            // Enviar datos (sin confirmPassword)
            const { confirmPassword, ...dataToSend } = formData;
            mutation.mutate(dataToSend);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container-custom max-w-2xl">

                {/* Botón volver */}
                <button
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al dashboard
                </button>

                {/* Cabecera */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                            <Crown className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Crear nuevo administrador</h1>
                            <p className="text-sm text-gray-500">Completa los datos del nuevo administrador del sistema</p>
                        </div>
                    </div>

                    {/* Mensaje de error general */}
                    {errors.submit && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-red-900 text-sm">Error al crear administrador</p>
                                <p className="text-red-700 text-sm mt-1">{errors.submit}</p>
                            </div>
                        </div>
                    )}

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Nombre completo */}
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre completo <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${errors.fullName
                                        ? 'border-red-300 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-primary-500'
                                    }`}
                                placeholder="Ej: María García López"
                            />
                            {errors.fullName && (
                                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${errors.email
                                        ? 'border-red-300 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-primary-500'
                                    }`}
                                placeholder="admin@medicare.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                Este será el email de acceso del administrador
                            </p>
                        </div>

                        {/* Contraseña */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Contraseña temporal <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${errors.password
                                        ? 'border-red-300 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-primary-500'
                                    }`}
                                placeholder="Mínimo 8 caracteres"
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                El administrador deberá cambiarla en su primer inicio de sesión
                            </p>
                        </div>

                        {/* Confirmar contraseña */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Confirmar contraseña <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${errors.confirmPassword
                                        ? 'border-red-300 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-primary-500'
                                    }`}
                                placeholder="Repite la contraseña"
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                            )}
                        </div>

                        {/* Departamento (opcional) */}
                        <div>
                            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                                Departamento <span className="text-gray-400">(opcional)</span>
                            </label>
                            <input
                                type="text"
                                id="department"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                                placeholder="Ej: Atención al usuario, IT, Gestión..."
                            />
                        </div>

                        {/* Botones */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => navigate('/admin')}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={mutation.isPending}
                                className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {mutation.isPending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Creando...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4" />
                                        Crear administrador
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Nota informativa */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-900">
                            <strong>Nota:</strong> El nuevo administrador recibirá un email con sus credenciales de acceso
                            y deberá cambiar su contraseña en el primer inicio de sesión.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateAdminPage;