// ═══════════════════════════════════════════════════════════════
// ProfessionalsPage.jsx - Buscador de profesionales con videos
// ✅ Muestra profesionales activos
// ✅ Muestra videos publicados de cada profesional
// ✅ Filtros avanzados
// ═══════════════════════════════════════════════════════════════

import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import professionalsService from '../services/professionalsService';
import chatService from '../services/chatService';
import { useAuth } from '../context/AuthContext';
import {
    Search, Star, Clock, Stethoscope,
    SlidersHorizontal, X, ChevronDown, Play,
    TrendingUp, Users, Video as VideoIcon, ExternalLink,
    Briefcase, Calendar, MessageCircle
} from 'lucide-react';
import ContratarModal from '../components/ContratarModal';
import BookingModal from '../components/BookingModal';
import { useTaxRate } from '../hooks/useTaxRate';

// ═══════════════════════════════════════════════════════════════
// OPCIONES DE FILTROS
// ═══════════════════════════════════════════════════════════════

const SORT_OPTIONS = [
    { value: 'rating', label: 'Mejor valorados' },
    { value: 'price_asc', label: 'Precio: menor a mayor' },
    { value: 'price_desc', label: 'Precio: mayor a menor' },
    { value: 'experience', label: 'Más experiencia' },
    { value: 'content', label: 'Más contenido' }, // ✅ NUEVO: ordenar por videos
];

const RATING_OPTIONS = [
    { value: '', label: 'Cualquier valoración' },
    { value: '4', label: '4★ o más' },
    { value: '3', label: '3★ o más' },
];

const MAX_PRICE_OPTIONS = [
    { value: '', label: 'Cualquier precio' },
    { value: '30', label: 'Hasta 30 €' },
    { value: '60', label: 'Hasta 60 €' },
    { value: '100', label: 'Hasta 100 €' },
];

// ═══════════════════════════════════════════════════════════════
// COMPONENTE: Tarjeta de Profesional con Videos
// ═══════════════════════════════════════════════════════════════

