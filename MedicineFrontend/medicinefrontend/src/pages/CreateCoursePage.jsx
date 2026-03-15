// ═══════════════════════════════════════════════════════════════
// CreateCoursePage.jsx - Crear y Publicar Cursos
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, Plus, Trash2, BookOpen, Upload,
    Image, Video, FileText, DollarSign, Clock, Award,
    ChevronUp, ChevronDown, Eye
} from 'lucide-react';

const LEVELS = ['Principiante', 'Intermedio', 'Avanzado'];
const CATEGORIES = [
    'Nutrición', 'Fitness', 'Salud Mental', 'Cardiología',
    'Dermatología', 'Pediatría', 'Medicina General', 'Otro'
];

const CreateCoursePage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    const [courseData, setCourseData] = useState({
        title: '',
        description: '',
        price: '',
        level: 'Principiante',
        category: 'Nutrición',
        durationHours: '',
        language: 'Español',
        prerequisites: '',
        learningObjectives: '',
        coverImage: null,
    });

    const [modules, setModules] = useState([
        {
            id: 1,
            title: '',
            content: '',
            videoUrl: '',
            videoDurationMinutes: '',
            orderIndex: 0,
            isFree: false,
        }
    ]);

    const [errors, setErrors] = useState({});
    const [coverImagePreview, setCoverImagePreview] = useState(null);

    const handleCourseChange = (e) => {
        const { name, value } = e.target;
        setCourseData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleCoverImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCourseData(prev => ({ ...prev, coverImage: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const addModule = () => {
        const newModule = {
            id: Date.now(),
            title: '',
            content: '',
            videoUrl: '',
            videoDurationMinutes: '',
            orderIndex: modules.length,
            isFree: false,
        };
        setModules([...modules, newModule]);
    };

    const removeModule = (id) => {
        if (modules.length === 1) {
            alert('Debe haber al menos un módulo');
            return;
        }
        setModules(modules.filter(m => m.id !== id));
    };

    const updateModule = (id, field, value) => {
        setModules(modules.map(m =>
            m.id === id ? { ...m, [field]: value } : m
        ));
    };

    const moveModule = (id, direction) => {
        const index = modules.findIndex(m => m.id === id);
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === modules.length - 1)
        ) {
            return;
        }

        const newModules = [...modules];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newModules[index], newModules[targetIndex]] = [newModules[targetIndex], newModules[index]];

        setModules(newModules.map((m, idx) => ({ ...m, orderIndex: idx })));
    };

    const validateStep1 = () => {
        const newErrors = {};

        if (!courseData.title) newErrors.title = 'El título es obligatorio';
        if (!courseData.description || courseData.description.length < 50) {
            newErrors.description = 'La descripción debe tener al menos 50 caracteres';
        }
        if (!courseData.price || courseData.price <= 0) {
            newErrors.price = 'El precio debe ser mayor que 0';
        }
        if (!courseData.durationHours || courseData.durationHours <= 0) {
            newErrors.durationHours = 'La duración debe ser mayor que 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const hasEmptyModule = modules.some(m => !m.title || !m.content);
        if (hasEmptyModule) {
            alert('Todos los módulos deben tener título y contenido');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (currentStep === 1 && !validateStep1()) return;
        if (currentStep === 2 && !validateStep2()) return;

        setCurrentStep(prev => Math.min(prev + 1, 3));
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handlePublish = async () => {
        setLoading(true);

        try {
            // TODO: Upload cover image first
            // TODO: Submit course data + modules to API
            console.log('Publishing course:', { courseData, modules });

            setTimeout(() => {
                setLoading(false);
                navigate('/doctor/courses');
            }, 2000);
        } catch (error) {
            console.error('Error al publicar curso:', error);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate('/doctor')}
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Volver</span>
                        </button>

                        {/* Steps */}
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${currentStep >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200'
                                    }`}>1</div>
                                <span className="hidden md:block font-medium">Información</span>
                            </div>
                            <div className="w-8 h-0.5 bg-slate-200" />
                            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${currentStep >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200'
                                    }`}>2</div>
                                <span className="hidden md:block font-medium">Módulos</span>
                            </div>
                            <div className="w-8 h-0.5 bg-slate-200" />
                            <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${currentStep >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200'
                                    }`}>3</div>
                                <span className="hidden md:block font-medium">Revisar</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Crear nuevo curso</h1>
                    <p className="text-slate-600">
                        Comparte tu conocimiento y monetiza tu experiencia profesional
                    </p>
                </div>

                {/* Step 1: Course Information */}
                {currentStep === 1 && (
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2 mb-6">
                                <BookOpen className="w-5 h-5 text-emerald-600" />
                                <h2 className="text-xl font-bold text-slate-900">Información básica</h2>
                            </div>

                            <div className="space-y-6">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Título del curso *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={courseData.title}
                                        onChange={handleCourseChange}
                                        placeholder="Ej: Nutrición Deportiva Avanzada"
                                        maxLength={200}
                                        className={`w-full px-4 py-3 rounded-lg border ${errors.title ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                            } focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                                    />
                                    {errors.title && (
                                        <p className="text-red-600 text-sm mt-1">{errors.title}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Descripción *
                                    </label>
                                    <textarea
                                        name="description"
                                        value={courseData.description}
                                        onChange={handleCourseChange}
                                        rows={5}
                                        placeholder="Describe de qué trata el curso, qué aprenderán los estudiantes..."
                                        maxLength={2000}
                                        className={`w-full px-4 py-3 rounded-lg border ${errors.description ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                            } focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none`}
                                    />
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-sm text-slate-500">
                                            {courseData.description.length} / 2000 caracteres
                                        </p>
                                        {errors.description && (
                                            <p className="text-red-600 text-sm">{errors.description}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Cover Image */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                                        Imagen de portada
                                    </label>
                                    <div className="flex items-center gap-6">
                                        {coverImagePreview ? (
                                            <img
                                                src={coverImagePreview}
                                                alt="Preview"
                                                className="w-48 h-32 rounded-xl object-cover border-2 border-emerald-100"
                                            />
                                        ) : (
                                            <div className="w-48 h-32 rounded-xl bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                                                <Image className="w-12 h-12 text-slate-400" />
                                            </div>
                                        )}
                                        <label className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors cursor-pointer flex items-center gap-2">
                                            <Upload className="w-5 h-5" />
                                            Subir imagen
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleCoverImageChange}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Level */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Nivel *
                                        </label>
                                        <select
                                            name="level"
                                            value={courseData.level}
                                            onChange={handleCourseChange}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        >
                                            {LEVELS.map(level => (
                                                <option key={level} value={level}>{level}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Categoría *
                                        </label>
                                        <select
                                            name="category"
                                            value={courseData.category}
                                            onChange={handleCourseChange}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Duration */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            <Clock className="w-4 h-4 inline mr-1" />
                                            Duración (horas) *
                                        </label>
                                        <input
                                            type="number"
                                            name="durationHours"
                                            value={courseData.durationHours}
                                            onChange={handleCourseChange}
                                            min="1"
                                            placeholder="Ej: 10"
                                            className={`w-full px-4 py-3 rounded-lg border ${errors.durationHours ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                                } focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                                        />
                                        {errors.durationHours && (
                                            <p className="text-red-600 text-sm mt-1">{errors.durationHours}</p>
                                        )}
                                    </div>

                                    {/* Price */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            <DollarSign className="w-4 h-4 inline mr-1" />
                                            Precio (€) *
                                        </label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={courseData.price}
                                            onChange={handleCourseChange}
                                            min="0"
                                            step="0.01"
                                            placeholder="Ej: 99.00"
                                            className={`w-full px-4 py-3 rounded-lg border ${errors.price ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                                } focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                                        />
                                        {errors.price && (
                                            <p className="text-red-600 text-sm mt-1">{errors.price}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Prerequisites */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Requisitos previos
                                    </label>
                                    <textarea
                                        name="prerequisites"
                                        value={courseData.prerequisites}
                                        onChange={handleCourseChange}
                                        rows={3}
                                        placeholder="Conocimientos o habilidades necesarios para tomar este curso..."
                                        maxLength={1000}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                                    />
                                </div>

                                {/* Learning Objectives */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Objetivos de aprendizaje
                                    </label>
                                    <textarea
                                        name="learningObjectives"
                                        value={courseData.learningObjectives}
                                        onChange={handleCourseChange}
                                        rows={3}
                                        placeholder="¿Qué aprenderán los estudiantes al completar este curso?"
                                        maxLength={2000}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Modules */}
                {currentStep === 2 && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Video className="w-5 h-5 text-emerald-600" />
                                    <h2 className="text-xl font-bold text-slate-900">Módulos del curso</h2>
                                </div>
                                <button
                                    onClick={addModule}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Añadir módulo
                                </button>
                            </div>

                            <div className="space-y-4">
                                {modules.map((module, index) => (
                                    <div
                                        key={module.id}
                                        className="p-6 rounded-xl border-2 border-slate-200 hover:border-emerald-200 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <h3 className="font-bold text-slate-900">Módulo {index + 1}</h3>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => moveModule(module.id, 'up')}
                                                    disabled={index === 0}
                                                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                                >
                                                    <ChevronUp className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => moveModule(module.id, 'down')}
                                                    disabled={index === modules.length - 1}
                                                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                                >
                                                    <ChevronDown className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => removeModule(module.id)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    Título del módulo *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={module.title}
                                                    onChange={(e) => updateModule(module.id, 'title', e.target.value)}
                                                    placeholder="Ej: Introducción a la nutrición deportiva"
                                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    Contenido *
                                                </label>
                                                <textarea
                                                    value={module.content}
                                                    onChange={(e) => updateModule(module.id, 'content', e.target.value)}
                                                    rows={4}
                                                    placeholder="Contenido del módulo, explicaciones, recursos..."
                                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                        URL del vídeo
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={module.videoUrl}
                                                        onChange={(e) => updateModule(module.id, 'videoUrl', e.target.value)}
                                                        placeholder="https://youtube.com/watch?v=..."
                                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                        Duración (minutos)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={module.videoDurationMinutes}
                                                        onChange={(e) => updateModule(module.id, 'videoDurationMinutes', e.target.value)}
                                                        min="0"
                                                        placeholder="Ej: 15"
                                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id={`free-${module.id}`}
                                                    checked={module.isFree}
                                                    onChange={(e) => updateModule(module.id, 'isFree', e.target.checked)}
                                                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                                />
                                                <label htmlFor={`free-${module.id}`} className="text-sm font-semibold text-slate-700">
                                                    Módulo gratuito (preview)
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Review */}
                {currentStep === 3 && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2 mb-6">
                                <Eye className="w-5 h-5 text-emerald-600" />
                                <h2 className="text-xl font-bold text-slate-900">Revisar y publicar</h2>
                            </div>

                            <div className="space-y-6">
                                {/* Course Summary */}
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-3">Información del curso</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-slate-600">Título:</span>
                                            <p className="font-semibold">{courseData.title || 'Sin título'}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-600">Precio:</span>
                                            <p className="font-semibold">€{courseData.price || '0.00'}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-600">Nivel:</span>
                                            <p className="font-semibold">{courseData.level}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-600">Categoría:</span>
                                            <p className="font-semibold">{courseData.category}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-600">Duración:</span>
                                            <p className="font-semibold">{courseData.durationHours || '0'} horas</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-600">Módulos:</span>
                                            <p className="font-semibold">{modules.length}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-6">
                                    <h3 className="font-bold text-slate-900 mb-3">Módulos</h3>
                                    <div className="space-y-2">
                                        {modules.map((module, index) => (
                                            <div key={module.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                <span className="font-medium">
                                                    {index + 1}. {module.title || 'Sin título'}
                                                </span>
                                                {module.isFree && (
                                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">
                                                        Gratis
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                                    <h3 className="font-bold text-amber-900 mb-2">⚠️ Antes de publicar</h3>
                                    <ul className="space-y-1 text-sm text-amber-800">
                                        <li>• El curso será revisado por nuestro equipo antes de publicarse</li>
                                        <li>• Recibirás una notificación cuando sea aprobado</li>
                                        <li>• Puedes editar el curso después de publicarlo</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-8">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className="px-6 py-3 rounded-lg font-semibold text-slate-600 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Atrás
                    </button>

                    {currentStep < 3 ? (
                        <button
                            onClick={handleNext}
                            className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg"
                        >
                            Siguiente
                        </button>
                    ) : (
                        <button
                            onClick={handlePublish}
                            disabled={loading}
                            className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Publicando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Publicar curso
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateCoursePage;