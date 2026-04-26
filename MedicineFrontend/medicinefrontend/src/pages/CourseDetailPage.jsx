// ═══════════════════════════════════════════════════════════════
// CourseDetailPage.jsx - Detalle público de un curso
// Route: /courses/:id
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTaxRate } from '../hooks/useTaxRate';
import api from '../services/api';
import {
    GraduationCap, Clock, Star, Users, BookOpen, Award,
    CheckCircle, ChevronRight, Video, MapPin, AlertCircle, Loader2
} from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const formatMinutes = (mins) => {
    if (!mins || mins <= 0) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
};

const LEVEL_COLORS = {
    Principiante: 'bg-emerald-100 text-emerald-700',
    Intermedio:   'bg-amber-100 text-amber-700',
    Avanzado:     'bg-red-100 text-red-700',
};

const CourseDetailPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const { user, isDoctor, isPatient } = useAuth();
    const ivaRate = useTaxRate();
    // Los pacientes pagan IVA (tipo de BD); los doctores están exentos
    const applyIva = isPatient || !user;   // visitante sin sesión → mostramos precio con IVA por defecto

    const [course, setCourse]           = useState(location.state?.course || null);
    const [loading, setLoading]         = useState(!course);
    const [error, setError]             = useState(null);
    const [enrollment, setEnrollment]   = useState(null);    // null = unknown, false = not enrolled, object = enrolled
    const [enrollLoading, setEnrollLoading] = useState(false);
    const [enrollError, setEnrollError] = useState(null);
    const [enrolled, setEnrolled]       = useState(false);

    // Fetch course if not passed via state
    useEffect(() => {
        if (course) return;
        const fetchCourse = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get('/doctor/courses/public/search');
                const all = res.data;
                const found = all.find(c => String(c.id) === String(id));
                if (!found) {
                    setError('Curso no encontrado.');
                } else {
                    setCourse(found);
                }
            } catch (err) {
                console.error('Error cargando curso:', err);
                setError('No se pudo cargar el curso. Inténtalo más tarde.');
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [id]);

    // Check enrollment status if logged in
    useEffect(() => {
        if (!user || !course) return;
        const checkEnrollment = async () => {
            try {
                const res = await api.get(`/courses/${id}/my-enrollment`);
                setEnrollment(res.data);
                setEnrolled(!!res.data); // null = not enrolled, object = enrolled
            } catch (err) {
                setEnrolled(false);
                setEnrollment(null);
            }
        };
        checkEnrollment();
    }, [user, course, id]);

    const handleEnroll = async () => {
        if (!user) return;
        setEnrollLoading(true);
        setEnrollError(null);
        try {
            const price = course?.price ?? 0;

            if (price > 0) {
                // Curso de pago → crear sesión de Stripe y redirigir
                const res = await api.post('/payments/course-checkout', { courseId: Number(id) });
                window.location.href = res.data.url;
            } else {
                // Curso gratuito → matricularse directamente
                await api.post(`/courses/${id}/enroll`);
                setEnrolled(true);
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'No se pudo completar la matriculación.';
            setEnrollError(msg);
        } finally {
            setEnrollLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
                    <p className="text-slate-600">Cargando curso...</p>
                </div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Curso no disponible</h2>
                    <p className="text-slate-500 mb-6">{error || 'No se encontró el curso solicitado.'}</p>
                    <Link
                        to="/courses"
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                    >
                        Ver todos los cursos
                    </Link>
                </div>
            </div>
        );
    }

    const doctorName = `${course.doctor?.firstName ?? ''} ${course.doctor?.lastName ?? ''}`.trim();
    const levelColor = LEVEL_COLORS[course.level] || 'bg-slate-100 text-slate-600';

    // Parse JSON fields safely
    const objectives = (() => {
        try { return JSON.parse(course.learningObjectives || '[]'); } catch { return []; }
    })();
    const prerequisites = (() => {
        try { return JSON.parse(course.prerequisites || '[]'); } catch { return []; }
    })();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
            {/* ── Hero ── */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-600 text-white">
                <div className="max-w-6xl mx-auto px-6 py-12">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-emerald-200 text-sm mb-6">
                        <Link to="/courses" className="hover:text-white transition-colors">Cursos</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-white truncate">{course.title}</span>
                    </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                        {/* Left: info */}
                        <div className="lg:col-span-2">
                            {/* Badges */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${levelColor}`}>
                                    {course.level}
                                </span>
                                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-white">
                                    {course.category}
                                </span>
                            </div>

                            <h1 className="text-3xl font-bold mb-4 leading-tight">{course.title}</h1>
                            <p className="text-emerald-100 text-base leading-relaxed mb-6">{course.description}</p>

                            {/* Stats */}
                            <div className="flex flex-wrap gap-5 text-sm text-emerald-100">
                                {formatMinutes(course.durationMinutes) && (
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" /> {formatMinutes(course.durationMinutes)}
                                    </span>
                                )}
                                {course.averageRating > 0 && (
                                    <span className="flex items-center gap-1.5 text-amber-300">
                                        <Star className="w-4 h-4 fill-amber-300" />
                                        {course.averageRating.toFixed(1)}
                                        {course.totalRatings > 0 && <span className="text-emerald-200">({course.totalRatings} reseñas)</span>}
                                    </span>
                                )}
                                {course.totalEnrollments > 0 && (
                                    <span className="flex items-center gap-1.5">
                                        <Users className="w-4 h-4" /> {course.totalEnrollments} alumnos
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Right: cover image on larger screens */}
                        <div className="hidden lg:block">
                            {course.coverImageUrl ? (
                                <img
                                    src={`${BASE_URL}${course.coverImageUrl}`}
                                    alt={course.title}
                                    className="w-full h-52 object-cover rounded-2xl shadow-xl"
                                />
                            ) : (
                                <div className="w-full h-52 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <GraduationCap className="w-20 h-20 text-white/40" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main content ── */}
            <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left column: details */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Cover image (mobile) */}
                    {course.coverImageUrl && (
                        <div className="lg:hidden">
                            <img
                                src={`${BASE_URL}${course.coverImageUrl}`}
                                alt={course.title}
                                className="w-full h-52 object-cover rounded-2xl shadow-md"
                            />
                        </div>
                    )}

                    {/* Learning objectives */}
                    {objectives.length > 0 && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Award className="w-5 h-5 text-emerald-600" />
                                Lo que aprenderás
                            </h2>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {objectives.map((obj, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                        {obj}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Prerequisites */}
                    {prerequisites.length > 0 && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-teal-600" />
                                Requisitos previos
                            </h2>
                            <ul className="space-y-2">
                                {prerequisites.map((req, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                        <ChevronRight className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                                        {req}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Full description */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h2 className="text-lg font-bold text-slate-900 mb-3">Descripción del curso</h2>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-line">{course.description}</p>
                    </div>
                </div>

                {/* Right column: enrollment card */}
                <div className="space-y-6">

                    {/* Enrollment card */}
                    <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 sticky top-6">
                        {/* Price */}
                        <div className="mb-5">
                            {course.price === 0 ? (
                                <p className="text-3xl font-bold text-emerald-600">Gratis</p>
                            ) : (
                                <>
                                    <p className="text-3xl font-bold text-emerald-600">
                                        {applyIva
                                            ? (course.price * (1 + ivaRate)).toFixed(2)
                                            : course.price.toFixed(2)} €
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {applyIva ? `IVA ${(ivaRate * 100).toFixed(0)}% incluido` : 'Exento de IVA'}
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Enroll CTA */}
                        {!user ? (
                            <div className="text-center">
                                <p className="text-slate-500 text-sm mb-4">Inicia sesión para matricularte en este curso.</p>
                                <Link
                                    to="/login"
                                    className="block w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl text-center transition-all shadow-sm"
                                >
                                    Iniciar sesión para matricularse
                                </Link>
                            </div>
                        ) : enrolled ? (
                            <button
                                disabled
                                className="w-full py-3 bg-emerald-100 text-emerald-700 font-semibold rounded-xl flex items-center justify-center gap-2 cursor-default"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Ya estás matriculado
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleEnroll}
                                    disabled={enrollLoading}
                                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-60"
                                >
                                    {enrollLoading
                                        ? <Loader2 className="w-5 h-5 animate-spin" />
                                        : <GraduationCap className="w-5 h-5" />
                                    }
                                    {enrollLoading
                                        ? 'Redirigiendo a pago...'
                                        : course.price > 0
                                            ? `Pagar con Stripe — ${applyIva
                                                ? (course.price * (1 + ivaRate)).toFixed(2)
                                                : course.price.toFixed(2)} €`
                                            : 'Matricularme gratis'
                                    }
                                </button>
                                {enrollError && (
                                    <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                        {enrollError}
                                    </p>
                                )}
                            </>
                        )}

                        <hr className="my-5 border-slate-100" />

                        {/* Course meta */}
                        <ul className="space-y-3 text-sm text-slate-600">
                            {course.level && (
                                <li className="flex items-center gap-2">
                                    <Award className="w-4 h-4 text-slate-400" />
                                    <span>Nivel: <strong className="text-slate-800">{course.level}</strong></span>
                                </li>
                            )}
                            {formatMinutes(course.durationMinutes) && (
                                <li className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span>Duración: <strong className="text-slate-800">{formatMinutes(course.durationMinutes)}</strong></span>
                                </li>
                            )}
                            {course.category && (
                                <li className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-slate-400" />
                                    <span>Categoría: <strong className="text-slate-800">{course.category}</strong></span>
                                </li>
                            )}
                            {course.totalEnrollments > 0 && (
                                <li className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-slate-400" />
                                    <span><strong className="text-slate-800">{course.totalEnrollments}</strong> alumnos inscritos</span>
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Doctor card */}
                    {doctorName && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Impartido por</h3>
                            <div className="flex items-center gap-3">
                                {course.doctor?.profilePictureUrl ? (
                                    <img
                                        src={`${BASE_URL}${course.doctor.profilePictureUrl}`}
                                        alt={doctorName}
                                        className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-lg font-bold text-emerald-600">
                                            {course.doctor?.firstName?.[0] ?? '?'}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <p className="font-bold text-slate-900">{doctorName}</p>
                                    {course.doctor?.yearsOfExperience > 0 && (
                                        <p className="text-sm text-slate-500">{course.doctor.yearsOfExperience} años de experiencia</p>
                                    )}
                                    {course.doctor?.speciality && (
                                        <p className="text-xs text-emerald-600 font-medium mt-0.5">{course.doctor.speciality}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseDetailPage;
