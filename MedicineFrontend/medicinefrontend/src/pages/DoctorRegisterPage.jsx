// ═══════════════════════════════════════════════════════════════
// Frontend/src/pages/DoctorRegisterPage.jsx
// ✅ ACTUALIZADO: Con términos de contenido integrados (Paso 4)
// ✅ ACTUALIZADO: Con redes sociales opcionales
// ═══════════════════════════════════════════════════════════════

import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import CameraCapture from '../components/CameraCapture';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import SpecialtySelector from '../components/SpecialtySelector';
import {
    Stethoscope, Camera, Upload, CheckCircle, AlertCircle,
    Loader, ChevronRight, FileText, Shield, User, Mail,
    Lock, Phone, DollarSign, Briefcase, FileCheck, Home,
    Scale, AlertCircle as Alert
} from 'lucide-react';
import doctorService from '../services/doctorService';
import DarkModeToggle from '../components/DarkModeToggle';
import { useLanguage } from '../context/LanguageContext';
import { translateError } from '../utils/translateError';

const DoctorRegisterPage = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [currentStep, setCurrentStep] = useState(1);
    const [showCamera, setShowCamera] = useState(null);

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
        specialtyIds: [],
        yearsOfExperience: 0,
        pricePerSession: 50,
        description: '',

        // Documentos - 6 imágenes
        professionalLicenseFront: '',
        professionalLicenseBack: '',
        idDocumentFront: '',
        idDocumentBack: '',
        specialtyDegree: '',
        universityDegree: '',
        profilePicture: '',

        // ✅ NUEVO: Términos de contenido
        acceptContentTerms: false,
        termsVersion: 'v1.0',

        // ✅ NUEVO: Redes sociales opcionales
        socialMediaLinks: []
    });

    const [errors, setErrors] = useState({});

    // ═══════════════════════════════════════════════════════════
    // Mutación para registro
    // ═══════════════════════════════════════════════════════════
    const registerMutation = useMutation({
        mutationFn: (data) => doctorService.register(data),
        onSuccess: () => {
            navigate('/login', {
                state: {
                    registrationSuccess: true,
                    message: '✅ Registro exitoso. Tu cuenta está pendiente de verificación por un administrador.',
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
        setFormData(prev => ({ ...prev, [docType]: imageBase64 }));
        setShowCamera(null);
    };

    // ═══════════════════════════════════════════════════════════
    // Validación por paso
    // ═══════════════════════════════════════════════════════════
    const validateStep = (step) => {
        const newErrors = {};

        // PASO 1: Datos personales
        if (step === 1) {
            if (!formData.firstName.trim()) newErrors.firstName = 'El nombre es obligatorio';
            if (!formData.lastName.trim()) newErrors.lastName = 'Los apellidos son obligatorios';
            if (!formData.email.trim()) newErrors.email = 'El email es obligatorio';
            if (!formData.password) newErrors.password = 'La contraseña es obligatoria';
            if (formData.password.length < 8) newErrors.password = 'Mínimo 8 caracteres';
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Las contraseñas no coinciden';
            }
        }

        // PASO 2: Datos profesionales
        if (step === 2) {
            if (!formData.professionalLicense.trim()) {
                newErrors.professionalLicense = 'El número de colegiado es obligatorio';
            }
            if (!formData.specialtyIds || formData.specialtyIds.length === 0) {
                newErrors.specialtyIds = 'Selecciona al menos una especialidad';
            }
            if (!formData.pricePerSession || formData.pricePerSession < 1) {
                newErrors.pricePerSession = 'El precio debe ser mayor a 0';
            }
        }

        // PASO 3: Documentos
        if (step === 3) {
            if (!formData.professionalLicenseFront) {
                newErrors.professionalLicenseFront = 'El carnet de colegiado (delante) es obligatorio';
            }
            if (!formData.professionalLicenseBack) {
                newErrors.professionalLicenseBack = 'El carnet de colegiado (atrás) es obligatorio';
            }
            if (!formData.idDocumentFront) {
                newErrors.idDocumentFront = 'El DNI (delante) es obligatorio';
            }
            if (!formData.idDocumentBack) {
                newErrors.idDocumentBack = 'El DNI (atrás) es obligatorio';
            }
            if (!formData.specialtyDegree) {
                newErrors.specialtyDegree = 'El título de especialidad es obligatorio';
            }
            if (!formData.universityDegree) {
                newErrors.universityDegree = 'El título universitario es obligatorio';
            }
        }

        // ✅ NUEVO: PASO 4 - Términos
        if (step === 4) {
            if (!formData.acceptContentTerms) {
                newErrors.acceptContentTerms = 'Debes aceptar los términos de contenido';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(currentStep + 1);
            window.scrollTo(0, 0);
        }
    };

    // ═══════════════════════════════════════════════════════════
    // Envío del formulario
    // ═══════════════════════════════════════════════════════════
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateStep(4)) return;

        try {
            // ✅ VERIFICAR que hay especialidades
            if (!formData.specialtyIds || formData.specialtyIds.length === 0) {
                setErrors({
                    submit: 'Debes seleccionar al menos una especialidad',
                    specialties: 'Debes seleccionar al menos una especialidad'
                });
                setCurrentStep(2); // Volver al paso 2
                return;
            }

            const dataToSend = {
                // Datos personales
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                phoneNumber: formData.phoneNumber || '',

                // Datos profesionales
                professionalLicense: formData.professionalLicense,
                yearsOfExperience: parseInt(formData.yearsOfExperience) || 0,
                pricePerSession: parseFloat(formData.pricePerSession),
                description: formData.description || '',

                // ✅ ESPECIALIDADES - USAR formData.specialtyIds
                specialtyIds: formData.specialtyIds,

                // Términos
                acceptContentTerms: formData.acceptContentTerms,
                termsVersion: formData.termsVersion,

                // Redes sociales
                socialMediaLinks: formData.socialMediaLinks || [],

                // Imágenes Base64
                professionalLicenseFront: formData.professionalLicenseFront,
                professionalLicenseBack: formData.professionalLicenseBack,
                idDocumentFront: formData.idDocumentFront,
                idDocumentBack: formData.idDocumentBack,
                specialtyDegree: formData.specialtyDegree,
                universityDegree: formData.universityDegree,
                profilePicture: formData.profilePicture || null
            };

            // ✅ DEBUG
            console.log('📤 Enviando:', {
                ...dataToSend,
                password: '***',
                specialtyIds: dataToSend.specialtyIds, // ← Debe mostrar [1, 2, ...]
                professionalLicenseFront: dataToSend.professionalLicenseFront ? '✅' : '❌',
            });

            await registerMutation.mutateAsync(dataToSend);

        } catch (error) {
            console.error('❌ Error:', error);
            console.error('❌ Detalles:', error.response?.data);
            setErrors({
                submit: translateError(
                    error.response?.data?.errors?.SpecialtyIds?.[0] ||
                    error.response?.data?.message,
                    t
                ) || t('doctorRegister.genericError')
            });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
            <DarkModeToggle />
            <div className="container max-w-4xl mx-auto px-4">
                {/* Cabecera */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm mb-4">
                        <Stethoscope className="w-6 h-6 text-primary-600" />
                        <span className="font-bold text-lg text-gray-900">{t('doctorRegister.headerTag')}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {t('doctorRegister.headerTitle')}
                    </h1>
                    <p className="text-gray-600">{t('doctorRegister.headerDesc')}</p>
                </div>

                {/* Indicador de pasos - ✅ ACTUALIZADO a 4 pasos */}
                <div className="flex items-center justify-center mb-8">
                    {[1, 2, 3, 4].map(step => (
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
                            {step < 4 && (
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
                                    {t('doctorRegister.step1')}
                                </h2>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('doctorRegister.firstName')}
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

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('doctorRegister.lastName')}
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

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Mail className="w-4 h-4 inline mr-1" />
                                        {t('doctorRegister.email')}
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

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Phone className="w-4 h-4 inline mr-1" />
                                        {t('doctorRegister.phone')}
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

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Lock className="w-4 h-4 inline mr-1" />
                                            {t('doctorRegister.password')}
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
                                            {t('doctorRegister.confirmPassword')}
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
                                    {t('doctorRegister.step2')}
                                </h2>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Shield className="w-4 h-4 inline mr-1" />
                                        {t('doctorRegister.license')}
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
                                </div>

                                <SpecialtySelector
                                    selectedSpecialties={formData.specialtyIds}
                                    onChange={(specialtyIds) => setFormData(prev => ({ ...prev, specialtyIds }))}
                                    error={errors.specialtyIds}
                                />

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('doctorRegister.experience')}
                                        </label>
                                        <input
                                            type="number"
                                            name="yearsOfExperience"
                                            value={formData.yearsOfExperience}
                                            onChange={handleChange}
                                            className="input-field"
                                            min="0"
                                            max="60"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <DollarSign className="w-4 h-4 inline mr-1" />
                                            {t('doctorRegister.price')}
                                        </label>
                                        <input
                                            type="number"
                                            name="pricePerSession"
                                            value={formData.pricePerSession}
                                            onChange={handleChange}
                                            className={`input-field ${errors.pricePerSession ? 'border-red-300' : ''}`}
                                            min="1"
                                            step="0.01"
                                        />
                                        {errors.pricePerSession && (
                                            <p className="text-red-600 text-sm mt-1">{errors.pricePerSession}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('doctorRegister.description')}
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={4}
                                        className="input-field"
                                        placeholder={t('doctorRegister.descriptionPlaceholder')}
                                    />
                                </div>
                            </div>
                        )}

                        {/* PASO 3: Documentos */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <FileCheck className="w-5 h-5 text-primary-600" />
                                    {t('doctorRegister.docsTitle')}
                                </h2>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <DocumentUpload
                                        title={t('doctorRegister.licenseFront')}
                                        required
                                        image={formData.professionalLicenseFront}
                                        onCapture={() => setShowCamera('professionalLicenseFront')}
                                        onRemove={() => setFormData(prev => ({ ...prev, professionalLicenseFront: '' }))}
                                        error={errors.professionalLicenseFront}
                                    />

                                    <DocumentUpload
                                        title={t('doctorRegister.licenseBack')}
                                        required
                                        image={formData.professionalLicenseBack}
                                        onCapture={() => setShowCamera('professionalLicenseBack')}
                                        onRemove={() => setFormData(prev => ({ ...prev, professionalLicenseBack: '' }))}
                                        error={errors.professionalLicenseBack}
                                    />

                                    <DocumentUpload
                                        title={t('doctorRegister.idFront')}
                                        required
                                        image={formData.idDocumentFront}
                                        onCapture={() => setShowCamera('idDocumentFront')}
                                        onRemove={() => setFormData(prev => ({ ...prev, idDocumentFront: '' }))}
                                        error={errors.idDocumentFront}
                                    />

                                    <DocumentUpload
                                        title={t('doctorRegister.idBack')}
                                        required
                                        image={formData.idDocumentBack}
                                        onCapture={() => setShowCamera('idDocumentBack')}
                                        onRemove={() => setFormData(prev => ({ ...prev, idDocumentBack: '' }))}
                                        error={errors.idDocumentBack}
                                    />

                                    <DocumentUpload
                                        title={t('doctorRegister.specialtyDegree')}
                                        required
                                        allowPdf
                                        image={formData.specialtyDegree}
                                        onCapture={() => setShowCamera('specialtyDegree')}
                                        onUpload={(data) => setFormData(prev => ({ ...prev, specialtyDegree: data }))}
                                        onRemove={() => setFormData(prev => ({ ...prev, specialtyDegree: '' }))}
                                        error={errors.specialtyDegree}
                                    />

                                    <DocumentUpload
                                        title={t('doctorRegister.universityDegree')}
                                        required
                                        allowPdf
                                        image={formData.universityDegree}
                                        onCapture={() => setShowCamera('universityDegree')}
                                        onUpload={(data) => setFormData(prev => ({ ...prev, universityDegree: data }))}
                                        onRemove={() => setFormData(prev => ({ ...prev, universityDegree: '' }))}
                                        error={errors.universityDegree}
                                    />

                                    <DocumentUpload
                                        title={t('doctorRegister.profilePicture')}
                                        required={false}
                                        image={formData.profilePicture}
                                        onCapture={() => setShowCamera('profilePicture')}
                                        onRemove={() => setFormData(prev => ({ ...prev, profilePicture: '' }))}
                                    />
                                </div>
                            </div>
                        )}

                        {/* ✅ NUEVO: PASO 4 - Términos de Contenido */}
                        {currentStep === 4 && (
                            <TermsContentStep
                                formData={formData}
                                setFormData={setFormData}
                                errors={errors}
                            />
                        )}

                        {/* Error de envío */}
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    <p className="text-red-800 font-semibold">{errors.submit}</p>
                                </div>
                            </div>
                        )}

                        {/* Botones de navegación - ✅ ACTUALIZADO */}
                        <div className="flex gap-4 mt-8">
                            {currentStep > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(currentStep - 1)}
                                    className="flex-1 btn-secondary"
                                >
                                    {t('doctorRegister.previous')}
                                </button>
                            )}

                            {currentStep < 4 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="flex-1 btn-primary"
                                >
                                    {t('doctorRegister.next')}
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={registerMutation.isPending || !formData.acceptContentTerms}
                                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {registerMutation.isPending ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin inline mr-2" />
                                            {t('doctorRegister.submitting')}
                                        </>
                                    ) : (
                                        t('doctorRegister.submit')
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Link a login */}
                        <div className="text-center mt-6">
                            <p className="text-gray-600">
                                {t('doctorRegister.alreadyAccount')}{' '}
                                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                                    {t('doctorRegister.loginHere')}
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            {/* Modal de cámara */}
            {showCamera && (
                <CameraCapture
                    onCapture={(image) => handleCameraCapture(image, showCamera)}
                    onClose={() => setShowCamera(null)}
                />
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTE: Upload de documentos
// ═══════════════════════════════════════════════════════════════

const DocumentUpload = ({ title, required, image, onCapture, onUpload, onRemove, error, allowPdf = false }) => {
    const fileInputRef = useRef(null);
    const { t } = useLanguage();
    const isPdf = image && image.startsWith('data:application/pdf');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => onUpload && onUpload(ev.target.result);
        reader.readAsDataURL(file);
        // Reset input so el mismo archivo se puede volver a seleccionar
        e.target.value = '';
    };

    if (image) {
        return (
            <div className="relative">
                <p className="text-sm font-medium text-gray-700 mb-2">
                    {title} {required && <span className="text-red-500">*</span>}
                </p>
                <div className="relative border-2 border-green-300 rounded-lg overflow-hidden">
                    {isPdf ? (
                        <div className="w-full h-48 bg-red-50 flex flex-col items-center justify-center gap-2">
                            <FileText className="w-12 h-12 text-red-400" />
                            <span className="text-sm font-semibold text-red-700">PDF</span>
                            <span className="text-xs text-gray-500">✓</span>
                        </div>
                    ) : (
                        <img src={image} alt={title} className="w-full h-48 object-cover" />
                    )}
                    <button
                        type="button"
                        onClick={onRemove}
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                    >
                        ✕
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-green-600 text-white text-xs py-1 px-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {isPdf ? t('doctorRegister.pdfUploaded') : t('doctorRegister.captured')}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
                {title} {required && <span className="text-red-500">*</span>}
            </p>
            <div className={`border-2 border-dashed rounded-lg overflow-hidden ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}>
                <button
                    type="button"
                    onClick={onCapture}
                    className="w-full p-5 flex flex-col items-center gap-2 hover:bg-primary-50 transition-colors"
                >
                    <Camera className={`w-8 h-8 ${error ? 'text-red-400' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${error ? 'text-red-600' : 'text-gray-600'}`}>
                        {t('doctorRegister.capture')}
                    </span>
                </button>
                {allowPdf && (
                    <>
                        <div className="border-t border-dashed border-gray-300 flex items-center justify-center py-1">
                            <span className="text-xs text-gray-400">o</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full p-4 flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors"
                        >
                            <Upload className={`w-7 h-7 ${error ? 'text-red-400' : 'text-gray-400'}`} />
                            <span className={`text-xs font-medium ${error ? 'text-red-600' : 'text-gray-600'}`}>
                                {t('doctorRegister.uploadFile')}
                            </span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </>
                )}
            </div>
            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// ✅ NUEVO: COMPONENTE - Paso de Términos de Contenido
// ═══════════════════════════════════════════════════════════════

const TermsContentStep = ({ formData, setFormData, errors }) => {
    const [hasRead, setHasRead] = useState(false);

    const handleScroll = (e) => {
        const element = e.target;
        const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
        if (isAtBottom) {
            setHasRead(true);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                Términos de Publicación de Contenido
            </h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-900 font-semibold mb-2 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Importante
                </p>
                <p className="text-blue-800 text-sm leading-relaxed">
                    Como profesional de la salud, eres el <strong>único responsable del contenido</strong> que
                    publiques en NexusSalud. Lee atentamente estos términos.
                </p>
            </div>

            {/* Términos scrolleables */}
            <div
                className="bg-white border-2 border-gray-300 rounded-lg p-6 max-h-96 overflow-y-auto"
                onScroll={handleScroll}
            >
                <div className="space-y-4 text-sm text-gray-700">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Scale className="w-5 h-5" />
                        Al aceptar estos términos, confirmas que:
                    </h3>

                    <div className="space-y-3">
                        <TermPoint number="1" title="Responsabilidad del contenido">
                            Eres el único responsable de todo el contenido que publiques, incluyendo su
                            exactitud, veracidad y cumplimiento de las normativas sanitarias vigentes.
                            NexusSalud no revisa ni aprueba el contenido antes de su publicación.
                        </TermPoint>

                        <TermPoint number="2" title="Cumplimiento legal">
                            Todo tu contenido cumple con la Ley 14/1986 General de Sanidad, el Código Deontológico
                            de tu profesión médica, el RGPD y demás normativas aplicables.
                        </TermPoint>

                        <TermPoint number="3" title="Contenido apropiado y ético">
                            No publicarás contenido que promueva tratamientos no respaldados por evidencia científica,
                            información falsa, engañosa o que viole derechos de terceros.
                        </TermPoint>

                        <TermPoint number="4" title="Derechos de autor">
                            Todo el contenido que publiques es de tu propiedad o tienes los derechos necesarios.
                            Otorgas a NexusSalud una licencia no exclusiva para mostrarlo en la plataforma.
                        </TermPoint>

                        <TermPoint number="5" title="Contenido actualizado">
                            Te comprometes a mantener tu contenido actualizado conforme a los últimos
                            avances científicos y a corregir información obsoleta.
                        </TermPoint>

                        <TermPoint number="6" title="Identificación profesional">
                            Todo tu contenido debe identificarte claramente como profesional sanitario
                            colegiado, con tu nombre, especialidad y número de colegiado.
                        </TermPoint>

                        <TermPoint number="7" title="Moderación y cumplimiento">
                            NexusSalud se reserva el derecho de eliminar contenido que incumpla estos términos,
                            suspender cuentas temporalmente o cancelarlas en caso de infracciones graves.
                        </TermPoint>

                        <TermPoint number="8" title="Indemnización y responsabilidad">
                            Te comprometes a indemnizar y eximir de responsabilidad a NexusSalud ante
                            cualquier reclamación derivada de tu contenido publicado.
                        </TermPoint>

                        <TermPoint number="9" title="Modificación de términos">
                            NexusSalud puede modificar estos términos. Los cambios sustanciales se notificarán
                            por email y deberás aceptar la nueva versión para continuar publicando.
                        </TermPoint>

                        <TermPoint number="10" title="Resolución de conflictos">
                            Las controversias se resolverán mediante los tribunales competentes según
                            la legislación española vigente.
                        </TermPoint>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                        <p className="text-red-900 font-semibold text-sm mb-1 flex items-center gap-2">
                            <Alert className="w-4 h-4" />
                            Advertencia Legal
                        </p>
                        <p className="text-red-800 text-xs leading-relaxed mb-2">
                            El incumplimiento puede resultar en:
                        </p>
                        <ul className="text-red-800 text-xs list-disc ml-4 space-y-1">
                            <li>Suspensión inmediata de tu cuenta</li>
                            <li>Eliminación permanente de tu perfil</li>
                            <li>Notificación a tu colegio profesional</li>
                            <li>Responsabilidades legales según corresponda</li>
                        </ul>
                    </div>

                    <div className="text-center pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                            Versión v1.0 - Última actualización: Abril 2026
                        </p>
                    </div>
                </div>

                {!hasRead && (
                    <div className="sticky bottom-0 bg-gradient-to-t from-white to-transparent pt-6 text-center">
                        <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full inline-flex items-center gap-2 text-xs font-semibold">
                            Desplázate para leer todos los términos
                        </div>
                    </div>
                )}
            </div>

            {/* Checkbox de aceptación */}
            <label className={`
                flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all
                ${formData.acceptContentTerms
                    ? 'border-green-500 bg-green-50'
                    : hasRead
                        ? 'border-blue-500 bg-blue-50 hover:bg-blue-100'
                        : 'border-gray-300 bg-gray-50 cursor-not-allowed'
                }
            `}>
                <input
                    type="checkbox"
                    checked={formData.acceptContentTerms}
                    onChange={(e) => setFormData({
                        ...formData,
                        acceptContentTerms: e.target.checked
                    })}
                    disabled={!hasRead}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                    <strong className="text-gray-900">
                        He leído completamente y acepto los términos de publicación de contenido.
                    </strong>
                    {' '}Entiendo que soy el único responsable del contenido que publique.
                </span>
            </label>

            {errors.acceptContentTerms && (
                <p className="text-red-600 text-sm">{errors.acceptContentTerms}</p>
            )}

            {!formData.acceptContentTerms && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-yellow-800 text-sm">
                        {hasRead
                            ? '⚠️ Debes aceptar los términos para completar el registro'
                            : '⚠️ Lee todos los términos hasta el final para poder aceptarlos'
                        }
                    </p>
                </div>
            )}

            {formData.acceptContentTerms && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-800 text-sm font-semibold">
                        Términos aceptados correctamente
                    </p>
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// ✅ NUEVO: COMPONENTE AUXILIAR - Punto de términos
// ═══════════════════════════════════════════════════════════════

const TermPoint = ({ number, title, children }) => (
    <div className="flex gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold text-xs">{number}</span>
        </div>
        <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-sm mb-1">{title}</h4>
            <p className="text-gray-700 text-xs leading-relaxed">{children}</p>
        </div>
    </div>
);

export default DoctorRegisterPage;