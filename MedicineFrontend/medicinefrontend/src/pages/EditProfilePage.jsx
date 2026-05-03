import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import patientService from '../services/patientService';
import { User, Phone, MapPin, Save, ArrowLeft } from 'lucide-react';
import ErrorAlert from '../components/ErrorAlert';
import AvatarSelector from '../components/AvatarSelector';
import { useAuth } from '../context/AuthContext';
import TwoFactorSettings from '../components/TwoFactorSettings';

const EditProfilePage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isInitialized = useRef(false);
    const { refreshUser } = useAuth(); // ← Añadir esto

    const [formData, setFormData] = useState({
        phoneNumber: '',
        address: '',
        city: '',
        postalCode: '',
        country: 'España',
        gender: '',
        emergencyContact: '',
        medicalHistory: '',
        profilePictureUrl: '',
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Obtener datos actuales
    const { data: profileData, isLoading } = useQuery({
        queryKey: ['patient-profile'],
        queryFn: patientService.getMyProfile,
    });

    const patient = profileData?.patient || profileData;

    // Actualizar formulario cuando se cargan los datos
    // ✅ Solución: Mover la lógica de inicialización fuera del useEffect
    useEffect(() => {
        if (patient && !isInitialized.current) {
            // Usar setTimeout para ejecutar en el siguiente ciclo de render
            const timeoutId = setTimeout(() => {
                setFormData({
                    phoneNumber: patient.phoneNumber || '',
                    address: patient.address || '',
                    city: patient.city || '',
                    postalCode: patient.postalCode || '',
                    country: patient.country || 'España',
                    gender: patient.gender || '',
                    emergencyContact: patient.emergencyContact || '',
                    medicalHistory: patient.medicalHistory || '',
                    profilePictureUrl: patient.profilePictureUrl || '',
                });
                isInitialized.current = true;
            }, 0);

            return () => clearTimeout(timeoutId);
        }
    }, [patient]);

    // Mutación para actualizar
    const updateMutation = useMutation({
        mutationFn: patientService.updateProfile,
        onSuccess: async () => {
            // Invalidar queries para forzar recarga
            queryClient.invalidateQueries(['patient-profile']);

            // Refrescar el usuario en el contexto (para actualizar el Navbar)
            await refreshUser();

            setSuccess('¡Perfil actualizado correctamente!');
            setError('');

            // Resetear la flag de inicialización para que se recarguen los datos
            isInitialized.current = false;

            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'Error al actualizar el perfil');
            setSuccess('');
        },
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        updateMutation.mutate(formData);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="container-custom py-8">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Volver al dashboard
                </button>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Editar perfil
                </h1>
                <p className="text-gray-600">
                    Completa tu información personal para una mejor experiencia.
                </p>
            </div>

            {/* Formulario */}
            <div className="max-w-3xl">
                <div className="bg-white rounded-xl shadow-md p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Alertas */}
                        <ErrorAlert error={error} onClose={() => setError('')} />

                        {success && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-green-700 text-sm font-medium">{success}</p>
                            </div>
                        )}

                        {/* Información de contacto */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Phone className="w-5 h-5 text-primary-600" />
                                Información de contacto
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                                        Teléfono
                                    </label>
                                    <input
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="+34 600 000 000"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-2">
                                        Contacto de emergencia
                                    </label>
                                    <input
                                        id="emergencyContact"
                                        name="emergencyContact"
                                        type="text"
                                        value={formData.emergencyContact}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="Nombre y teléfono de contacto de emergencia"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Ejemplo: María Pérez - +34 600 123 456
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Dirección */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary-600" />
                                Dirección
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                                        Dirección completa
                                    </label>
                                    <input
                                        id="address"
                                        name="address"
                                        type="text"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="Calle, número, piso, puerta"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                                            Ciudad
                                        </label>
                                        <input
                                            id="city"
                                            name="city"
                                            type="text"
                                            value={formData.city}
                                            onChange={handleChange}
                                            className="input-field"
                                            placeholder="Madrid"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                                            Código postal
                                        </label>
                                        <input
                                            id="postalCode"
                                            name="postalCode"
                                            type="text"
                                            value={formData.postalCode}
                                            onChange={handleChange}
                                            className="input-field"
                                            placeholder="28001"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                                        País
                                    </label>
                                    <input
                                        id="country"
                                        name="country"
                                        type="text"
                                        value={formData.country}
                                        onChange={handleChange}
                                        className="input-field"
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Información personal */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-primary-600" />
                                Información personal
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                                        Género
                                    </label>
                                    <select
                                        id="gender"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="input-field"
                                    >
                                        <option value="">Selecciona una opción</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Femenino">Femenino</option>
                                        <option value="Otro">Otro</option>
                                        <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 mb-2">
                                        Historial médico (opcional)
                                    </label>
                                    <textarea
                                        id="medicalHistory"
                                        name="medicalHistory"
                                        value={formData.medicalHistory}
                                        onChange={handleChange}
                                        className="input-field"
                                        rows={4}
                                        placeholder="Alergias, medicamentos actuales, condiciones médicas previas..."
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Esta información ayudará a los doctores a brindarte mejor atención
                                    </p>
                                </div>

                                {/* Avatar */}
                                <div className="mt-4">
                                    <AvatarSelector
                                        selectedAvatar={formData.profilePictureUrl}
                                        userName={patient ? `${patient.firstName} ${patient.lastName}` : ''}
                                        onSelect={(avatarUrl) => setFormData({ ...formData, profilePictureUrl: avatarUrl })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Botones */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={updateMutation.isPending}
                                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="btn-secondary"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>

                {/* Seguridad: 2FA */}
                <div className="mt-6">
                    <TwoFactorSettings />
                </div>

                {/* Nota de privacidad */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <strong>🔒 Tu privacidad es importante:</strong> Tus datos están protegidos y solo serán compartidos con los profesionales médicos que elijas para tus consultas.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EditProfilePage;