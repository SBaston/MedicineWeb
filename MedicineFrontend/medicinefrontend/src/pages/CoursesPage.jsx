// ═══════════════════════════════════════════════════════════════
// CoursesPage.jsx - Buscador público de cursos formativos
// GET /api/doctor/courses/public/search
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import {
    Search, Filter, BookOpen, Clock, Star, Users,
    X, GraduationCap
} from 'lucide-react';
import api from '../services/api';
import specialtyService from '../services/specialtyService';

/** Convierte minutos a texto legible */
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
    Intermedio:   'bg-amber-100   text-amber-700',
    Avanzado:     'bg-red-100     text-red-700',
};

const CoursesPage = () => {
    const [courses, setCourses]         = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [specialties, setSpecialties] = useState([]);

    // Filtros
    const [search,   setSearch]   = useState('');
    const [category, setCategory] = useState('');
    const [level,    setLevel]    = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    // Cargar especialidades para el filtro de categoría
    useEffect(() => {
        specialtyService.getActive()
            .then(data => setSpecialties(data))
            .catch(() => setSpecialties([]));
    }, []);

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (search.trim()) params.search   = search.trim();
            if (category)      params.category  = category;
            if (level)         params.level     = level;
            if (maxPrice)      params.maxPrice  = parseFloat(maxPrice);

            const res = await api.get('/doctor/courses/public/search', { params });
            setCourses(res.data);
        } catch (err) {
            console.error('Error cargando cursos:', err);
            setError('No se pudieron cargar los cursos. Inténtalo más tarde.');
        } finally {
            setLoading(false);
        }
    }, [search, category, level, maxPrice]);

    // Buscar al montar y cada vez que cambien los filtros de select/precio
    useEffect(() => {
        fetchCourses();
    }, [category, level, maxPrice]);

    // Para search: debounce de 500 ms
    useEffect(() => {
        const t = setTimeout(() => fetchCourses(), 500);
        return () => clearTimeout(t);
    }, [search]);

    const clearFilters = () => {
        setSearch('');
        setCategory('');
        setLevel('');
        setMaxPrice('');
    };

    const hasFilters = search || category || level || maxPrice;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">

            {/* ── Hero ── */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <div className="max-w-6xl mx-auto px-6 py-14">
                    <div className="flex items-center gap-3 mb-3">
                        <GraduationCap className="w-8 h-8 opacity-80" />
                        <span className="text-emerald-200 font-medium uppercase tracking-widest text-sm">
                            Formación continua
                        </span>
                    </div>
                    <h1 className="text-4xl font-bold mb-3">Cursos de profesionales</h1>
                    <p className="text-emerald-100 text-lg max-w-xl">
                        Amplía tus conocimientos con cursos creados por médicos y especialistas verificados.
                    </p>

                    {/* Barra de búsqueda principal */}
                    <div className="mt-8 flex gap-3 max-w-2xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar cursos..."
                                className="w-full pl-12 pr-4 py-3 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-white shadow-lg"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(v => !v)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold shadow-lg transition-colors ${
                                showFilters ? 'bg-white text-emerald-700' : 'bg-white/20 hover:bg-white/30 text-white'
                            }`}
                        >
                            <Filter className="w-5 h-5" />
                            Filtros
                            {hasFilters && (
                                <span className="w-2 h-2 bg-amber-400 rounded-full" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Panel de filtros ── */}
            {showFilters && (
                <div className="bg-white border-b border-slate-200 shadow-sm">
                    <div className="max-w-6xl mx-auto px-6 py-5">
                        <div className="flex flex-wrap gap-4 items-end">
                            {/* Categoría */}
                            <div className="flex-1 min-w-[180px]">
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                                    Categoría
                                </label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                >
                                    <option value="">Todas las categorías</option>
                                    {specialties.map(s => (
                                        <option key={s.id} value={s.name}>{s.name}</option>
                                    ))}
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>

                            {/* Nivel */}
                            <div className="flex-1 min-w-[160px]">
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                                    Nivel
                                </label>
                                <select
                                    value={level}
                                    onChange={e => setLevel(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                >
                                    <option value="">Todos los niveles</option>
                                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>

                            {/* Precio máximo */}
                            <div className="flex-1 min-w-[160px]">
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                                    Precio máximo (€)
                                </label>
                                <input
                                    type="number"
                                    value={maxPrice}
                                    onChange={e => setMaxPrice(e.target.value)}
                                    placeholder="Sin límite"
                                    min="1"
                                    step="5"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                />
                            </div>

                            {/* Limpiar */}
                            {hasFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition-colors pb-0.5"
                                >
                                    <X className="w-4 h-4" />
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Contenido ── */}
            <div className="max-w-6xl mx-auto px-6 py-10">

                {/* Contador de resultados */}
                {!loading && !error && (
                    <p className="text-slate-500 text-sm mb-6">
                        {courses.length === 0
                            ? 'No se encontraron cursos con los filtros seleccionados.'
                            : `${courses.length} curso${courses.length !== 1 ? 's' : ''} encontrado${courses.length !== 1 ? 's' : ''}`
                        }
                    </p>
                )}

                {/* Loading */}
                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 animate-pulse">
                                <div className="h-44 bg-slate-200" />
                                <div className="p-5 space-y-3">
                                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                                    <div className="h-3 bg-slate-200 rounded w-full" />
                                    <div className="h-3 bg-slate-200 rounded w-5/6" />
                                    <div className="h-8 bg-slate-100 rounded-lg mt-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <X className="w-8 h-8 text-red-500" />
                        </div>
                        <p className="text-slate-600 mb-4">{error}</p>
                        <button
                            onClick={fetchCourses}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {/* Sin resultados */}
                {!loading && !error && courses.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                            <BookOpen className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No hay cursos disponibles</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            {hasFilters
                                ? 'Prueba con otros filtros o amplía tu búsqueda.'
                                : 'Aún no se han publicado cursos. ¡Vuelve pronto!'
                            }
                        </p>
                        {hasFilters && (
                            <button
                                onClick={clearFilters}
                                className="mt-6 px-6 py-2 border border-emerald-600 text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
                            >
                                Ver todos los cursos
                            </button>
                        )}
                    </div>
                )}

                {/* Grid de cursos */}
                {!loading && !error && courses.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map(course => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Tarjeta de curso ────────────────────────────────────────────
const CourseCard = ({ course }) => {
    const levelColor = LEVEL_COLORS[course.level] || 'bg-slate-100 text-slate-600';
    const doctorName = `${course.doctor?.firstName ?? ''} ${course.doctor?.lastName ?? ''}`.trim();

    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col">
            {/* Portada */}
            {course.coverImageUrl ? (
                <img
                    src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${course.coverImageUrl}`}
                    alt={course.title}
                    className="h-44 w-full object-cover"
                />
            ) : (
                <div className="h-44 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                    <GraduationCap className="w-16 h-16 text-emerald-300" />
                </div>
            )}

            <div className="p-5 flex flex-col flex-1">
                {/* Badges */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${levelColor}`}>
                        {course.level}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                        {course.category}
                    </span>
                </div>

                {/* Título */}
                <h3 className="font-bold text-slate-900 text-base leading-snug mb-2 line-clamp-2">
                    {course.title}
                </h3>

                {/* Descripción */}
                <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
                    {course.description}
                </p>

                {/* Meta: duración + rating + alumnos */}
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                    {formatMinutes(course.durationMinutes) && (
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatMinutes(course.durationMinutes)}
                        </span>
                    )}
                    {course.averageRating > 0 && (
                        <span className="flex items-center gap-1 text-amber-600">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            {course.averageRating.toFixed(1)}
                            {course.totalRatings > 0 && <span className="text-slate-400">({course.totalRatings})</span>}
                        </span>
                    )}
                    {course.totalEnrollments > 0 && (
                        <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {course.totalEnrollments} alumnos
                        </span>
                    )}
                </div>

                {/* Doctor */}
                {doctorName && (
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                        {course.doctor?.profilePictureUrl ? (
                            <img
                                src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${course.doctor.profilePictureUrl}`}
                                alt={doctorName}
                                className="w-7 h-7 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                                <span className="text-xs font-bold text-emerald-600">
                                    {course.doctor?.firstName?.[0] ?? '?'}
                                </span>
                            </div>
                        )}
                        <div>
                            <p className="text-xs font-semibold text-slate-700">{doctorName}</p>
                            {course.doctor?.yearsOfExperience > 0 && (
                                <p className="text-xs text-slate-400">{course.doctor.yearsOfExperience} años de experiencia</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Precio + CTA */}
                <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-emerald-600">
                        {course.price === 0 ? 'Gratis' : `${course.price} €`}
                    </span>
                    <button className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
                        Ver curso
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CoursesPage;