const ProfessionalCard = ({ professional }) => {
    const fullName = `${professional.firstName} ${professional.lastName}`;
    const avatarUrl = professional.profilePictureUrl
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=3b82f6&color=fff&size=200&bold=true`;

    const { isAuthenticated, user } = useAuth();
    const isDoctor = user?.role === 'Doctor';
    const ivaRate  = useTaxRate();
    const priceFinal = (professional.pricePerSession ?? 0) * (1 + ivaRate);
    const [showContratar, setShowContratar] = useState(false);
    const [showBooking, setShowBooking] = useState(false);

    // Comprobar suscripción Premium activa con este profesional
    const { data: chatSub } = useQuery({
        queryKey: ['chat-sub-doctor', professional.id],
        queryFn: () => chatService.getSubscriptionWithDoctor(professional.id),
        enabled: isAuthenticated,
        retry: false,
        // 404 = sin suscripción, no es un error real
        throwOnError: false,
    });

    const hasPremium = chatSub && chatSub.status === 'Active';

    // ✅ NUEVO: Obtener videos del profesional
    const { data: videos = [] } = useQuery({
        queryKey: ['professional-videos', professional.id],
        queryFn: () => professionalsService.getVideos(professional.id),
        enabled: !!professional.id,
    });

    // ✅ NUEVO: Obtener redes sociales del profesional (solo si tiene videos)
    const { data: socialAccounts = [] } = useQuery({
        queryKey: ['professional-social', professional.id],
        queryFn: () => professionalsService.getSocialMedia(professional.id),
        enabled: videos.length > 0,
        staleTime: 5 * 60 * 1000,
    });

    // Cuentas cuya plataforma aparece en al menos uno de los videos del doctor
    const videoPlatforms = new Set(videos.map(v => (v.platform || '').toLowerCase()));
    const relevantAccounts = socialAccounts.filter(
        a => videoPlatforms.has((a.platform || '').toLowerCase())
    );

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all">
            {/* Header con info básica */}
            <div className="p-6">
                <Link
                    to={`/professionals/${professional.id}`}
                    className="flex gap-5 group"
                >
                    {/* Avatar */}
                    <img
                        src={avatarUrl}
                        alt={fullName}
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-100 flex-shrink-0 group-hover:border-primary-300 transition-colors"
                        onError={(e) => {
                            const initials = `${professional.firstName?.charAt(0)}${professional.lastName?.charAt(0)}`;
                            e.target.src = `https://ui-avatars.com/api/?name=${initials}&background=3b82f6&color=fff&size=200&bold=true`;
                        }}
                    />

                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                {/* Nombre */}
                                <h3 className="font-semibold text-gray-900 text-lg group-hover:text-primary-600 transition-colors truncate">
                                    {fullName}
                                </h3>

                                {/* Especialidades */}
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {professional.specialties?.slice(0, 3).map((s) => (
                                        <span
                                            key={s.id}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full"
                                        >
                                            <Stethoscope className="w-3 h-3" />
                                            {s.name}
                                        </span>
                                    ))}
                                    {professional.specialties?.length > 3 && (
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                                            +{professional.specialties.length - 3} más
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Precio */}
                            <div className="text-right flex-shrink-0">
                                <p className="font-bold text-primary-600 text-xl">
                                    {priceFinal.toFixed(2)} €
                                </p>
                                <p className="text-xs text-gray-400">IVA incluido · por sesión</p>
                            </div>
                        </div>

                        {/* Descripción */}
                        {professional.description && (
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                {professional.description}
                            </p>
                        )}

                        {/* Metadatos */}
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                            <span className="flex items-center gap-1 text-gray-600">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="font-semibold text-gray-800">
                                    {professional.averageRating?.toFixed(1) ?? '—'}
                                </span>
                                <span className="text-gray-400">
                                    ({professional.totalReviews ?? 0})
                                </span>
                            </span>
                            {professional.yearsOfExperience > 0 && (
                                <span className="flex items-center gap-1 text-gray-500">
                                    <Clock className="w-4 h-4" />
                                    {professional.yearsOfExperience} años exp.
                                </span>
                            )}
                            {/* Contador de videos */}
                            {videos.length > 0 && (
                                <span className="flex items-center gap-1 text-purple-600 font-medium">
                                    <VideoIcon className="w-4 h-4" />
                                    {videos.length} {videos.length === 1 ? 'video' : 'videos'}
                                </span>
                            )}
                        </div>
                    </div>
                </Link>

                {/* BOTONES — ocultos para profesionales (solo pacientes pueden contratar) */}
                {!isDoctor && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        {hasPremium ? (
                            /* Ya tiene Premium activo: Reservar + Chat */
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowBooking(true)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm"
                                >
                                    <Calendar className="w-4 h-4" />
                                    Reservar cita
                                </button>
                                <Link
                                    to={`/chat/${chatSub.id}`}
                                    className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Abrir chat
                                </Link>
                            </div>
                        ) : (
                            /* Sin Premium: botón Contratar que abre el modal */
                            <button
                                onClick={() => setShowContratar(true)}
                                className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
                            >
                                <Briefcase className="w-4 h-4" />
                                Contratar
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Contratar: Gratis / Premium */}
            {showContratar && (
                <ContratarModal
                    professional={professional}
                    onClose={() => setShowContratar(false)}
                />
            )}

            {/* Modal Reservar (acceso directo desde botón Premium) */}
            {showBooking && (
                <BookingModal
                    professional={professional}
                    onClose={() => setShowBooking(false)}
                />
            )}

            {/* ✅ NUEVA SECCIÓN: Videos del profesional */}
            {videos.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <VideoIcon className="w-4 h-4 text-gray-600" />
                            <h4 className="font-semibold text-gray-900 text-sm">Contenido educativo</h4>
                        </div>
                        {/* Cuentas de redes sociales relevantes */}
                        {relevantAccounts.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                {relevantAccounts.map(account => {
                                    const style = PLATFORM_STYLES[(account.platform || '').toLowerCase()] || PLATFORM_STYLES.unknown;
                                    const href = account.profileUrl?.startsWith('http')
                                        ? account.profileUrl
                                        : `https://${account.profileUrl}`;
                                    return (
                                        <a
                                            key={account.id}
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={e => e.stopPropagation()}
                                            title={`Ver perfil de ${account.platform}`}
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white ${style.bg}`}
                                        >
                                            <span>{style.emoji}</span>
                                            <span>{style.label}</span>
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {videos.slice(0, 3).map((video) => (
                            <VideoPlayer key={video.id} video={video} />
                        ))}
                    </div>

                    {videos.length > 3 && (
                        <Link
                            to={`/professionals/${professional.id}#videos`}
                            className="block text-center mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Ver todos los videos ({videos.length})
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTE: Reproductor de Video con embed real
// ═══════════════════════════════════════════════════════════════

/**
 * Extrae URL de embed e imagen de miniatura según plataforma.
 * Devuelve { canEmbed, embedUrl, thumbnail, platform }
 */
const parseVideoMeta = (video) => {
    const url = video.videoUrl || '';
    const platform = (video.platform || '').toLowerCase();

    // ── YouTube ──────────────────────────────────────────────
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
                canEmbed: true,
                platform: 'youtube',
                embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
                thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            };
        } catch { /* invalid URL */ }
    }

    // ── TikTok ────────────────────────────────────────────────
    if (platform === 'tiktok' || url.includes('tiktok.com')) {
        const match = url.match(/\/video\/(\d+)/);
        if (match) return {
            canEmbed: true,
            platform: 'tiktok',
            embedUrl: `https://www.tiktok.com/embed/v2/${match[1]}`,
            thumbnail: null,
        };
        return { canEmbed: false, platform: 'tiktok', embedUrl: null, thumbnail: null };
    }

    // ── Vimeo ─────────────────────────────────────────────────
    if (platform === 'vimeo' || url.includes('vimeo.com')) {
        const match = url.match(/vimeo\.com\/(\d+)/);
        if (match) return {
            canEmbed: true,
            platform: 'vimeo',
            embedUrl: `https://player.vimeo.com/video/${match[1]}?autoplay=1&title=0&byline=0`,
            thumbnail: `https://vumbnail.com/${match[1]}.jpg`,
        };
    }

    // ── Instagram ─────────────────────────────────────────────
    if (platform === 'instagram' || url.includes('instagram.com')) {
        return { canEmbed: false, platform: 'instagram', embedUrl: null, thumbnail: null };
    }

    // ── Facebook ──────────────────────────────────────────────
    if (platform === 'facebook' || url.includes('facebook.com')) {
        return { canEmbed: false, platform: 'facebook', embedUrl: null, thumbnail: null };
    }

    return { canEmbed: false, platform: 'unknown', embedUrl: null, thumbnail: null };
};

const PLATFORM_STYLES = {
    youtube:   { bg: 'bg-red-600',    label: 'YouTube',   emoji: '▶️' },
    tiktok:    { bg: 'bg-black',      label: 'TikTok',    emoji: '🎵' },
    vimeo:     { bg: 'bg-cyan-600',   label: 'Vimeo',     emoji: '🎬' },
    instagram: { bg: 'bg-gradient-to-br from-purple-600 to-pink-500', label: 'Instagram', emoji: '📷' },
    facebook:  { bg: 'bg-blue-700',   label: 'Facebook',  emoji: '👤' },
    unknown:   { bg: 'bg-slate-600',  label: 'Video',     emoji: '🎥' },
};

const VideoPlayer = ({ video }) => {
    const [playing, setPlaying] = useState(false);
    const meta = parseVideoMeta(video);
    const style = PLATFORM_STYLES[meta.platform] || PLATFORM_STYLES.unknown;

    // Plataformas sin embed directo: abrir en nueva pestaña
    if (!meta.canEmbed) {
        return (
            <a
                href={video.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative group block aspect-video rounded-lg overflow-hidden"
            >
                {/* Fondo de color de plataforma */}
                <div className={`absolute inset-0 ${style.bg} flex flex-col items-center justify-center gap-2`}>
                    <span className="text-3xl">{style.emoji}</span>
                    <span className="text-white text-xs font-semibold">{style.label}</span>
                </div>
                {/* Overlay hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Abrir en {style.label}
                    </div>
                </div>
                {/* Título */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-xs font-medium line-clamp-2">{video.title}</p>
                </div>
            </a>
        );
    }

    // Plataformas con embed: thumbnail → iframe al hacer clic
    if (playing) {
        return (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                    src={meta.embedUrl}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                    loading="lazy"
                />
            </div>
        );
    }

    // Thumbnail estático con botón play
    return (
        <button
            onClick={() => setPlaying(true)}
            className="relative group block aspect-video w-full rounded-lg overflow-hidden bg-gray-200 cursor-pointer"
            title={`Reproducir: ${video.title}`}
        >
            {meta.thumbnail ? (
                <img
                    src={meta.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
            ) : (
                <div className={`absolute inset-0 ${style.bg} flex items-center justify-center`}>
                    <span className="text-4xl">{style.emoji}</span>
                </div>
            )}

            {/* Play overlay */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition-all flex items-center justify-center shadow-lg">
                    <Play className="w-5 h-5 text-gray-900 ml-1" />
                </div>
            </div>

            {/* Badge de plataforma */}
            <div className="absolute top-2 left-2">
                <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${
                    meta.platform === 'youtube' ? 'bg-red-600' :
                    meta.platform === 'tiktok' ? 'bg-black' :
                    meta.platform === 'vimeo' ? 'bg-cyan-600' : 'bg-slate-600'
                }`}>
                    {style.label}
                </span>
            </div>

            {/* Título */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-white text-xs font-medium line-clamp-2">{video.title}</p>
            </div>
        </button>
    );
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTE: Skeleton de carga
// ═══════════════════════════════════════════════════════════════

const SkeletonCard = () => (
    <div className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
        <div className="flex gap-5">
            <div className="w-20 h-20 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-48" />
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
        </div>
    </div>
);

// ═══════════════════════════════════════════════════════════════
// COMPONENTE: Select con chevron
// ═══════════════════════════════════════════════════════════════

const FilterSelect = ({ label, value, onChange, options }) => (
    <div className="relative">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="appearance-none w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 pr-9 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
);

// ═══════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════

const ProfessionalsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [showFilters, setShowFilters] = useState(false);

    // Estado de filtros
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        specialty: searchParams.get('specialty') || '',
        minRating: searchParams.get('minRating') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        sortBy: searchParams.get('sortBy') || 'rating',
    });

    const [searchInput, setSearchInput] = useState(filters.search);

    // Actualizar filtro
    const updateFilter = useCallback((key, value) => {
        const next = { ...filters, [key]: value };
        setFilters(next);

        const params = {};
        Object.entries(next).forEach(([k, v]) => { if (v) params[k] = v; });
        setSearchParams(params, { replace: true });
    }, [filters, setSearchParams]);

    // Limpiar filtros
    const clearFilters = () => {
        const reset = { search: '', specialty: '', minRating: '', maxPrice: '', sortBy: 'rating' };
        setFilters(reset);
        setSearchInput('');
        setSearchParams({}, { replace: true });
    };

    const hasActiveFilters = filters.search || filters.specialty || filters.minRating || filters.maxPrice;

    // Query de especialidades
    const { data: specialties = [] } = useQuery({
        queryKey: ['specialties'],
        queryFn: professionalsService.getSpecialties,
        staleTime: 10 * 60 * 1000,
    });

    // Query de profesionales
    const { data: professionals = [], isLoading, isError } = useQuery({
        queryKey: ['professionals', filters],
        queryFn: () => professionalsService.search(filters),
        keepPreviousData: true,
    });

    const specialtyOptions = [
        { value: '', label: 'Todas las especialidades' },
        ...specialties.map((s) => ({ value: s.name, label: s.name })),
    ];

    return (
        <div className="container-custom py-8">
            {/* Cabecera */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Profesionales de Salud</h1>
                <p className="text-gray-500">
                    Encuentra profesionales verificados con contenido educativo de calidad.
                </p>
            </div>

            {/* Barra de búsqueda */}
            <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, especialidad o descripción…"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') updateFilter('search', searchInput.trim());
                        }}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
                    />
                    {searchInput && (
                        <button
                            onClick={() => { setSearchInput(''); updateFilter('search', ''); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <button
                    onClick={() => updateFilter('search', searchInput.trim())}
                    className="btn-primary px-8"
                >
                    Buscar
                </button>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`btn-secondary px-4 ${showFilters ? 'bg-primary-50 border-primary-300 text-primary-700' : ''}`}
                >
                    <SlidersHorizontal className="w-5 h-5" />
                </button>
            </div>

            {/* Panel de filtros */}
            {showFilters && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Especialidad
                            </label>
                            <FilterSelect
                                value={filters.specialty}
                                onChange={(v) => updateFilter('specialty', v)}
                                options={specialtyOptions}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Valoración mínima
                            </label>
                            <FilterSelect
                                value={filters.minRating}
                                onChange={(v) => updateFilter('minRating', v)}
                                options={RATING_OPTIONS}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Precio máximo
                            </label>
                            <FilterSelect
                                value={filters.maxPrice}
                                onChange={(v) => updateFilter('maxPrice', v)}
                                options={MAX_PRICE_OPTIONS}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ordenar por
                            </label>
                            <FilterSelect
                                value={filters.sortBy}
                                onChange={(v) => updateFilter('sortBy', v)}
                                options={SORT_OPTIONS}
                            />
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <button
                                onClick={clearFilters}
                                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                            >
                                <X className="w-4 h-4" />
                                Limpiar filtros
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Resultados */}
            <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
                <p>
                    {isLoading ? 'Buscando...' : `${professionals.length} profesionales encontrados`}
                </p>
            </div>

            {/* Grid de profesionales */}
            {isLoading ? (
                <div className="grid grid-cols-1 gap-6">
                    {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
                </div>
            ) : isError ? (
                <div className="text-center py-12">
                    <p className="text-red-600">Error al cargar profesionales</p>
                </div>
            ) : professionals.length === 0 ? (
                <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium mb-2">No se encontraron profesionales</p>
                    <p className="text-gray-500 text-sm">Intenta ajustar los filtros de búsqueda</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {professionals.map((prof) => (
                        <ProfessionalCard key={prof.id} professional={prof} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProfessionalsPage;