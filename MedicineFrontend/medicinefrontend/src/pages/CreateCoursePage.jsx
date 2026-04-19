// ═══════════════════════════════════════════════════════════════
// CreateCoursePage.jsx - Crear Curso Formativo (sin módulos)
// Flujo: Información del curso → Revisión y publicación
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, Upload, X, Clock } from 'lucide-react';
import doctorDashboardService from '../services/doctordashboardService';
import specialtyService from '../services/specialtyService';

const LEVELS = ['Principiante', 'Intermedio', 'Avanzado'];
const PLACEHOLDER_CATEGORIES = [
    'Medicina General',
    'Cardiología',
    'Dermatología',
    'Endocrinología',
    'Gastroenterología',
    'Ginecología y Obstetricia',
    'Neurología',
    'Oftalmología',
    'Oncología',
    'Ortopedia y Traumatología',
    'Pediatría',
    'Psiquiatría',
    'Reumatología',
    'Urología',
    'Neumología',
    'Nefrología',
    'Hematología',
    'Infectología',
    'Cirugía General',
    'Anestesiología',
    'Medicina Interna',
    'Medicina de Urgencias',
    'Medicina Deportiva',
    'Nutrición y Dietética',
    'Ejercicio Físico y Rehabilitación',
    'Fisioterapia',
    'Psicología Clínica',
    'Salud Mental',
    'Salud Sexual y Reproductiva',
    'Geriatría',
    'Medicina Estética',
    'Odontología',
    'Farmacología',
    'Primeros Auxilios y Emergencias',
    'Investigación Clínica',
    'Habilidades Médicas y Comunicación',
    'Otro',
];

// Opciones de duración predefinidas (en minutos)
const DURATION_OPTIONS = [
    { label: '15 min',   value: 15 },
    { label: '30 min',   value: 30 },
    { label: '45 min',   value: 45 },
    { label: '1 h',      value: 60 },
    { label: '1 h 30',   value: 90 },
    { label: '2 h',      value: 120 },
    { label: '3 h',      value: 180 },
    { label: '4 h',      value: 240 },
    { label: '6 h',      value: 360 },
    { label: '8 h',      value: 480 },
    { label: 'Otro',     value: 'custom' },
];

/** Convierte minutos a texto legible: "1 h 30 min", "45 min", etc. */
const formatMinutes = (mins) => {
    if (!mins) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
};

// Tipos de contenido disponibles
const CONTENT_TYPES = [
    { id: 'video_url',  label: 'Vídeo externo',    icon: '🎬', desc: 'YouTube, Vimeo u otra URL' },
    { id: 'video_file', label: 'Subir vídeo',       icon: '📹', desc: 'MP4, MOV, AVI, WebM (máx 500 MB)' },
    { id: 'document',   label: 'Documento',          icon: '📄', desc: 'PDF, Word, PowerPoint (máx 500 MB)' },
    { id: 'article',    label: 'Artículo escrito',   icon: '📝', desc: 'Texto o guía formativa' },
];

