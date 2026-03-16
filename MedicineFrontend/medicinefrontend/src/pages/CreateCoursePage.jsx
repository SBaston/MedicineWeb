// ═══════════════════════════════════════════════════════════════
// CreateCoursePage.jsx - Crear Curso Formativo
// SIN MOCKS - Conectado con backend real
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, Save, Upload, Plus, Trash2,
    BookOpen, FileText, Video, CheckCircle
} from 'lucide-react';
import doctorDashboardService from '../services/doctordashboardService';

const LEVELS = ['Principiante', 'Intermedio', 'Avanzado'];
const CATEGORIES = ['Nutrición', 'Ejercicio', 'Salud Mental', 'Medicina General', 'Otro'];

const CreateCoursePage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
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
    });
    const [coverImage, setCoverImage] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [modules, setModules] = useState([]);
    const [errors, setErrors] = useState({});

    const handleCourseChange = (e) => {
        const { name, value } = e.target;
        setCourseData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Imagen demasiado grande (máx 5MB)');
                return;
            }
            setCoverImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setCoverPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const addModule = () => {
        setModules([...modules, {
            id: `temp_${Date.now()}`,
            title: '',
            content: '',
            videoUrl: '',
            videoDurationMinutes: '',
            isFree: false
        }]);
    };

    const updateModule = (index, field, value) => {
        const updated = [...modules];
        updated[index][field] = value;
        setModules(updated);
    };

    const removeModule = (index) => {
        setModules(modules.filter((_, i) => i !== index));
    };

    const validateStep1 = () => {
        const newErrors = {};
        if (!courseData.title) newErrors.title = 'Título obligatorio';
        if (!courseData.description) newErrors.description = 'Descripción obligatoria';
        if (!courseData.price || courseData.price <= 0) newErrors.price = 'Precio inválido';
        if (!courseData.durationHours || courseData.durationHours <= 0) newErrors.durationHours = 'Duración inválida';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        if (modules.length === 0) {
            alert('Añade al menos un módulo');
            return false;
        }
        for (let mod of modules) {
            if (!mod.title || !mod.content) {
                alert('Completa todos los módulos');
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (step === 1 && validateStep1()) setStep(2);
        else if (step === 2 && validateStep2()) setStep(3);
    };

    const handlePublish = async () => {
        setLoading(true);
        try {
            // 1. Crear curso
            const course = await doctorDashboardService.createCourse({
                title: courseData.title,
                description: courseData.description,
                price: parseFloat(courseData.price),
                level: courseData.level,
                category: courseData.category,
                durationHours: parseInt(courseData.durationHours),
                language: courseData.language,
                prerequisites: courseData.prerequisites || null,
                learningObjectives: courseData.learningObjectives || null
            });

            // 2. Subir imagen si hay
            if (coverImage) {
                await doctorDashboardService.uploadCourseCover(course.id, coverImage);
            }

            // 3. Crear módulos
            for (const mod of modules) {
                await doctorDashboardService.createModule(course.id, {
                    title: mod.title,
                    content: mod.content,
                    videoUrl: mod.videoUrl || null,
                    videoDurationMinutes: mod.videoDurationMinutes ? parseInt(mod.videoDurationMinutes) : null,
                    isFree: mod.isFree
                });
            }

            // 4. Publicar
            await doctorDashboardService.publishCourse(course.id);

            alert('✅ Curso creado y publicado correctamente');
            navigate('/doctor/dashboard');

        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error al crear el curso');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button onClick={() => navigate('/doctor/dashboard')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Volver</span>
                        </button>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3].map(s => (
                                <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= s ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                    {s}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-8">
                    {step === 1 && 'Información del curso'}
                    {step === 2 && 'Módulos del curso'}
                    {step === 3 && 'Revisión y publicación'}
                </h1>

                {/* STEP 1: Course Info */}
                {step === 1 && (
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Título *</label>
                            <input name="title" value={courseData.title} onChange={handleCourseChange} className={`w-full px-4 py-3 rounded-lg border ${errors.title ? 'border-red-300' : 'border-slate-200'}`} />
                            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Descripción *</label>
                            <textarea name="description" value={courseData.description} onChange={handleCourseChange} rows={5} className={`w-full px-4 py-3 rounded-lg border ${errors.description ? 'border-red-300' : 'border-slate-200'}`} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Precio (€) *</label>
                                <input type="number" name="price" value={courseData.price} onChange={handleCourseChange} className="w-full px-4 py-3 rounded-lg border border-slate-200" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Duración (horas) *</label>
                                <input type="number" name="durationHours" value={courseData.durationHours} onChange={handleCourseChange} className="w-full px-4 py-3 rounded-lg border border-slate-200" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Nivel</label>
                                <select name="level" value={courseData.level} onChange={handleCourseChange} className="w-full px-4 py-3 rounded-lg border border-slate-200">
                                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Categoría</label>
                                <select name="category" value={courseData.category} onChange={handleCourseChange} className="w-full px-4 py-3 rounded-lg border border-slate-200">
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Imagen de portada</label>
                            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full" />
                            {coverPreview && <img src={coverPreview} alt="Preview" className="mt-4 w-full h-48 object-cover rounded-lg" />}
                        </div>
                    </div>
                )}

                {/* STEP 2: Modules */}
                {step === 2 && (
                    <div className="space-y-6">
                        <button onClick={addModule} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2">
                            <Plus className="w-5 h-5" />
                            Añadir módulo
                        </button>

                        {modules.map((mod, idx) => (
                            <div key={mod.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-slate-900">Módulo {idx + 1}</h3>
                                    <button onClick={() => removeModule(idx)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <input placeholder="Título del módulo" value={mod.title} onChange={(e) => updateModule(idx, 'title', e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-200" />
                                    <textarea placeholder="Contenido del módulo" value={mod.content} onChange={(e) => updateModule(idx, 'content', e.target.value)} rows={4} className="w-full px-4 py-3 rounded-lg border border-slate-200" />
                                    <input placeholder="URL del vídeo (opcional)" value={mod.videoUrl} onChange={(e) => updateModule(idx, 'videoUrl', e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-200" />
                                    <div className="flex items-center gap-4">
                                        <input type="number" placeholder="Duración (min)" value={mod.videoDurationMinutes} onChange={(e) => updateModule(idx, 'videoDurationMinutes', e.target.value)} className="w-32 px-4 py-3 rounded-lg border border-slate-200" />
                                        <label className="flex items-center gap-2">
                                            <input type="checkbox" checked={mod.isFree} onChange={(e) => updateModule(idx, 'isFree', e.target.checked)} />
                                            <span className="text-sm font-semibold">Vista previa gratuita</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* STEP 3: Review */}
                {step === 3 && (
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">{courseData.title}</h2>
                        <p className="text-slate-600 mb-6">{courseData.description}</p>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div><span className="text-slate-600">Precio:</span> <span className="font-bold">€{courseData.price}</span></div>
                            <div><span className="text-slate-600">Duración:</span> <span className="font-bold">{courseData.durationHours}h</span></div>
                            <div><span className="text-slate-600">Nivel:</span> <span className="font-bold">{courseData.level}</span></div>
                            <div><span className="text-slate-600">Módulos:</span> <span className="font-bold">{modules.length}</span></div>
                        </div>
                        <button onClick={handlePublish} disabled={loading} className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                            {loading ? 'Publicando...' : 'Publicar curso'}
                        </button>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8">
                    <button onClick={() => setStep(step - 1)} disabled={step === 1} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 disabled:opacity-50">
                        Anterior
                    </button>
                    {step < 3 && (
                        <button onClick={handleNext} className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 flex items-center gap-2">
                            Siguiente
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateCoursePage;