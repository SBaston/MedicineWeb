// ═══════════════════════════════════════════════════════════════
// ProfessionalDetailPage.jsx
// Perfil público completo de un profesional
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import professionalsService from '../services/professionalsService';
import chatService from '../services/chatService';
import reviewService from '../services/reviewService';
import { useTaxRate } from '../hooks/useTaxRate';
import ContratarModal from '../components/ContratarModal';
import BookingModal from '../components/BookingModal';
import {
    ArrowLeft, Star, Clock, Stethoscope, Briefcase,
    Calendar, MessageCircle, MapPin, Phone, Mail,
    Play, ExternalLink, Video as VideoIcon, User,
    ChevronRight, AlertCircle, PenLine, CheckCircle, X
} from 'lucide-react';

// ── Helpers de video (igual que en ProfessionalPage) ────────────
const parseVideoMeta = (video) => {
    const url = video.videoUrl || '';
    const platform = (video.platform || '').toLowerCase();

    if (platform === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
        try {
            let videoId;
            if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1]?.split(/[?&#]/)[0];
            } else if (url.includes('/shorts/')) {
                videoId = url.split('/shorts/')[1]?.split(/[?&#]/)[0];
            } else {
                videoId = new URL(url).searchParams.get('v');
            }
            if (videoId) return {
                canEmbed: true, platform: 'youtube',
                embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
                thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            };
        } catch { /* invalid URL */ }
    }
    if (platform === 'tiktok' || url.includes('tiktok.com')) {
        const match = url.match(/\/video\/(\d+)/);
        if (match) return { canEmbed: true, platform: 'tiktok', embedUrl: `https://www.tiktok.com/embed/v2/${match[1]}`, thumbnail: null };
        return { canEmbed: false, platform: 'tiktok', embedUrl: null, thumbnail: null };
    }
    if (platform === 'vimeo' || url.includes('vimeo.com')) {
        const match = url.match(/vimeo\.com\/(\d+)/);
        if (match) return { canEmbed: true, platform: 'vimeo', embedUrl: `https://player.vimeo.com/video/${match[1]}?autoplay=1&title=0&byline=0`, thumbnail: `https://vumbnail.com/${match[1]}.jpg` };
    }
    return { canEmbed: false, platform: 'unknown', embedUrl: null, thumbnail: null };
};

const PLATFORM_STYLES = {
    youtube:   { bg: 'bg-red-600',   label: 'YouTube',   emoji: '▶️' },
    tiktok:    { bg: 'bg-black',     label: 'TikTok',    emoji: '🎵' },
    vimeo:     { bg: 'bg-cyan-600',  label: 'Vimeo',     emoji: '🎬' },
    instagram: { bg: 'bg-pink-600',  label: 'Instagram', emoji: '📷' },
    facebook:  { bg: 'bg-blue-700',  label: 'Facebook',  emoji: '👤' },
    unknown:   { bg: 'bg-slate-600', label: 'Video',     emoji: '🎥' },
};

const VideoCard = ({ video }) => {
    const [playing, setPlaying] = useState(false);
    const meta = parseVideoMeta(video);
    const style = PLATFORM_STYLES[meta.platform] || PLATFORM_STYLES.unknown;

    if (!meta.canEmbed) {
        return (
            <a href={video.videoUrl} target="_blank" rel="noopener noreferrer"
                className="relative group block aspect-video rounded-xl overflow-hidden">
                <div className={`absolute inset-0 ${style.bg} flex flex-col items-center justify-center gap-2`}>
                    <span className="text-4xl">{style.emoji}</span>
                    <span className="text-white text-sm font-semibold">{style.label}</span>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                        <ExternalLink className="w-3.5 h-3.5" /> Abrir en {style.label}
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="text-white text-sm font-medium line-clamp-2">{video.title}</p>
                </div>
            </a>
        );
    }

    if (playing) {
        return (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                <iframe src={meta.embedUrl} title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen className="absolute inset-0 w-full h-full" loading="lazy" />
            </div>
        );
    }

    return (
        <button onClick={() => setPlaying(true)}
            className="relative group block aspect-video rounded-xl overflow-hidden w-full text-left">
            {meta.thumbnail
                ? <img src={meta.thumbnail} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
                : <div className={`absolute inset-0 ${style.bg} flex items-center justify-center`}>
                    <span className="text-4xl">{style.emoji}</span>
                  </div>
            }
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Play className="w-6 h-6 text-gray-900 ml-1" />
                </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <p className="text-white text-sm font-medium line-clamp-2">{video.title}</p>
            </div>
            <div className={`absolute top-2 right-2 ${style.bg} text-white text-xs font-semibold px-2 py-0.5 rounded-full`}>
                {style.label}
            </div>
        </button>
    );
};

// ── Componente de formulario de reseña ──────────────────────────
const WriteReviewForm = ({ doctorId, eligibleAppointments, onSuccess, onCancel }) => {
    const [selectedAppointment, setSelectedAppointment] = useState(
        eligibleAppointments[0]?.id ?? null
    );
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');

    const mutation = useMutation({
        mutationFn: () => reviewService.createReview({
            doctorId: Number(doctorId),
            appointmentId: selectedAppointment,
            rating,
            comment: comment.trim() || undefined,
        }),
        onSuccess,
    });

    return (
        <div className="border border-primary-100 bg-primary-50/40 rounded-xl p-5 mt-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <PenLine className="w-4 h-4 text-primary-500" />
                Escribe tu opinión
            </h3>

            {/* Seleccionar cita */}
            {eligibleAppointments.length > 1 && (
                <div className="mb-4">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Cita a valorar</label>
                    <select
                        value={selectedAppointment ?? ''}
                        onChange={e => setSelectedAppointment(Number(e.target.value))}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
                    >
                        {eligibleAppointments.map(a => (
                            <option key={a.id} value={a.id}>
                                {new Date(a.appointmentDate).toLocaleDateString('es-ES', {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                })}
                                {a.reason ? ` — ${a.reason}` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Estrellas */}
            <div className="mb-4">
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Valoración *</label>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                        <button
                            key={n}
                            type="button"
                            onClick={() => setRating(n)}
                            onMouseEnter={() => setHoverRating(n)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="transition-transform hover:scale-110"
                        >
                            <Star className={`w-8 h-8 transition-colors ${
                                n <= (hoverRating || rating)
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-200 fill-gray-200'
                            }`} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Comentario */}
            <div className="mb-4">
                <label className="text-xs font-medium text-gray-500 block mb-1">
                    Comentario <span className="text-gray-400">(opcional)</span>
                </label>
                <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="Cuéntanos cómo fue tu experiencia…"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
                <p className="text-xs text-gray-400 text-right mt-0.5">{comment.length}/1000</p>
            </div>

            {mutation.isError && (
                <p className="text-sm text-red-500 mb-3">
                    {mutation.error?.response?.data?.message ?? 'Error al enviar la reseña.'}
                </p>
            )}

            <div className="flex gap-2 justify-end">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg transition-colors"
                >
                    <X className="w-3.5 h-3.5" /> Cancelar
                </button>
                <button
                    type="button"
                    onClick={() => mutation.mutate()}
                    disabled={!rating || mutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                    {mutation.isPending ? 'Enviando…' : 'Publicar opinión'}
                </button>
            </div>
        </div>
    );
};

// ── Componente principal ─────────────────────────────────────────
const ProfessionalDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const isDoctor = user?.role === 'Doctor';
    const isPatient = user?.role === 'Patient';

    const [showContratar, setShowContratar] = useState(false);
    const [showBooking, setShowBooking] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewSubmitted, setReviewSubmitted] = useState(false);
    const queryClient = useQueryClient();
    const ivaRate = useTaxRate();

    // Datos del profesional
    const { data: professional, isLoading, isError } = useQuery({
        queryKey: ['professional-detail', id],
        queryFn: () => professionalsService.getById(id),
        enabled: !!id,
    });

    // Videos
    const { data: videos = [] } = useQuery({
        queryKey: ['professional-videos', id],
        queryFn: () => professionalsService.getVideos(id),
        enabled: !!id,
    });

    // Reviews
    const { data: reviews = [] } = useQuery({
        queryKey: ['professional-reviews', id],
        queryFn: () => professionalsService.getReviews(id),
        enabled: !!id,
    });

    // Citas completadas elegibles para reseña (solo pacientes autenticados)
    const { data: eligibleAppointments = [] } = useQuery({
        queryKey: ['reviews-eligible', id],
        queryFn: () => reviewService.getEligibleAppointments(Number(id)),
        enabled: isAuthenticated && isPatient && !!id,
        retry: false,
    });

    // Suscripción premium activa con este profesional
    const { data: chatSub } = useQuery({
        queryKey: ['chat-sub-doctor', id],
        queryFn: () => chatService.getSubscriptionWithDoctor(Number(id)),
        enabled: isAuthenticated,
        retry: false,
        throwOnError: false,
    });

    const hasPremium = chatSub?.status === 'Active';

    // ── Estados de carga / error ──────────────────────────────────
    if (isLoading) {
        return (
            <div className="container-custom py-16 text-center">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Cargando perfil…</p>
            </div>
        );
    }

    if (isError || !professional) {
        return (
            <div className="container-custom py-16 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Profesional no encontrado</h2>
                <p className="text-gray-500 mb-6">Es posible que el perfil ya no esté disponible.</p>
                <Link to="/professionals" className="btn-primary px-6 py-2.5">
                    Volver al buscador
                </Link>
            </div>
        );
    }

    const fullName = `${professional.firstName} ${professional.lastName}`;
    const avatarUrl = professional.profilePictureUrl
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=3b82f6&color=fff&size=200&bold=true`;

    return (
        <div className="container-custom py-8 max-w-5xl">

            {/* Breadcrumb */}
            <button onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Volver
            </button>

            {/* ── Hero: avatar + info principal ───────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-6">
                    <img src={avatarUrl} alt={fullName}
                        className="w-28 h-28 rounded-full object-cover border-4 border-gray-100 flex-shrink-0 mx-auto sm:mx-0" />

                    <div className="flex-1 min-w-0 text-center sm:text-left">
                        <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>

                        {/* Especialidades */}
                        <div className="flex flex-wrap gap-1.5 mt-2 justify-center sm:justify-start">
                            {professional.specialties?.map(s => (
                                <span key={s.id}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
                                    <Stethoscope className="w-3 h-3" /> {s.name}
                                </span>
                            ))}
                        </div>

                        {/* Métricas */}
                        <div className="flex flex-wrap items-center gap-5 mt-3 justify-center sm:justify-start text-sm">
                            <span className="flex items-center gap-1.5 text-gray-700">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="font-semibold">{professional.averageRating?.toFixed(1) ?? '—'}</span>
                                <span className="text-gray-400">({professional.totalReviews ?? 0} opiniones)</span>
                            </span>
                            {professional.yearsOfExperience > 0 && (
                                <span className="flex items-center gap-1.5 text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    {professional.yearsOfExperience} años de experiencia
                                </span>
                            )}
                            {videos.length > 0 && (
                                <span className="flex items-center gap-1.5 text-purple-600 font-medium">
                                    <VideoIcon className="w-4 h-4" />
                                    {videos.length} {videos.length === 1 ? 'vídeo' : 'vídeos'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Precio + Botones */}
                    <div className="flex flex-col items-center sm:items-end gap-3 flex-shrink-0">
                        <div className="text-center sm:text-right">
                            <p className="text-3xl font-bold text-primary-600">
                                {((professional.pricePerSession ?? 0) * (1 + ivaRate)).toFixed(2)} €
                            </p>
                            <p className="text-xs text-gray-400">IVA incluido · por sesión</p>
                        </div>

                        {!isDoctor && (
                            <>
                                {hasPremium ? (
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button onClick={() => setShowBooking(true)}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm">
                                            <Calendar className="w-4 h-4" /> Reservar cita
                                        </button>
                                        <Link to={`/chat/${chatSub.id}`}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm">
                                            <MessageCircle className="w-4 h-4" /> Chat Premium
                                        </Link>
                                    </div>
                                ) : (
                                    <button onClick={() => setShowContratar(true)}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors">
                                        <Briefcase className="w-4 h-4" /> Contratar
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Descripción */}
                {professional.description && (
                    <p className="mt-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-5">
                        {professional.description}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Columna principal ────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Vídeos */}
                    {videos.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                                <VideoIcon className="w-5 h-5 text-purple-500" />
                                Contenido educativo
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {videos.map(v => <VideoCard key={v.id} video={v} />)}
                            </div>
                        </div>
                    )}

                    {/* Opiniones */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                Opiniones
                                <span className="ml-1 text-sm font-normal text-gray-400">({reviews.length})</span>
                            </h2>

                            {/* Botón "Escribir opinión" — solo pacientes con citas elegibles */}
                            {isPatient && !showReviewForm && !reviewSubmitted && eligibleAppointments.length > 0 && (
                                <button
                                    onClick={() => setShowReviewForm(true)}
                                    className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 border border-primary-200 hover:border-primary-300 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <PenLine className="w-3.5 h-3.5" /> Escribir opinión
                                </button>
                            )}
                        </div>

                        {/* Confirmación tras enviar */}
                        {reviewSubmitted && (
                            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
                                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                ¡Gracias por tu opinión! Ya está publicada.
                            </div>
                        )}

                        {/* Formulario inline */}
                        {showReviewForm && eligibleAppointments.length > 0 && (
                            <WriteReviewForm
                                doctorId={id}
                                eligibleAppointments={eligibleAppointments}
                                onCancel={() => setShowReviewForm(false)}
                                onSuccess={() => {
                                    setShowReviewForm(false);
                                    setReviewSubmitted(true);
                                    queryClient.invalidateQueries({ queryKey: ['professional-reviews', id] });
                                    queryClient.invalidateQueries({ queryKey: ['reviews-eligible', id] });
                                    queryClient.invalidateQueries({ queryKey: ['professional-detail', id] });
                                }}
                            />
                        )}

                        {reviews.length === 0 && !showReviewForm ? (
                            <p className="text-gray-400 text-sm italic text-center py-6">
                                Este profesional aún no tiene opiniones.
                            </p>
                        ) : (
                            <div className="space-y-4 mt-2">
                                {reviews.map((r, i) => (
                                    <div key={r.id ?? i} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <div className="flex items-center gap-2">
                                                <div className="flex">
                                                    {[1, 2, 3, 4, 5].map(n => (
                                                        <Star key={n}
                                                            className={`w-3.5 h-3.5 ${n <= (r.rating ?? r.score ?? 0)
                                                                ? 'text-yellow-400 fill-yellow-400'
                                                                : 'text-gray-200 fill-gray-200'}`} />
                                                    ))}
                                                </div>
                                                <span className="text-xs font-medium text-gray-700">
                                                    {r.patientName ?? r.reviewerName ?? 'Paciente'}
                                                </span>
                                                {r.isVerified && (
                                                    <span className="text-xs text-green-600 font-medium flex items-center gap-0.5">
                                                        <CheckCircle className="w-3 h-3" /> Verificada
                                                    </span>
                                                )}
                                            </div>
                                            {r.createdAt && (
                                                <span className="text-xs text-gray-400 flex-shrink-0">
                                                    {new Date(r.createdAt).toLocaleDateString('es-ES', {
                                                        day: 'numeric', month: 'short', year: 'numeric'
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                        {r.comment && (
                                            <p className="text-sm text-gray-600 mt-1">{r.comment}</p>
                                        )}
                                        {r.doctorResponse && (
                                            <div className="mt-2 ml-4 pl-3 border-l-2 border-primary-200">
                                                <p className="text-xs font-semibold text-primary-700 mb-0.5">Respuesta del profesional</p>
                                                <p className="text-xs text-gray-600">{r.doctorResponse}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Sidebar ──────────────────────────────────────── */}
                <div className="space-y-4">

                    {/* Tarjeta de contacto */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" /> Información
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            {professional.email && (
                                <li className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">{professional.email}</span>
                                </li>
                            )}
                            {professional.phoneNumber && (
                                <li className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    {professional.phoneNumber}
                                </li>
                            )}
                            <li className="flex items-center gap-2">
                                <Stethoscope className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                {professional.isAcceptingPatients
                                    ? <span className="text-green-600 font-medium">Acepta nuevos pacientes</span>
                                    : <span className="text-red-500">No acepta nuevos pacientes</span>
                                }
                            </li>
                        </ul>
                    </div>

                    {/* Redes sociales */}
                    {professional.socialMedia?.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h3 className="font-semibold text-gray-900 mb-3">Redes sociales</h3>
                            <ul className="space-y-2">
                                {professional.socialMedia.filter(s => s.isActive).map((s, i) => {
                                    const style = PLATFORM_STYLES[(s.platform || '').toLowerCase()] || PLATFORM_STYLES.unknown;
                                    const href = s.profileUrl?.startsWith('http') ? s.profileUrl : `https://${s.profileUrl}`;
                                    return (
                                        <li key={i}>
                                            <a href={href} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">
                                                <span className={`w-6 h-6 rounded-full ${style.bg} flex items-center justify-center text-xs`}>
                                                    {style.emoji}
                                                </span>
                                                {s.platform}
                                                {s.followerCount > 0 && (
                                                    <span className="text-xs text-gray-400 ml-auto">
                                                        {s.followerCount.toLocaleString('es-ES')} seguidores
                                                    </span>
                                                )}
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {/* CTA para no-doctores en sidebar */}
                    {!isDoctor && !hasPremium && (
                        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5">
                            <MessageCircle className="w-8 h-8 text-violet-500 mb-2" />
                            <h3 className="font-semibold text-gray-900 mb-1">Chat Premium</h3>
                            <p className="text-sm text-gray-500 mb-3">
                                Consultas directas con el profesional sin esperar cita.
                            </p>
                            <button onClick={() => setShowContratar(true)}
                                className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors">
                                Ver planes
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modales */}
            {showContratar && (
                <ContratarModal professional={professional} onClose={() => setShowContratar(false)} />
            )}
            {showBooking && (
                <BookingModal professional={professional} onClose={() => setShowBooking(false)} />
            )}
        </div>
    );
};

export default ProfessionalDetailPage;