const CreateCoursePage = () => {
    const navigate = useNavigate();
    const [loading, setLoading]           = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [step, setStep]                 = useState(1); // 1=info, 2=contenido, 3=revisión
    const [errors, setErrors]             = useState({});
    const [coverImage, setCoverImage]     = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [durationMode, setDurationMode] = useState('preset');
    const [specialties, setSpecialties]   = useState([]);

    // Contenido
    const [contentType, setContentType]   = useState(''); // '' = sin selección
    const [videoUrl, setVideoUrl]         = useState('');
    const [contentFile, setContentFile]   = useState(null);
    const [articleText, setArticleText]   = useState('');

    // Cargar especialidades activas del backend
    useEffect(() => {
        specialtyService.getActive()
            .then(data => setSpecialties(data))
            .catch(() => setSpecialties([]));
    }, []);

    const categories = specialties.length > 0
        ? [...specialties.map(s => s.name), 'Otro']
        : PLACEHOLDER_CATEGORIES;

    const [courseData, setCourseData] = useState({
        title:              '',
        description:        '',
        price:              '',
        level:              'Principiante',
        category:           '',
        durationMinutes:    '',
        language:           'Español',
        prerequisites:      '',
        learningObjectives: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCourseData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleDurationPreset = (value) => {
        if (value === 'custom') {
            setDurationMode('custom');
            setCourseData(prev => ({ ...prev, durationMinutes: '' }));
        } else {
            setDurationMode('preset');
            setCourseData(prev => ({ ...prev, durationMinutes: String(value) }));
            if (errors.durationMinutes) setErrors(prev => ({ ...prev, durationMinutes: '' }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert('Imagen demasiado grande (máx 5 MB)'); return; }
        setCoverImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setCoverPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleContentFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 500 * 1024 * 1024) { alert('Archivo demasiado grande (máx 500 MB)'); return; }
        setContentFile(file);
    };

    const validate = () => {
        const e = {};
        if (!courseData.title.trim())        e.title       = 'El título es obligatorio';
        if (!courseData.description.trim())  e.description = 'La descripción es obligatoria';
        if (!courseData.price || parseFloat(courseData.price) < 0.01)
                                             e.price       = 'Introduce un precio válido (mínimo 0,01 €)';
        if (!courseData.category)            e.category    = 'Selecciona una categoría';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handlePublish = async () => {
        setLoading(true);
        setUploadProgress(0);
        try {
            const durationVal = courseData.durationMinutes ? parseInt(courseData.durationMinutes) : null;

            // 1. Crear curso
            const course = await doctorDashboardService.createCourse({
                title:              courseData.title.trim(),
                description:        courseData.description.trim(),
                price:              parseFloat(courseData.price),
                level:              courseData.level,
                category:           courseData.category,
                durationMinutes:    durationVal && durationVal > 0 ? durationVal : null,
                language:           courseData.language,
                prerequisites:      courseData.prerequisites.trim() || null,
                learningObjectives: courseData.learningObjectives.trim() || null,
            });

            // 2. Portada
            if (coverImage) {
                await doctorDashboardService.uploadCourseCover(course.id, coverImage);
            }

            // 3. Contenido
            if (contentType === 'video_url' && videoUrl.trim()) {
                await doctorDashboardService.setCourseVideoUrl(course.id, videoUrl.trim());
            } else if (contentType === 'article' && articleText.trim()) {
                await doctorDashboardService.setCourseArticle(course.id, articleText.trim());
            } else if ((contentType === 'video_file' || contentType === 'document') && contentFile) {
                await doctorDashboardService.uploadCourseContentFile(course.id, contentFile, setUploadProgress);
            }

            // 4. Publicar
            await doctorDashboardService.publishCourse(course.id);

            navigate('/doctor/dashboard', { state: { courseCreated: true } });
        } catch (error) {
            console.error('Error al crear curso:', error);
            const msg = error?.response?.data?.errors
                ? Object.values(error.response.data.errors).flat().join('\n')
                : error?.response?.data?.message || 'Error al crear el curso. Inténtalo de nuevo.';
            alert('❌ ' + msg);
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => step === 1 ? navigate('/doctor/dashboard') : setStep(s => s - 1)}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">{step === 1 ? 'Volver' : 'Atrás'}</span>
                    </button>
                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map(s => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                                    step >= s ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                                }`}>{s}</div>
                                {s < 3 && <div className={`w-6 h-0.5 ${step > s ? 'bg-emerald-600' : 'bg-slate-200'}`} />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">
                        {step === 1 ? 'Información del curso' : step === 2 ? 'Contenido del curso' : 'Revisión y publicación'}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {step === 1 ? 'Define los detalles de tu curso' : step === 2 ? 'Añade el material formativo' : 'Revisa todo antes de publicar'}
                    </p>
                </div>

                {/* ──── PASO 1: Información ──── */}
                {step === 1 && (
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 space-y-6">
                        {/* Título */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Título del curso *</label>
                            <input
                                name="title"
                                value={courseData.title}
                                onChange={handleChange}
                                placeholder="Ej: Introducción a la nutrición deportiva"
                                className={`w-full px-4 py-3 rounded-xl border ${errors.title ? 'border-red-400' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                            />
                            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                        </div>

                        {/* Descripción */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Descripción *</label>
                            <textarea
                                name="description"
                                value={courseData.description}
                                onChange={handleChange}
                                rows={5}
                                placeholder="Describe qué aprenderán los estudiantes, a quién va dirigido y qué incluye el curso..."
                                className={`w-full px-4 py-3 rounded-xl border ${errors.description ? 'border-red-400' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none`}
                            />
                            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                        </div>

                        {/* Precio */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Precio (€) *</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={courseData.price}
                                    onChange={handleChange}
                                    min="0.01"
                                    step="1"
                                    placeholder="29"
                                    className={`w-full px-4 py-3 rounded-xl border ${errors.price ? 'border-red-400' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                                />
                                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                            </div>

                            {/* Nivel */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Nivel</label>
                                <select
                                    name="level"
                                    value={courseData.level}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Categoría — cargada desde especialidades del sistema */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Categoría</label>
                            <select
                                name="category"
                                value={courseData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">Selecciona una categoría</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                        </div>

                        {/* Duración */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-slate-500" />
                                    Duración estimada (opcional)
                                </span>
                            </label>

                            {/* Opciones predefinidas */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {DURATION_OPTIONS.map(opt => {
                                    const isSelected = opt.value === 'custom'
                                        ? durationMode === 'custom'
                                        : durationMode === 'preset' && courseData.durationMinutes === String(opt.value);
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleDurationPreset(opt.value)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                                isSelected
                                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-600'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Input libre cuando selecciona "Otro" */}
                            {durationMode === 'custom' && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        name="durationMinutes"
                                        value={courseData.durationMinutes}
                                        onChange={handleChange}
                                        min="1"
                                        step="1"
                                        placeholder="Minutos totales (ej: 150)"
                                        className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                    />
                                    {courseData.durationMinutes && parseInt(courseData.durationMinutes) > 0 && (
                                        <span className="text-sm text-slate-500 whitespace-nowrap">
                                            = {formatMinutes(parseInt(courseData.durationMinutes))}
                                        </span>
                                    )}
                                </div>
                            )}
                            {errors.durationMinutes && <p className="text-red-500 text-sm mt-1">{errors.durationMinutes}</p>}
                        </div>

                        {/* Objetivos de aprendizaje */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">¿Qué aprenderán? (opcional)</label>
                            <textarea
                                name="learningObjectives"
                                value={courseData.learningObjectives}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Ej: Conocer los principios básicos de la nutrición, aprender a crear un plan alimenticio..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                            />
                        </div>

                        {/* Requisitos previos */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Requisitos previos (opcional)</label>
                            <input
                                name="prerequisites"
                                value={courseData.prerequisites}
                                onChange={handleChange}
                                placeholder="Ej: No se requieren conocimientos previos"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        {/* Imagen de portada */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Imagen de portada (opcional)</label>
                            {coverPreview ? (
                                <div className="relative">
                                    <img src={coverPreview} alt="Portada" className="w-full h-48 object-cover rounded-xl" />
                                    <button
                                        onClick={() => { setCoverImage(null); setCoverPreview(null); }}
                                        className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50"
                                    >
                                        <X className="w-4 h-4 text-red-500" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                    <span className="text-sm text-slate-500">Haz clic para subir (JPG, PNG · máx 5MB)</span>
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>
                            )}
                        </div>
                    </div>
                )}

                {/* ──── PASO 2: Contenido ──── */}
                {step === 2 && (
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 space-y-6">
                        <p className="text-slate-500 text-sm">Elige cómo quieres entregar el contenido del curso. Puedes omitir este paso y añadirlo más tarde.</p>

                        {/* Selector de tipo */}
                        <div className="grid grid-cols-2 gap-3">
                            {CONTENT_TYPES.map(ct => (
                                <button
                                    key={ct.id}
                                    type="button"
                                    onClick={() => { setContentType(ct.id); setVideoUrl(''); setContentFile(null); setArticleText(''); }}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                                        contentType === ct.id
                                            ? 'border-emerald-500 bg-emerald-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="text-2xl mb-1">{ct.icon}</div>
                                    <p className="font-semibold text-slate-800 text-sm">{ct.label}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{ct.desc}</p>
                                </button>
                            ))}
                        </div>

                        {/* Vídeo externo */}
                        {contentType === 'video_url' && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">URL del vídeo</label>
                                <input
                                    type="url"
                                    value={videoUrl}
                                    onChange={e => setVideoUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <p className="text-xs text-slate-400 mt-1">YouTube, Vimeo, Drive u otro enlace directo</p>
                            </div>
                        )}

                        {/* Subir vídeo o documento */}
                        {(contentType === 'video_file' || contentType === 'document') && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    {contentType === 'video_file' ? 'Selecciona el vídeo' : 'Selecciona el documento'}
                                </label>
                                {contentFile ? (
                                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                        <div>
                                            <p className="font-medium text-slate-800 text-sm">{contentFile.name}</p>
                                            <p className="text-xs text-slate-500">{(contentFile.size / 1024 / 1024).toFixed(1)} MB</p>
                                        </div>
                                        <button onClick={() => setContentFile(null)} className="text-red-500 hover:text-red-700">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                        <span className="text-sm text-slate-500">
                                            {contentType === 'video_file'
                                                ? 'MP4, MOV, AVI, WebM · máx 500 MB'
                                                : 'PDF, Word, PowerPoint · máx 500 MB'}
                                        </span>
                                        <input
                                            type="file"
                                            accept={contentType === 'video_file'
                                                ? 'video/mp4,video/quicktime,video/avi,video/webm'
                                                : '.pdf,.doc,.docx,.ppt,.pptx'}
                                            onChange={handleContentFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                        )}

                        {/* Artículo */}
                        {contentType === 'article' && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Contenido del artículo</label>
                                <textarea
                                    value={articleText}
                                    onChange={e => setArticleText(e.target.value)}
                                    rows={12}
                                    placeholder="Escribe aquí el contenido formativo del curso. Puedes usar texto plano o Markdown."
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y font-mono text-sm"
                                />
                                <p className="text-xs text-slate-400 mt-1">{articleText.length} caracteres</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ──── PASO 3: Revisión ──── */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                            {coverPreview && (
                                <img src={coverPreview} alt="Portada" className="w-full h-52 object-cover rounded-xl mb-6" />
                            )}
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">{courseData.title}</h2>
                            <p className="text-slate-600 mb-6 leading-relaxed">{courseData.description}</p>

                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <p className="text-slate-500 mb-1">Precio</p>
                                    <p className="font-bold text-xl text-emerald-600">{courseData.price} €</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <p className="text-slate-500 mb-1">Nivel</p>
                                    <p className="font-bold text-slate-800">{courseData.level}</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <p className="text-slate-500 mb-1">Categoría</p>
                                    <p className="font-bold text-slate-800">{courseData.category}</p>
                                </div>
                                {courseData.durationMinutes && parseInt(courseData.durationMinutes) > 0 && (
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-slate-500 mb-1">Duración</p>
                                        <p className="font-bold text-slate-800">{formatMinutes(parseInt(courseData.durationMinutes))}</p>
                                    </div>
                                )}
                            </div>

                            {/* Resumen del contenido */}
                            {contentType && (
                                <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <p className="font-semibold text-slate-700 mb-1">Contenido</p>
                                    <p className="text-slate-600 text-sm">
                                        {CONTENT_TYPES.find(ct => ct.id === contentType)?.icon}{' '}
                                        {CONTENT_TYPES.find(ct => ct.id === contentType)?.label}
                                        {contentType === 'video_url' && videoUrl && `: ${videoUrl.slice(0, 50)}...`}
                                        {(contentType === 'video_file' || contentType === 'document') && contentFile && `: ${contentFile.name}`}
                                        {contentType === 'article' && articleText && ` (${articleText.length} caracteres)`}
                                    </p>
                                </div>
                            )}

                            {courseData.learningObjectives && (
                                <div className="mt-4">
                                    <p className="font-semibold text-slate-700 mb-1">¿Qué aprenderán?</p>
                                    <p className="text-slate-600 text-sm">{courseData.learningObjectives}</p>
                                </div>
                            )}
                        </div>

                        {/* Barra de progreso subida */}
                        {loading && uploadProgress > 0 && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                                <p className="text-sm font-semibold text-slate-700 mb-2">Subiendo contenido... {uploadProgress}%</p>
                                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-2 bg-emerald-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handlePublish}
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                        >
                            {loading
                                ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {uploadProgress > 0 ? `Subiendo ${uploadProgress}%...` : 'Publicando...'}</>
                                : <><CheckCircle className="w-5 h-5" /> Publicar curso</>
                            }
                        </button>
                    </div>
                )}

                {/* Navegación paso 1 */}
                {step === 1 && (
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={() => { if (validate()) setStep(2); }}
                            className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
                        >
                            Continuar
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Navegación paso 2 */}
                {step === 2 && (
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={() => setStep(3)}
                            className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
                        >
                            Revisar y publicar
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateCoursePage;
