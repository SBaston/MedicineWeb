// ═══════════════════════════════════════════════════════════════
// CourseDetailPage.jsx - Detalle de curso + reproductor para inscritos
// Route: /courses/:id
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTaxRate } from '../hooks/useTaxRate';
import { useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import {
    GraduationCap, Clock, Star, Users, BookOpen, Award,
    CheckCircle, ChevronRight, AlertCircle, Loader2,
    Play, FileText, CheckCircle2,
    Trophy, ExternalLink
} from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

// ── Helpers ──────────────────────────────────────────────────────
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

// ═══════════════════════════════════════════════════════════
// Detección de tipo de vídeo
// ═══════════════════════════════════════════════════════════
/**
 * Analiza una URL y devuelve un objeto descriptor del tipo de media:
 * { type: 'youtube'|'tiktok'|'instagram'|'vimeo'|'file'|'external', ...data }
 */
const detectMedia = (url) => {
    if (!url) return null;

    // YouTube
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?\s]+)/);
    if (yt) return { type: 'youtube', embedUrl: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1` };

    // TikTok  (@user/video/ID  o  vm.tiktok.com/CODE)
    const tt = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/i);
    if (tt) return { type: 'tiktok', videoId: tt[1] };

    // Instagram posts, reels y tv
    const ig = url.match(/instagram\.com\/(p|reel|tv)\/([^/?#]+)/i);
    if (ig) return { type: 'instagram', permalink: url.split('?')[0].replace(/\/$/, '') + '/' };

    // Vimeo
    const vimeo = url.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vimeo[1]}?dnt=1` };

    // Archivo de vídeo directo
    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) return { type: 'file', url };

    // Enlace externo genérico
    return { type: 'external', url };
};

// ── Instagram embed (requiere script oficial) ────────────────────
const InstagramEmbed = ({ permalink }) => {
    const ref = useRef(null);

    useEffect(() => {
        // Si el script ya fue cargado, solo re-procesa
        if (window.instgrm) {
            window.instgrm.Embeds.process();
            return;
        }
        // Carga el script una sola vez
        if (document.getElementById('ig-embed-script')) return;
        const script = document.createElement('script');
        script.id    = 'ig-embed-script';
        script.src   = 'https://www.instagram.com/embed.js';
        script.async = true;
        script.onload = () => window.instgrm?.Embeds?.process();
        document.body.appendChild(script);
    }, [permalink]);

    return (
        <div className="flex justify-center w-full overflow-auto py-2">
            <blockquote
                ref={ref}
                className="instagram-media"
                data-instgrm-permalink={permalink}
                data-instgrm-version="14"
                data-instgrm-captioned
                style={{
                    background: '#FFF',
                    border: 0,
                    borderRadius: '12px',
                    boxShadow: '0 0 1px rgba(0,0,0,0.5), 0 1px 10px rgba(0,0,0,0.15)',
                    maxWidth: '540px',
                    minWidth: '326px',
                    width: '100%',
                    padding: 0,
                    margin: '0 auto',
                }}
            />
        </div>
    );
};

