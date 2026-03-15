// ═══════════════════════════════════════════════════════════════
// CompleteProfilePage.jsx - Completar Perfil Profesional
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, Upload, Camera, MapPin, Phone,
    Award, Calendar, DollarSign, FileText, CheckCircle,
    X, User
} from 'lucide-react';

const CompleteProfilePage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState(null);
    const [formData, setFormData] = useState({
        firstName: 'Juan',
        lastName: 'Pérez González',
        professionalLicense: 'COL123456',
        phoneNumber: '',
        yearsOfExperience: '',
        description: '',
        specialties: [],
        city: '',
        country: 'España',
        postalCode: '',
        pricePerSession: '',
    });

    const [specialtiesList, setSpecialtiesList] = useState([]);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        // TODO: Fetch specialties from API
        setSpecialtiesList([
            { id: 1, name: 'Cardiología' },
            { id: 2, name: 'Dermatología' },
            { id: 3, name: 'Pediatría' },
            { id: 4, name: 'Psiquiatría' },
            { id: 5, name: 'Traumatología' },
        ]);

        // TODO: Fetch current doctor data
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const toggleSpecialty = (specialtyId) => {
        setFormData(prev => ({
            ...prev,
            specialties: prev.specialties.includes(specialtyId)
                ? prev.specialties.filter(id => id !== specialtyId)
                : [...prev.specialties, specialtyId]
        }));
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.phoneNumber) newErrors.phoneNumber = 'El teléfono es obligatorio';
        if (!formData.yearsOfExperience) newErrors.yearsOfExperience = 'Los años de experiencia son obligatorios';
        if (!formData.description || formData.description.length < 50) {
            newErrors.description = 'La descripción debe tener al menos 50 caracteres';
        }
        if (formData.specialties.length === 0) {
            newErrors.specialties = 'Selecciona al menos una especialidad';
        }
        if (!formData.pricePerSession || formData.pricePerSession <= 0) {
            newErrors.pricePerSession = 'El precio por sesión debe ser mayor que 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setLoading(true);

        try {
            // TODO: Upload profile image first
            // TODO: Submit form data to API

            setTimeout(() => {
                setLoading(false);
                navigate('/doctor');
            }, 2000);
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            setLoading(false);
        }
    };

    const completionPercentage = () => {
        let completed = 0;
        const total = 8;

        if (profileImagePreview) completed++;
        if (formData.phoneNumber) completed++;
        if (formData.yearsOfExperience) completed++;
        if (formData.description && formData.description.length >= 50) completed++;
        if (formData.specialties.length > 0) completed++;
        if (formData.city) completed++;
        if (formData.postalCode) completed++;
        if (formData.pricePerSession) completed++;

        return Math.round((completed / total) * 100);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate('/doctor')}
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Volver al dashboard</span>
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm text-slate-600">Completitud del perfil</p>
                                <p className="text-lg font-bold text-blue-600">{completionPercentage()}%</p>
                            </div>
                            <div className="w-16 h-16">
                                <svg className="transform -rotate-90" viewBox="0 0 36 36">
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="16"
                                        fill="none"
                                        stroke="#e2e8f0"
                                        strokeWidth="3"
                                    />
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="16"
                                        fill="none"
                                        stroke="#3b82f6"
                                        strokeWidth="3"
                                        strokeDasharray={`${completionPercentage()}, 100`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Completa tu perfil profesional</h1>
                    <p className="text-slate-600">
                        Añade la información necesaria para que los pacientes puedan conocerte mejor
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Profile Picture */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Foto de perfil</h2>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="relative">
                                {profileImagePreview ? (
                                    <img
                                        src={profileImagePreview}
                                        alt="Preview"
                                        className="w-32 h-32 rounded-2xl object-cover border-4 border-blue-100"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border-4 border-slate-100">
                                        <Camera className="w-12 h-12 text-slate-400" />
                                    </div>
                                )}
                                <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                                    <Upload className="w-5 h-5 text-white" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 mb-1">
                                    Sube una foto profesional
                                </h3>
                                <p className="text-sm text-slate-600 mb-3">
                                    Una buena foto genera confianza en los pacientes
                                </p>
                                <p className="text-xs text-slate-500">
                                    Formatos: JPG, PNG. Tamaño máximo: 5MB
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Personal Information */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-purple-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Información personal</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    disabled
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Apellidos *
                                </label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    disabled
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    <Phone className="w-4 h-4 inline mr-1" />
                                    Teléfono *
                                </label>
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    placeholder="+34 600 000 000"
                                    className={`w-full px-4 py-3 rounded-lg border ${errors.phoneNumber ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                />
                                {errors.phoneNumber && (
                                    <p className="text-red-600 text-sm mt-1">{errors.phoneNumber}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Nº Colegiado *
                                </label>
                                <input
                                    type="text"
                                    name="professionalLicense"
                                    value={formData.professionalLicense}
                                    disabled
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Professional Information */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <Award className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Información profesional</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    Años de experiencia *
                                </label>
                                <input
                                    type="number"
                                    name="yearsOfExperience"
                                    value={formData.yearsOfExperience}
                                    onChange={handleInputChange}
                                    min="0"
                                    max="60"
                                    placeholder="Ej: 10"
                                    className={`w-full px-4 py-3 rounded-lg border ${errors.yearsOfExperience ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                />
                                {errors.yearsOfExperience && (
                                    <p className="text-red-600 text-sm mt-1">{errors.yearsOfExperience}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Descripción profesional *
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={6}
                                    placeholder="Cuéntales a tus futuros pacientes sobre tu experiencia, formación, especialización y enfoque médico. Sé claro, profesional y cercano. Mínimo 50 caracteres."
                                    className={`w-full px-4 py-3 rounded-lg border ${errors.description ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                                />
                                <div className="flex items-center justify-between mt-2">
                                    <p className="text-sm text-slate-500">
                                        {formData.description.length} / 2000 caracteres
                                    </p>
                                    {errors.description && (
                                        <p className="text-red-600 text-sm">{errors.description}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-3">
                                    Especialidades *
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {specialtiesList.map((specialty) => (
                                        <button
                                            key={specialty.id}
                                            type="button"
                                            onClick={() => toggleSpecialty(specialty.id)}
                                            className={`p-3 rounded-lg border-2 transition-all ${formData.specialties.includes(specialty.id)
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                    : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${formData.specialties.includes(specialty.id)
                                                        ? 'border-blue-600 bg-blue-600'
                                                        : 'border-slate-300'
                                                    }`}>
                                                    {formData.specialties.includes(specialty.id) && (
                                                        <CheckCircle className="w-4 h-4 text-white" />
                                                    )}
                                                </div>
                                                <span className="font-medium text-sm">{specialty.name}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                {errors.specialties && (
                                    <p className="text-red-600 text-sm mt-2">{errors.specialties}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-amber-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Ubicación</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Ciudad
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    placeholder="Ej: Madrid"
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Código postal
                                </label>
                                <input
                                    type="text"
                                    name="postalCode"
                                    value={formData.postalCode}
                                    onChange={handleInputChange}
                                    placeholder="Ej: 28001"
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    País
                                </label>
                                <input
                                    type="text"
                                    name="country"
                                    value={formData.country}
                                    disabled
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Precio por sesión</h2>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Precio (€) *
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">
                                    €
                                </span>
                                <input
                                    type="number"
                                    name="pricePerSession"
                                    value={formData.pricePerSession}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.01"
                                    placeholder="75.00"
                                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.pricePerSession ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                />
                            </div>
                            {errors.pricePerSession && (
                                <p className="text-red-600 text-sm mt-1">{errors.pricePerSession}</p>
                            )}
                            <p className="text-sm text-slate-500 mt-2">
                                Podrás modificar este precio más adelante desde la configuración
                            </p>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/doctor')}
                            className="px-6 py-3 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Guardar perfil
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CompleteProfilePage;