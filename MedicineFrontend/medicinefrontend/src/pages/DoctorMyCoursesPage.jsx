// ═══════════════════════════════════════════════════════════════
// DoctorMyCoursesPage.jsx - Gestión de cursos del doctor
// Route: /doctor/my-courses
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen, Plus, Eye, EyeOff, Trash2, Edit2, X, Save,
    GraduationCap, Users, Star, Clock, CheckCircle, AlertCircle,
    Loader2, ChevronLeft, Image, Globe, Lock
} from 'lucide-react';
import doctorDashboardService from '../services/doctordashboardService';
import specialtyService from '../services/specialtyService';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const formatMinutes = (mins) => {
    if (!mins || mins <= 0) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
};

const LEVELS = ['Principiante', 'Intermedio', 'Avanzado'];
const LEVEL_COLORS = {
    Principiante: 'bg-emerald-100 text-emerald-700',
    Intermedio: 'bg-amber-100 text-amber-700',
    Avanzado: 'bg-red-100 text-red-700',
};

// ── Modal de edición ────────────────────────────────────────────
const EditModal = ({ course, specialties, onSave, onClose }) => {
    const [form, setForm] = useState({
        title: course.title || '',
        description: course.description || '',
        price: course.price ?? 0,
        level: course.level || 'Principiante',
        category: course.category || '',
        durationMinutes: course.durationMinutes || '',
        language: course.language || 'Español',
        prerequisites: (() => {
            try { return JSON.parse(course.prerequisites || '[]').join('\n'); } catch { return ''; }
        })(),
        learningObjectives: (() => {
            try { return JSON.parse(course.learningObjectives || '[]').join('\n'); } catch { return ''; }
        })(),
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSave = async () => {
        if (!form.title.trim()) { setError('El título es obligatorio'); return; }
        setSaving(true);
        setError(null);
        try {
            const payload = {
                ...form,
                price: parseFloat(form.price) || 0,
                durationMinutes: parseInt(form.durationMinutes) || null,
                prerequisites: JSON.stringify(
                    form.prerequisites.split('\n').map(s => s.trim()).filter(Boolean)
                ),
                learningObjectives: JSON.stringify(
                    form.learningObjectives.split('\n').map(s => s.trim()).filter(Boolean)
                ),
                contentType: course.contentType || null,
                contentUrl: course.contentUrl || null,
                articleContent: course.articleContent || null,
            };
            const updated = await doctorDashboardService.updateCourse(course.id, payload);
            onSave(updated);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar los cambios');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Edit2 className="w-5 h-5 text-blue-600" />
                        Editar curso
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Título */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Título *</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => handleChange('title', e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Título del curso"
                        />
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Descripción</label>
                        <textarea
                            value={form.description}
                            onChange={e => handleChange('description', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                            placeholder="Describe de qué trata el curso..."
                        />
                    </div>

                    {/* Precio + Duración */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Precio (€)</label>
                            <input
                                type="number"
                                value={form.price}
                                onChange={e => handleChange('price', e.target.value)}
                                min="0" step="0.01"
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Duración (minutos)</label>
                            <input
                                type="number"
                                value={form.durationMinutes}
                                onChange={e => handleChange('durationMinutes', e.target.value)}
                                min="1"
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="Ej: 90"
                            />
                        </div>
                    </div>

                    {/* Nivel + Categoría */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Nivel</label>
                            <select
                                value={form.level}
                                onChange={e => handleChange('level', e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Categoría</label>
                            <select
                                value={form.category}
                                onChange={e => handleChange('category', e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="">Selecciona categoría</option>
                                {specialties.map(s => (
                                    <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                    </div>

                    {/* Objetivos */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Objetivos de aprendizaje
                            <span className="font-normal text-slate-400 ml-1">(uno por línea)</span>
                        </label>
                        <textarea
                            value={form.learningObjectives}
                            onChange={e => handleChange('learningObjectives', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                            placeholder="Identificar síntomas principales&#10;Aplicar técnicas de diagnóstico&#10;..."
                        />
                    </div>

                    {/* Prerrequisitos */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Requisitos previos
                            <span className="font-normal text-slate-400 ml-1">(uno por línea)</span>
                        </label>
                        <textarea
                            value={form.prerequisites}
                            onChange={e => handleChange('prerequisites', e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                            placeholder="Conocimientos básicos de anatomía&#10;..."
                        />
                    </div>

                    {error && (
                        <p className="text-red-600 text-sm flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Tarjeta de curso ────────────────────────────────────────────
const CourseManageCard = ({ course, onPublish, onUnpublish, onDelete, onEdit }) => {
    const [toggling, setToggling] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleToggle = async () => {
        setToggling(true);
        try {
            if (course.isPublished) {
                await onUnpublish(course.id);
            } else {
                await onPublish(course.id);
            }
        } finally {
            setToggling(false);
        }
    };

    const handleDelete = async () => {
        const confirmed = window.confirm(
            `¿Seguro que quieres eliminar "${course.title}"? Esta acción no se puede deshacer.`
        );
        if (!confirmed) return;
        setDeleting(true);
        try {
            await onDelete(course.id);
        } finally {
            setDeleting(false);
        }
    };

    const levelColor = LEVEL_COLORS[course.level] || 'bg-slate-100 text-slate-600';

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            {/* Cover */}
            <div className="relative h-40">
                {course.coverImageUrl ? (
                    <img
                        src={`${BASE_URL}${course.coverImageUrl}`}
                        alt={course.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                        <GraduationCap className="w-14 h-14 text-blue-300" />
                    </div>
                )}
                {/* Estado badge */}
                <div className="absolute top-3 right-3">
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${
                        course.isPublished
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-700 text-white'
                    }`}>
                        {course.isPublished
                            ? <><Globe className="w-3 h-3" /> Publicado</>
                            : <><Lock className="w-3 h-3" /> Borrador</>
                        }
                    </span>
                </div>
                {/* Cover image placeholder */}
                {!course.coverImageUrl && (
                    <div className="absolute bottom-2 left-2">
                        <span className="flex items-center gap-1 px-2 py-1 bg-white/80 text-slate-500 text-xs rounded-lg">
                            <Image className="w-3 h-3" />
                            Sin portada
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5">
                {/* Badges */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${levelColor}`}>
                        {course.level}
                    </span>
                    {course.category && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                            {course.category}
                        </span>
                    )}
                </div>

                <h3 className="font-bold text-slate-900 text-base leading-snug mb-2 line-clamp-2">
                    {course.title}
                </h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-4">{course.description}</p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 pb-4 border-b border-slate-100">
                    {formatMinutes(course.durationMinutes) && (
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatMinutes(course.durationMinutes)}
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {course.totalEnrollments ?? 0} alumnos
                    </span>
                    {course.averageRating > 0 && (
                        <span className="flex items-center gap-1 text-amber-600">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            {course.averageRating.toFixed(1)}
                        </span>
                    )}
                    <span className="ml-auto font-bold text-emerald-600 text-sm">
                        {course.price === 0 ? 'Gratis' : `${course.price} €`}
                    </span>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Editar */}
                    <button
                        onClick={() => onEdit(course)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                        Editar
                    </button>

                    {/* Publicar / Despublicar */}
                    <button
                        onClick={handleToggle}
                        disabled={toggling}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-60 ${
                            course.isPublished
                                ? 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                                : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                    >
                        {toggling ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : course.isPublished ? (
                            <><EyeOff className="w-3.5 h-3.5" /> Ocultar</>
                        ) : (
                            <><Eye className="w-3.5 h-3.5" /> Publicar</>
                        )}
                    </button>

                    {/* Eliminar */}
                    <button
                        onClick={handleDelete}
                        disabled={deleting || course.totalEnrollments > 0}
                        title={course.totalEnrollments > 0 ? 'No puedes eliminar un curso con alumnos inscritos' : ''}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
                    >
                        {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Eliminar
                    </button>
                </div>

                {course.totalEnrollments > 0 && (
                    <p className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        No se puede eliminar: hay {course.totalEnrollments} alumno{course.totalEnrollments !== 1 ? 's' : ''} inscrito{course.totalEnrollments !== 1 ? 's' : ''}
                    </p>
                )}
            </div>
        </div>
    );
};

// ── Página principal ────────────────────────────────────────────
const DoctorMyCoursesPage = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [specialties, setSpecialties] = useState([]);
    const [editingCourse, setEditingCourse] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    useEffect(() => {
        loadCourses();
        specialtyService.getActive()
            .then(data => setSpecialties(data))
            .catch(() => setSpecialties([]));
    }, []);

    const loadCourses = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await doctorDashboardService.getCourses();
            setCourses(data);
        } catch (err) {
            setError('No se pudieron cargar tus cursos. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(null), 3000);
    };

    const handlePublish = async (id) => {
        try {
            const updated = await doctorDashboardService.publishCourse(id);
            setCourses(prev => prev.map(c => c.id === id ? updated : c));
            showSuccess('Curso publicado correctamente');
        } catch (err) {
            alert(err.response?.data?.message || 'Error al publicar el curso');
        }
    };

    const handleUnpublish = async (id) => {
        try {
            const updated = await doctorDashboardService.unpublishCourse(id);
            setCourses(prev => prev.map(c => c.id === id ? updated : c));
            showSuccess('Curso ocultado. Ya no es visible para los usuarios.');
        } catch (err) {
            alert(err.response?.data?.message || 'Error al despublicar el curso');
        }
    };

    const handleDelete = async (id) => {
        try {
            await doctorDashboardService.deleteCourse(id);
            setCourses(prev => prev.filter(c => c.id !== id));
            showSuccess('Curso eliminado correctamente');
        } catch (err) {
            alert(err.response?.data?.message || 'Error al eliminar el curso');
        }
    };

    const handleSaveEdit = (updated) => {
        setCourses(prev => prev.map(c => c.id === updated.id ? updated : c));
        setEditingCourse(null);
        showSuccess('Cambios guardados correctamente');
    };

    const publishedCount = courses.filter(c => c.isPublished).length;
    const totalEnrollments = courses.reduce((sum, c) => sum + (c.totalEnrollments ?? 0), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/doctor/dashboard')}
                                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <BookOpen className="w-6 h-6 text-blue-600" />
                                    Mis cursos
                                </h1>
                                <p className="text-slate-500 text-sm mt-0.5">Gestiona y publica tus cursos formativos</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/doctor/courses')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Crear curso
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Mensaje de éxito */}
                {successMsg && (
                    <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-3 rounded-xl">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="font-medium text-sm">{successMsg}</p>
                    </div>
                )}

                {/* Stats rápidas */}
                {!loading && courses.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <BookOpen className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{courses.length}</p>
                                <p className="text-sm text-slate-500">Cursos creados</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 rounded-xl">
                                <Globe className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{publishedCount}</p>
                                <p className="text-sm text-slate-500">Publicados</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{totalEnrollments}</p>
                                <p className="text-sm text-slate-500">Alumnos inscritos</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 animate-pulse">
                                <div className="h-40 bg-slate-200" />
                                <div className="p-5 space-y-3">
                                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                                    <div className="h-3 bg-slate-200 rounded w-full" />
                                    <div className="h-8 bg-slate-100 rounded-lg mt-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error */}
                {error && !loading && (
                    <div className="text-center py-20">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <p className="text-slate-600 mb-4">{error}</p>
                        <button
                            onClick={loadCourses}
                            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {/* Sin cursos */}
                {!loading && !error && courses.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5">
                            <GraduationCap className="w-10 h-10 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Aún no tienes cursos</h3>
                        <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                            Crea tu primer curso formativo y comparte tu conocimiento con pacientes y otros profesionales.
                        </p>
                        <button
                            onClick={() => navigate('/doctor/courses')}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors mx-auto"
                        >
                            <Plus className="w-5 h-5" />
                            Crear mi primer curso
                        </button>
                    </div>
                )}

                {/* Grid de cursos */}
                {!loading && !error && courses.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map(course => (
                            <CourseManageCard
                                key={course.id}
                                course={course}
                                onPublish={handlePublish}
                                onUnpublish={handleUnpublish}
                                onDelete={handleDelete}
                                onEdit={setEditingCourse}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de edición */}
            {editingCourse && (
                <EditModal
                    course={editingCourse}
                    specialties={specialties}
                    onSave={handleSaveEdit}
                    onClose={() => setEditingCourse(null)}
                />
            )}
        </div>
    );
};

export default DoctorMyCoursesPage;