// ── Reproductor unificado ─────────────────────────────────────────
const VideoPlayer = ({ url, title = 'Vídeo' }) => {
    const media = detectMedia(url);
    if (!media) return null;

    switch (media.type) {
        case 'youtube':
        case 'vimeo':
            return (
                // 16:9 — padding-top trick para responsivo
                <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingTop: '56.25%' }}>
                    <iframe
                        className="absolute inset-0 w-full h-full"
                        src={media.embedUrl}
                        allowFullScreen
                        allow="autoplay; encrypted-media; picture-in-picture"
                        title={title}
                        loading="lazy"
                    />
                </div>
            );

        case 'tiktok':
            // TikTok es vertical (9:16). Centramos un iframe de ancho fijo.
            // Nota: el SDK de TikTok puede emitir un error interno de "webmssdk.prod"
            // en Edge — es un bug del propio SDK de TikTok y no afecta la reproducción.
            return (
                <div className="flex justify-center w-full">
                    <div className="relative rounded-xl overflow-hidden bg-black" style={{ width: '340px', height: '700px' }}>
                        <iframe
                            src={`https://www.tiktok.com/embed/v2/${media.videoId}`}
                            className="w-full h-full"
                            allowFullScreen
                            allow="encrypted-media"
                            title={title}
                            loading="lazy"
                            // sandbox aísla el iframe y evita que su SDK escriba en el almacenamiento padre
                            sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
                        />
                    </div>
                </div>
            );

        case 'instagram':
            return <InstagramEmbed permalink={media.permalink} />;

        case 'file':
            return (
                <video controls className="w-full rounded-xl bg-black max-h-[600px]">
                    <source src={media.url.startsWith('http') ? media.url : `${BASE_URL}${media.url}`} />
                    Tu navegador no soporta el reproductor de vídeo.
                </video>
            );

        case 'external':
            return (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500">
                    <ExternalLink className="w-10 h-10 text-slate-400" />
                    <a href={media.url} target="_blank" rel="noopener noreferrer"
                        className="text-emerald-600 font-semibold hover:underline break-all text-center">
                        {media.url}
                    </a>
                </div>
            );

        default:
            return null;
    }
};

