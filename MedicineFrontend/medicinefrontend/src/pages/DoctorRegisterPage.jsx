// ═══════════════════════════════════════════════════════════════
// Frontend/src/pages/DoctorRegisterPage.jsx
// Formulario completo de registro de doctores con 6 imágenes
// ✅ ACTUALIZADO: 6 campos de imágenes (sin OCR)
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import CameraCapture from '../components/CameraCapture';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import SpecialtySelector from '../components/SpecialtySelector';
import {
    Stethoscope, Camera, Upload, CheckCircle, AlertCircle,
    Loader, ChevronRight, FileText, Shield, User, Mail,
    Lock, Phone, DollarSign, Briefcase, FileCheck, Home
} from 'lucide-react';
import doctorService from '../services/doctorService';

const DoctorRegisterPage = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [showCamera, setShowCamera] = useState(null); // 'licenseFront' | 'licenseBack' | 'idFront' | 'idBack' | 'specialty' | 'university' | 'profile' | null

    // ═══════════════════════════════════════════════════════════
    // Estado del formulario
    // ═══════════════════════════════════════════════════════════
    const [formData, setFormData] = useState({
        // Datos personales
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',

        // Datos profesionales
        professionalLicense: '',
        specialties: [],
        yearsOfExperience: 0,
        pricePerSession: 50,
        description: '',

        // ✅ DOCUMENTOS - 6 IMÁGENES (Base64)
        professionalLicenseFront: '',      // OBLIGATORIO
        professionalLicenseBack: '',       // OBLIGATORIO
        idDocumentFront: '',               // OPCIONAL
        idDocumentBack: '',                // OPCIONAL
        specialtyDegree: '',               // OPCIONAL
        universityDegree: '',              // OPCIONAL
        profilePicture: ''                 // OPCIONAL
    });

    const [errors, setErrors] = useState({});

    // ═══════════════════════════════════════════════════════════
    // Mutación para registro
    // ═══════════════════════════════════════════════════════════
    const registerMutation = useMutation({
        mutationFn: (data) => doctorService.register(data),
        onSuccess: () => {
            // Redirigir a login con mensaje de éxito
            navigate('/login', {
                state: {
                    registrationSuccess: true,
                    message: '✅ Registro exitoso. Tu cuenta está pendiente de verificación por un administrador. Recibirás un email cuando sea aprobada.',
                    email: formData.email
                }
            });
        },
        onError: (error) => {
            setErrors({
                submit: error.response?.data?.message || 'Error en el registro'
            });
        }
    });

    // ═══════════════════════════════════════════════════════════
    // Handlers
    // ═══════════════════════════════════════════════════════════
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleCameraCapture = (imageBase64, docType) => {
        setFormData(prev => ({
            ...prev,
            [docType]: imageBase64
        }));
        setShowCamera(null);
    };

    // ═══════════════════════════════════════════════════════════
    // Validación por paso
    // ═══════════════════════════════════════════════════════════
    const validateStep = (step) => {
        const newErrors = {};

        if (step === 1) {
            if (!formData.firstName.trim()) newErrors.firstName = 'Nombre obligatorio';
            if (!formData.lastName.trim()) newErrors.lastName = 'Apellidos obligatorios';
            if (!formData.email.trim()) newErrors.email = 'Email obligatorio';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                newErrors.email = 'Email inválido';
            }
            if (!formData.password) newErrors.password = 'Contraseña obligatoria';
            else if (formData.password.length < 8) {
                newErrors.password = 'Mínimo 8 caracteres';
            }
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Las contraseñas no coinciden';
            }
        }

        if (step === 2) {
            if (!formData.professionalLicense.trim()) {
                newErrors.professionalLicense = 'Número de colegiado obligatorio';
            }
            if (formData.specialties.length === 0) {
                newErrors.specialties = 'Selecciona al menos una especialidad';
            }
            if (formData.pricePerSession < 20 || formData.pricePerSession > 500) {
                newErrors.pricePerSession = 'Precio entre 20€ y 500€';
            }
        }

        if (step === 3) {
            // ✅ VALIDAR IMÁGENES OBLIGATORIAS (6 obligatorias)
            if (!formData.professionalLicenseFront) {
                newErrors.professionalLicenseFront = 'La imagen frontal del carnet de colegiado es obligatoria';
            }
            if (!formData.professionalLicenseBack) {
                newErrors.professionalLicenseBack = 'La imagen trasera del carnet de colegiado es obligatoria';
            }
            if (!formData.idDocumentFront) {
                newErrors.idDocumentFront = 'La imagen frontal del DNI es obligatoria';
            }
            if (!formData.idDocumentBack) {
                newErrors.idDocumentBack = 'La imagen trasera del DNI es obligatoria';
            }
            if (!formData.specialtyDegree) {
                newErrors.specialtyDegree = 'El título de especialidad es obligatorio';
            }
            if (!formData.universityDegree) {
                newErrors.universityDegree = 'El título universitario es obligatorio';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 3));
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateStep(3)) {
            // Preparar datos para enviar
            const dataToSend = {
                ...formData,
                specialtyIds: formData.specialties.map(s => s.id),
                phoneNumber: formData.phoneNumber?.trim() || null,
            };
            delete dataToSend.specialties;
            delete dataToSend.confirmPassword;

            registerMutation.mutate(dataToSend);
        }
    };

    // ═══════════════════════════════════════════════════════════
    // Render
    // ═══════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 py-12 px-4">
            <div className="container-custom max-w-4xl">

                {/* ✅ LINK AL HOME */}
                <div className="mb-6">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        Volver al inicio
                    </Link>
                </div>

                {/* Cabecera */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm mb-4">
                        <Stethoscope className="w-6 h-6 text-primary-600" />
                        <span className="font-bold text-lg text-gray-900">Registro de Profesional</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Únete a NexusSalud
                    </h1>
                    <p className="text-gray-600">
                        Completa tu registro para empezar a atender pacientes
                    </p>
                </div>

                {/* Indicador de pasos */}
                <div className="flex items-center justify-center mb-8">
                    {[1, 2, 3].map(step => (
                        <div key={step} className="flex items-center">
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center font-bold
                                transition-all duration-300
                                ${currentStep >= step
                                    ? 'bg-primary-600 text-white shadow-lg scale-110'
                                    : 'bg-gray-200 text-gray-500'
                                }
                            `}>
                                {step}
                            </div>
                            {step < 3 && (
                                <div className={`
                                    w-20 h-1 transition-all duration-300
                                    ${currentStep > step ? 'bg-primary-600' : 'bg-gray-200'}
                                `} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Formulario */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit}>

                        {/* PASO 1: Datos Personales */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary-600" />
                                    Datos Personales
                                </h2>

                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Nombre */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nombre *
                                        </label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            className={`input-field ${errors.firstName ? 'border-red-300' : ''}`}
                                            placeholder="Juan"
                                        />
                                        {errors.firstName && (
                                            <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
                                        )}
                                    </div>

                                    {/* Apellidos */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Apellidos *
                                        </label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            className={`input-field ${errors.lastName ? 'border-red-300' : ''}`}
                                            placeholder="García López"
                                        />
                                        {errors.lastName && (
                                            <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Mail className="w-4 h-4 inline mr-1" />
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`input-field ${errors.email ? 'border-red-300' : ''}`}
                                        placeholder="doctor@nexussalud.com"
                                    />
                                    {errors.email && (
                                        <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                                    )}
                                </div>

                                {/* Teléfono */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Phone className="w-4 h-4 inline mr-1" />
                                        Teléfono (opcional)
                                    </label>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="+34 600 123 456"
                                    />
                                </div>

                                {/* Contraseña */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Lock className="w-4 h-4 inline mr-1" />
                                            Contraseña *
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className={`input-field ${errors.password ? 'border-red-300' : ''}`}
                                            placeholder="Mínimo 8 caracteres"
                                        />
                                        {errors.password && (
                                            <p className="text-red-600 text-sm mt-1">{errors.password}</p>
                                        )}
                                        <PasswordStrengthIndicator password={formData.password} />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Confirmar contraseña *
                                        </label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className={`input-field ${errors.confirmPassword ? 'border-red-300' : ''}`}
                                            placeholder="Repetir contraseña"
                                        />
                                        {errors.confirmPassword && (
                                            <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PASO 2: Datos Profesionales */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-primary-600" />
                                    Datos Profesionales
                                </h2>

                                {/* Número de colegiado */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Shield className="w-4 h-4 inline mr-1" />
                                        Número de Colegiado *
                                    </label>
                                    <input
                                        type="text"
                                        name="professionalLicense"
                                        value={formData.professionalLicense}
                                        onChange={handleChange}
                                        className={`input-field ${errors.professionalLicense ? 'border-red-300' : ''}`}
                                        placeholder="280012345"
                                    />
                                    {errors.professionalLicense && (
                                        <p className="text-red-600 text-sm mt-1">{errors.professionalLicense}</p>
                                    )}
                                    <p className="text-gray-500 text-xs mt-1">
                                        ✅ Sin límite de caracteres
                                    </p>
                                </div>

                                {/* Especialidades */}
                                <SpecialtySelector
                                    selectedSpecialties={formData.specialties}
                                    onChange={(specialties) => setFormData(prev => ({ ...prev, specialties }))}
                                    error={errors.specialties}
                                />

                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Años de experiencia */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Años de experiencia
                                        </label>
                                        <input
                                            type="number"
                                            name="yearsOfExperience"
                                            value={formData.yearsOfExperience}
                                            onChange={handleChange}
                                            min="0"
                                            max="50"
                                            className="input-field"
                                        />
                                    </div>

                                    {/* Precio por sesión */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <DollarSign className="w-4 h-4 inline mr-1" />
                                            Precio por sesión (€) *
                                        </label>
                                        <input
                                            type="number"
                                            name="pricePerSession"
                                            value={formData.pricePerSession}
                                            onChange={handleChange}
                                            min="20"
                                            max="500"
                                            step="5"
                                            className={`input-field ${errors.pricePerSession ? 'border-red-300' : ''}`}
                                        />
                                        {errors.pricePerSession && (
                                            <p className="text-red-600 text-sm mt-1">{errors.pricePerSession}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Descripción */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Descripción profesional
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={4}
                                        maxLength={2000}
                                        className="input-field resize-none"
                                        placeholder="Cuéntanos sobre tu experiencia, enfoque y qué te diferencia como profesional..."
                                    />
                                    <p className="text-gray-500 text-xs mt-1">
                                        {formData.description.length}/2000 caracteres
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* PASO 3: Documentos - 6 IMÁGENES */}
                        {currentStep === 3 && (
                            <DocumentUploadSection
                                formData={formData}
                                errors={errors}
                                setShowCamera={setShowCamera}
                            />
                        )}

                        {/* Error de envío */}
                        {errors.submit && (
                            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Error en el registro</p>
                                    <p className="text-sm">{errors.submit}</p>
                                </div>
                            </div>
                        )}

                        {/* Botones de navegación */}
                        <div className="flex gap-4 mt-8 pt-6 border-t">
                            {currentStep > 1 && (
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="flex-1 btn-secondary"
                                >
                                    Anterior
                                </button>
                            )}

                            {currentStep < 3 ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                                >
                                    Siguiente
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={registerMutation.isPending}
                                    className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {registerMutation.isPending ? (
                                        <>
                                            <Loader className="w-4 h-4 animate-spin" />
                                            Registrando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Completar registro
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Link a login */}
                        <div className="text-center mt-6">
                            <p className="text-sm text-gray-600">
                                ¿Ya tienes una cuenta?{' '}
                                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                                    Inicia sesión
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            {/* Modal de cámara */}
            {showCamera && (
                <CameraCapture
                    title={getCameraTitle(showCamera)}
                    onCapture={(image) => handleCameraCapture(image, showCamera)}
                    onClose={() => setShowCamera(null)}
                />
            )}
        </div>
    );
};

// ════════════════════════════════════════════════════════════════
// COMPONENTE: SECCIÓN DE DOCUMENTOS CON 6 IMÁGENES
// ════════════════════════════════════════════════════════════════

const DocumentUploadSection = ({ formData, errors, setShowCamera }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-primary-600" />
                Documentos de Verificación
            </h2>

            {/* CARNET DE COLEGIADO - OBLIGATORIO */}
            <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    📋 Carnet de Colegiado * <span className="text-red-500">(Obligatorio)</span>
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <DocumentCard
                        label="Cara Delantera *"
                        image={formData.professionalLicenseFront}
                        onCapture={() => setShowCamera('professionalLicenseFront')}
                        error={errors.professionalLicenseFront}
                        required
                    />
                    <DocumentCard
                        label="Cara Trasera *"
                        image={formData.professionalLicenseBack}
                        onCapture={() => setShowCamera('professionalLicenseBack')}
                        error={errors.professionalLicenseBack}
                        required
                    />
                </div>
            </div>

            {/* DNI/PASAPORTE - OBLIGATORIO */}
            <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    🪪 DNI/Pasaporte * <span className="text-red-500">(Obligatorio)</span>
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <DocumentCard
                        label="Cara Delantera *"
                        image={formData.idDocumentFront}
                        onCapture={() => setShowCamera('idDocumentFront')}
                        error={errors.idDocumentFront}
                        required
                    />
                    <DocumentCard
                        label="Cara Trasera *"
                        image={formData.idDocumentBack}
                        onCapture={() => setShowCamera('idDocumentBack')}
                        error={errors.idDocumentBack}
                        required
                    />
                </div>
            </div>

            {/* TÍTULOS ACADÉMICOS - OBLIGATORIO */}
            <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    🎓 Títulos Académicos * <span className="text-red-500">(Obligatorio)</span>
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <DocumentCard
                        label="Título de Especialidad *"
                        image={formData.specialtyDegree}
                        onCapture={() => setShowCamera('specialtyDegree')}
                        error={errors.specialtyDegree}
                        required
                    />
                    <DocumentCard
                        label="Título Universitario *"
                        image={formData.universityDegree}
                        onCapture={() => setShowCamera('universityDegree')}
                        error={errors.universityDegree}
                        required
                    />
                </div>
            </div>

            {/* FOTO DE PERFIL - OPCIONAL */}
            <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    👤 Foto de Perfil <span className="text-gray-500">(Opcional)</span>
                </h3>
                <div className="max-w-xs">
                    <DocumentCard
                        label="Foto de Perfil"
                        image={formData.profilePicture}
                        onCapture={() => setShowCamera('profilePicture')}
                    />
                </div>
            </div>

            {/* Info adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                <p className="font-semibold mb-2">📋 Proceso de verificación:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Tu documentación será revisada por nuestro equipo en 24-48 horas</li>
                    <li>Recibirás un email con el estado de tu solicitud</li>
                    <li>Una vez aprobado, podrás completar tu perfil y empezar a atender pacientes</li>
                </ul>
            </div>
        </div>
    );
};

// ════════════════════════════════════════════════════════════════
// COMPONENTE: CARD DE DOCUMENTO
// ════════════════════════════════════════════════════════════════

const DocumentCard = ({ label, image, onCapture, error }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
            </label>

            {!image ? (
                <button
                    type="button"
                    onClick={onCapture}
                    className={`w-full border-2 border-dashed rounded-lg p-6 hover:border-primary-500 hover:bg-primary-50 transition-all group ${error ? 'border-red-300' : 'border-gray-300'
                        }`}
                >
                    <Camera className="w-10 h-10 mx-auto mb-2 text-gray-400 group-hover:text-primary-600" />
                    <p className="text-sm font-medium text-gray-700 group-hover:text-primary-700">
                        Capturar o subir
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, WEBP
                    </p>
                </button>
            ) : (
                <div className="relative">
                    <img
                        src={image}
                        alt={label}
                        className="w-full h-32 object-cover bg-gray-100 rounded-lg border-2 border-green-500"
                    />
                    <button
                        type="button"
                        onClick={onCapture}
                        className="absolute top-2 right-2 bg-white hover:bg-gray-100 p-2 rounded-full shadow-lg"
                    >
                        <Camera className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                        ✓ Cargada
                    </div>
                </div>
            )}

            {error && (
                <p className="text-red-600 text-xs mt-1">{error}</p>
            )}
        </div>
    );
};

// ════════════════════════════════════════════════════════════════
// HELPER: Título de cámara según tipo
// ════════════════════════════════════════════════════════════════

const getCameraTitle = (type) => {
    const titles = {
        professionalLicenseFront: 'Carnet de Colegiado (Delante)',
        professionalLicenseBack: 'Carnet de Colegiado (Atrás)',
        idDocumentFront: 'DNI/Pasaporte (Delante)',
        idDocumentBack: 'DNI/Pasaporte (Atrás)',
        specialtyDegree: 'Título de Especialidad',
        universityDegree: 'Título Universitario',
        profilePicture: 'Foto de Perfil'
    };
    return titles[type] || 'Documento';
};

export default DoctorRegisterPage;