// ── Subcomponente: reproductor de módulo ─────────────────────────
const ModulePlayer = ({ module, courseContent }) => {
    const videoUrl = module ? module.videoUrl : courseContent?.contentUrl;
    const hasVideo = !!detectMedia(videoUrl);
    const isArticle = !module && (courseContent?.contentType === 'article' || courseContent?.articleContent);

    // Artículo a nivel de curso (sin módulos)
    if (isArticle) {
        return (
            <div className="prose max-w-none text-slate-700 leading-relaxed whitespace-pre-line p-1">
                {courseContent.articleContent || 'Contenido del curso no disponible.'}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Cabecera del módulo */}
            {module && (
                <div>
                    <h3 className="text-xl font-bold text-slate-900">{module.title}</h3>
                    {module.videoDurationMinutes > 0 && (
                        <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatMinutes(module.videoDurationMinutes)}
                        </p>
                    )}
                </div>
            )}

            {/* Reproductor de vídeo / embed */}
            {hasVideo && <VideoPlayer url={videoUrl} title={module?.title || 'Vídeo del curso'} />}

            {/* Texto del módulo */}
            {module?.content && (
                <div className="bg-slate-50 rounded-xl p-5 text-slate-700 leading-relaxed whitespace-pre-line text-sm">
                    {module.content}
                </div>
            )}

            {/* Sin contenido */}
            {!hasVideo && !module?.content && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                    <BookOpen className="w-10 h-10" />
                    <p className="text-sm">
                        {module ? 'Este módulo no tiene contenido multimedia.' : 'El instructor no ha añadido contenido todavía.'}
                    </p>
                </div>
            )}

            {/* Recurso adicional */}
            {module?.resourceUrl && (
                <a
                    href={module.resourceUrl.startsWith('http') ? module.resourceUrl : `${BASE_URL}${module.resourceUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                >
                    <ExternalLink className="w-4 h-4" />
                    Recurso adicional
                </a>
            )}
        </div>
    );
};

// ── Componente principal ─────────────────────────────────────────
const CourseDetailPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const { user, isDoctor, isPatient } = useAuth();
    const ivaRate = useTaxRate();
    const queryClient = useQueryClient();
    const applyIva = isPatient || !user;

    // ── Estado del curso ──
    const [course, setCourse]           = useState(location.state?.course || null);
    const [loading, setLoading]         = useState(!course);
    const [error, setError]             = useState(null);

    // ── Estado de inscripción ──
    const [enrollment, setEnrollment]   = useState(null);
    const [enrolled, setEnrolled]       = useState(false);
    const [enrollLoading, setEnrollLoading] = useState(false);
    const [enrollError, setEnrollError] = useState(null);

    // ── Estado del reproductor ──
    const [courseContent, setCourseContent]   = useState(null);
    const [contentLoading, setContentLoading] = useState(false);
    const [selectedModuleId, setSelectedModuleId] = useState(null);
    const [completedModuleIds, setCompletedModuleIds] = useState(new Set());
    const [savingProgress, setSavingProgress] = useState(false);
    const playerRef = useRef(null);

    // ── Carga inicial del curso ──
    useEffect(() => {
        if (course) return;
        const fetchCourse = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get('/doctor/courses/public/search');
                const found = res.data.find(c => String(c.id) === String(id));
                if (!found) setError('Curso no encontrado.');
                else setCourse(found);
            } catch {
                setError('No se pudo cargar el curso. Inténtalo más tarde.');
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [id]);

    // ── Comprueba inscripción del usuario ──
    useEffect(() => {
        if (!user || !course) return;
        const checkEnrollment = async () => {
            try {
                const res = await api.get(`/courses/${id}/my-enrollment`);
                setEnrollment(res.data);
                setEnrolled(!!res.data);
            } catch {
                setEnrolled(false);
                setEnrollment(null);
            }
        };
        checkEnrollment();
    }, [user, course, id]);

    // ── Carga el contenido cuando el usuario está inscrito ──
    useEffect(() => {
        if (!enrolled || !user) return;
        const fetchContent = async () => {
            setContentLoading(true);
            try {
                const res = await api.get(`/courses/${id}/content`);
                setCourseContent(res.data);
                if (res.data.modules?.length > 0) {
                    setSelectedModuleId(res.data.modules[0].id);
                }
                // Inicializar módulos completados según el progreso guardado
                if (enrollment?.progress > 0 && res.data.modules?.length > 0) {
                    const total   = res.data.modules.length;
                    const doneCount = Math.round((enrollment.progress / 100) * total);
                    const sorted  = [...res.data.modules].sort((a, b) => a.orderIndex - b.orderIndex);
                    const ids = new Set(sorted.slice(0, doneCount).map(m => m.id));
                    setCompletedModuleIds(ids);
                }
            } catch (err) {
                console.error('Error cargando contenido del curso:', err);
            } finally {
                setContentLoading(false);
            }
        };
        fetchContent();
    }, [enrolled, user, id]);

    // ── Actualiza el progreso en backend ──
    const updateProgressOnBackend = useCallback(async (newProgress) => {
        setSavingProgress(true);
        try {
            const res = await api.put(`/courses/${id}/progress`, { progress: newProgress });
            setEnrollment(prev => prev ? { ...prev, progress: res.data.progress, isCompleted: res.data.isCompleted } : prev);
            // Invalida el caché del dashboard del paciente para que la barra se actualice
            queryClient.invalidateQueries({ queryKey: ['patient-courses'] });
        } catch (err) {
            console.error('Error actualizando progreso:', err);
        } finally {
            setSavingProgress(false);
        }
    }, [id, queryClient]);

    // ── Marca un módulo como completado / incompleto ──
    const handleToggleModule = useCallback(async (moduleId) => {
        setCompletedModuleIds(prev => {
            const next = new Set(prev);
            if (next.has(moduleId)) next.delete(moduleId);
            else next.add(moduleId);
            const total    = courseContent?.modules?.length || 1;
            const progress = Math.round((next.size / total) * 100);
            updateProgressOnBackend(progress);
            return next;
        });
    }, [courseContent, updateProgressOnBackend]);

    // ── Matriculación ──
    const handleEnroll = async () => {
        if (!user) return;
        setEnrollLoading(true);
        setEnrollError(null);
        try {
            if ((course?.price ?? 0) > 0) {
                const res = await api.post('/payments/course-checkout', { courseId: Number(id) });
                window.location.href = res.data.url;
            } else {
                await api.post(`/courses/${id}/enroll`);
                setEnrolled(true);
            }
        } catch (err) {
            setEnrollError(err.response?.data?.message || 'No se pudo completar la matriculación.');
        } finally {
            setEnrollLoading(false);
        }
    };

    // ── Estados de carga/error ──
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
                    <Link to="/courses" className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
                        Ver todos los cursos
                    </Link>
                </div>
            </div>
        );
    }

    const doctorName  = `${course.doctor?.firstName ?? ''} ${course.doctor?.lastName ?? ''}`.trim();
    const levelColor  = LEVEL_COLORS[course.level] || 'bg-slate-100 text-slate-600';
    const objectives  = (() => { try { return JSON.parse(course.learningObjectives || '[]'); } catch { return []; } })();
    const prerequisites = (() => { try { return JSON.parse(course.prerequisites || '[]'); } catch { return []; } })();

    const modules      = courseContent?.modules ?? [];
    const totalModules = modules.length;
    const currentProgress = enrollment?.progress ?? 0;
    const selectedModule  = modules.find(m => m.id === selectedModuleId) || modules[0] || null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
            {/* ── Hero ── */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-600 text-white">
                <div className="max-w-6xl mx-auto px-6 py-12">
                    <nav className="flex items-center gap-2 text-emerald-200 text-sm mb-6">
                        <Link to="/courses" className="hover:text-white transition-colors">Cursos</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-white truncate">{course.title}</span>
                    </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                        <div className="lg:col-span-2">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${levelColor}`}>{course.level}</span>
                                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-white">{course.category}</span>
                                {enrolled && (
                                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-400/30 text-emerald-100 flex items-center gap-1">
                                        <CheckCircle className="w-3.5 h-3.5" /> Inscrito
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl font-bold mb-4 leading-tight">{course.title}</h1>
                            <p className="text-emerald-100 text-base leading-relaxed mb-6">{course.description}</p>
                            <div className="flex flex-wrap gap-5 text-sm text-emerald-100">
                                {formatMinutes(course.durationMinutes) && (
                                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {formatMinutes(course.durationMinutes)}</span>
                                )}
                                {course.averageRating > 0 && (
                                    <span className="flex items-center gap-1.5 text-amber-300">
                                        <Star className="w-4 h-4 fill-amber-300" />
                                        {course.averageRating.toFixed(1)}
                                        {course.totalRatings > 0 && <span className="text-emerald-200">({course.totalRatings} reseñas)</span>}
                                    </span>
                                )}
                                {course.totalEnrollments > 0 && (
                                    <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {course.totalEnrollments} alumnos</span>
                                )}
                            </div>
                        </div>
                        <div className="hidden lg:block">
                            {course.coverImageUrl ? (
                                <img src={`${BASE_URL}${course.coverImageUrl}`} alt={course.title} className="w-full h-52 object-cover rounded-2xl shadow-xl" />
                            ) : (
                                <div className="w-full h-52 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <GraduationCap className="w-20 h-20 text-white/40" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Barra de progreso (inscrito) ── */}
            {enrolled && (
                <div className="bg-white border-b border-slate-100 shadow-sm">
                    <div className="max-w-6xl mx-auto px-6 py-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-sm font-semibold text-slate-700">Tu progreso</span>
                                    <span className="text-sm font-bold text-emerald-600">{currentProgress}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2.5">
                                    <div
                                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${currentProgress}%` }}
                                    />
                                </div>
                            </div>
                            {enrollment?.isCompleted && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                                    <Trophy className="w-4 h-4" /> Completado
                                </span>
                            )}
                            {savingProgress && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Reproductor de contenido (solo inscrito) ── */}
            {enrolled && (
                <div ref={playerRef} className="max-w-6xl mx-auto px-6 py-8">
                    {contentLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex items-center gap-3">
                                <Play className="w-5 h-5 text-emerald-400" />
                                <h2 className="text-white font-bold text-lg">Contenido del curso</h2>
                                {totalModules > 0 && (
                                    <span className="ml-auto text-slate-400 text-sm">
                                        {completedModuleIds.size}/{totalModules} módulos completados
                                    </span>
                                )}
                            </div>

                            {totalModules > 0 ? (
                                <div className="flex flex-col lg:flex-row min-h-[480px]">
                                    {/* Sidebar: lista de módulos */}
                                    <div className="lg:w-80 border-r border-slate-100 bg-slate-50 overflow-y-auto">
                                        {modules.map((mod, idx) => {
                                            const isSelected  = mod.id === selectedModuleId;
                                            const isDone      = completedModuleIds.has(mod.id);
                                            return (
                                                <button
                                                    key={mod.id}
                                                    onClick={() => setSelectedModuleId(mod.id)}
                                                    className={`w-full text-left px-4 py-3.5 border-b border-slate-100 flex items-start gap-3 transition-colors hover:bg-emerald-50 ${isSelected ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''}`}
                                                >
                                                    <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${isDone ? 'bg-emerald-500 text-white' : isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-medium leading-snug line-clamp-2 ${isSelected ? 'text-emerald-800' : 'text-slate-700'}`}>
                                                            {mod.title}
                                                        </p>
                                                        {mod.videoDurationMinutes > 0 && (
                                                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" /> {formatMinutes(mod.videoDurationMinutes)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Área de contenido */}
                                    <div className="flex-1 p-6 flex flex-col gap-5 min-w-0">
                                        <ModulePlayer module={selectedModule} courseContent={courseContent} />

                                        {/* Botón marcar como completado */}
                                        {selectedModule && (
                                            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                                                <button
                                                    onClick={() => handleToggleModule(selectedModule.id)}
                                                    disabled={savingProgress}
                                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 ${
                                                        completedModuleIds.has(selectedModule.id)
                                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-sm'
                                                    }`}
                                                >
                                                    {completedModuleIds.has(selectedModule.id)
                                                        ? <><CheckCircle2 className="w-4 h-4" /> Completado</>
                                                        : <><CheckCircle className="w-4 h-4" /> Marcar como completado</>
                                                    }
                                                </button>
                                                {/* Navegación siguiente módulo */}
                                                {(() => {
                                                    const idx  = modules.findIndex(m => m.id === selectedModuleId);
                                                    const next = modules[idx + 1];
                                                    return next ? (
                                                        <button
                                                            onClick={() => setSelectedModuleId(next.id)}
                                                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                                                        >
                                                            Siguiente <ChevronRight className="w-4 h-4" />
                                                        </button>
                                                    ) : null;
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                // Sin módulos: mostrar contenido único del curso
                                <div className="p-6 space-y-5">
                                    <ModulePlayer module={null} courseContent={courseContent} />
                                    {/* Botón marcar todo completado */}
                                    <div className="pt-2 border-t border-slate-100">
                                        <button
                                            onClick={async () => {
                                                const newP = currentProgress >= 100 ? 0 : 100;
                                                setSavingProgress(true);
                                                try {
                                                    const res = await api.put(`/courses/${id}/progress`, { progress: newP });
                                                    setEnrollment(prev => prev ? { ...prev, progress: res.data.progress, isCompleted: res.data.isCompleted } : prev);
                                                    queryClient.invalidateQueries({ queryKey: ['patient-courses'] });
                                                } catch { /* ignore */ } finally { setSavingProgress(false); }
                                            }}
                                            disabled={savingProgress}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 ${
                                                currentProgress >= 100
                                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-sm'
                                            }`}
                                        >
                                            {currentProgress >= 100
                                                ? <><Trophy className="w-4 h-4" /> Curso completado</>
                                                : <><CheckCircle className="w-4 h-4" /> Marcar curso como completado</>
                                            }
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Contenido informativo + tarjeta lateral ── */}
            <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Columna izquierda */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Cover (móvil) */}
                    {course.coverImageUrl && (
                        <div className="lg:hidden">
                            <img src={`${BASE_URL}${course.coverImageUrl}`} alt={course.title} className="w-full h-52 object-cover rounded-2xl shadow-md" />
                        </div>
                    )}

                    {/* Objetivos */}
                    {objectives.length > 0 && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Award className="w-5 h-5 text-emerald-600" /> Lo que aprenderás
                            </h2>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {objectives.map((obj, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /> {obj}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Requisitos previos */}
                    {prerequisites.length > 0 && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-teal-600" /> Requisitos previos
                            </h2>
                            <ul className="space-y-2">
                                {prerequisites.map((req, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                        <ChevronRight className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" /> {req}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Descripción */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h2 className="text-lg font-bold text-slate-900 mb-3">Descripción del curso</h2>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-line">{course.description}</p>
                    </div>
                </div>

                {/* Columna derecha */}
                <div className="space-y-6">
                    {/* Tarjeta de inscripción / progreso */}
                    <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 sticky top-6">
                        {enrolled ? (
                            <>
                                {/* Progreso */}
                                <div className="mb-5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-slate-900">Tu progreso</span>
                                        <span className="text-emerald-600 font-bold text-lg">{currentProgress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-3">
                                        <div
                                            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${currentProgress}%` }}
                                        />
                                    </div>
                                    {enrollment?.isCompleted && (
                                        <p className="text-sm text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                                            <Trophy className="w-4 h-4" /> ¡Curso completado!
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
                                >
                                    <Play className="w-5 h-5" />
                                    {currentProgress > 0 ? 'Continuar curso' : 'Empezar curso'}
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="mb-5">
                                    {course.price === 0 ? (
                                        <p className="text-3xl font-bold text-emerald-600">Gratis</p>
                                    ) : (
                                        <>
                                            <p className="text-3xl font-bold text-emerald-600">
                                                {applyIva ? (course.price * (1 + ivaRate)).toFixed(2) : course.price.toFixed(2)} €
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {applyIva ? `IVA ${(ivaRate * 100).toFixed(0)}% incluido` : 'Exento de IVA'}
                                            </p>
                                        </>
                                    )}
                                </div>

                                {!user ? (
                                    <div className="text-center">
                                        <p className="text-slate-500 text-sm mb-4">Inicia sesión para matricularte en este curso.</p>
                                        <Link to="/login" className="block w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl text-center transition-all shadow-sm">
                                            Iniciar sesión para matricularse
                                        </Link>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleEnroll}
                                            disabled={enrollLoading}
                                            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-60"
                                        >
                                            {enrollLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GraduationCap className="w-5 h-5" />}
                                            {enrollLoading ? 'Redirigiendo a pago...'
                                                : course.price > 0
                                                    ? `Pagar con Stripe — ${applyIva ? (course.price * (1 + ivaRate)).toFixed(2) : course.price.toFixed(2)} €`
                                                    : 'Matricularme gratis'}
                                        </button>
                                        {enrollError && (
                                            <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {enrollError}
                                            </p>
                                        )}
                                    </>
                                )}
                            </>
                        )}

                        <hr className="my-5 border-slate-100" />

                        {/* Meta del curso */}
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
                            {totalModules > 0 && (
                                <li className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                    <span><strong className="text-slate-800">{totalModules}</strong> módulo{totalModules !== 1 ? 's' : ''}</span>
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

                    {/* Tarjeta del doctor */}
                    {doctorName && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Impartido por</h3>
                            <div className="flex items-center gap-3">
                                {course.doctor?.profilePictureUrl ? (
                                    <img src={`${BASE_URL}${course.doctor.profilePictureUrl}`} alt={doctorName} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-lg font-bold text-emerald-600">{course.doctor?.firstName?.[0] ?? '?'}</span>
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
