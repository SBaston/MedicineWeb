// ═══════════════════════════════════════════════════════════════
// AdminVideosManagement.jsx - VERSIÓN FINAL SIN ERRORES
// ✅ YouTube funcional
// ✅ Vimeo funcional
// ✅ TikTok sin errores (botón directo sin embed)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Video, CheckCircle, XCircle, Clock, ExternalLink, X, Play } from 'lucide-react';
import adminService from '../services/adminService';

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

const detectPlatform = (url) => {
    if (!url) return null;
    url = url.toLowerCase();

    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('instagram.com')) return 'instagram';

    return null;
};

const extractYouTubeId = (url) => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
    }
    return null;
};

const extractVimeoId = (url) => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
};

const getVideoThumbnail = (video) => {
    const platform = detectPlatform(video.videoUrl);

    if (platform === 'youtube') {
        const videoId = extractYouTubeId(video.videoUrl);
        if (videoId) return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }

    return null;
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTE DE ERROR
// ═══════════════════════════════════════════════════════════════

const ErrorView = ({ platform, url }) => (
    <div className="bg-slate-900 p-12 flex items-center justify-center min-h-[500px]">
        <div className="text-center max-w-md">
            <Video className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-white font-semibold mb-2">No se puede reproducir aquí</p>
            <p className="text-slate-400 text-sm mb-1">Plataforma: {platform}</p>
            <p className="text-slate-600 text-xs font-mono break-all mb-6">
                {url}
            </p>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
                <ExternalLink className="w-4 h-4" />
                Abrir externamente
            </a>
        </div>
    </div>
);

// ═══════════════════════════════════════════════════════════════
// MODAL REPRODUCTOR
// ═══════════════════════════════════════════════════════════════

const VideoPlayerModal = ({ video, onClose }) => {
    if (!video) return null;

    const platform = detectPlatform(video.videoUrl);

    const renderPlayer = () => {
        // ✅ YOUTUBE
        if (platform === 'youtube') {
            const videoId = extractYouTubeId(video.videoUrl);
            if (!videoId) return <ErrorView platform="YouTube" url={video.videoUrl} />;

            return (
                <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
                        className="absolute top-0 left-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        title={video.title}
                        style={{ border: 'none' }}
                    />
                </div>
            );
        }

        // ✅ VIMEO
        if (platform === 'vimeo') {
            const videoId = extractVimeoId(video.videoUrl);
            if (!videoId) return <ErrorView platform="Vimeo" url={video.videoUrl} />;

            return (
                <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                        src={`https://player.vimeo.com/video/${videoId}?byline=0&portrait=0`}
                        className="absolute top-0 left-0 w-full h-full"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        title={video.title}
                        style={{ border: 'none' }}
                    />
                </div>
            );
        }

        // ✅ TIKTOK - Botón directo sin embed (evita errores de permisos)
        if (platform === 'tiktok') {
            return (
                <div className="bg-gradient-to-br from-pink-900 via-purple-900 to-slate-900 p-12 flex items-center justify-center min-h-[500px]">
                    <div className="text-center max-w-md">
                        <div className="bg-pink-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <Video className="w-10 h-10 text-pink-300" />
                        </div>
                        <h3 className="text-white text-xl font-bold mb-2">Vídeo de TikTok</h3>
                        <p className="text-slate-300 text-sm mb-6">
                            Los vídeos de TikTok se reproducen mejor en su aplicación oficial.<br />
                            Haz click para verlo en TikTok.
                        </p>
                        <a
                            href={video.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white rounded-xl hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 transition-all font-bold text-lg shadow-2xl hover:shadow-pink-500/50 hover:scale-105 transform"
                        >
                            <ExternalLink className="w-5 h-5" />
                            Abrir en TikTok
                        </a>
                        <p className="text-slate-500 text-xs mt-4">
                            El vídeo se abrirá en una nueva pestaña
                        </p>
                    </div>
                </div>
            );
        }

        // Plataforma no soportada
        return <ErrorView platform={platform || 'Desconocida'} url={video.videoUrl} />;
    };

    return (
        <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-slate-800 text-white flex-shrink-0">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg truncate">{video.title}</h3>
                        <p className="text-sm text-slate-300">
                            Dr. {video.doctorName} • {platform === 'youtube' ? 'YouTube' : platform === 'vimeo' ? 'Vimeo' : platform === 'tiktok' ? 'TikTok' : 'Desconocida'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-700 transition-colors ml-4 flex-shrink-0"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Player */}
                <div className="bg-black flex-1 overflow-auto">
                    {renderPlayer()}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
                    {video.description && (
                        <p className="text-sm text-slate-700 mb-3">{video.description}</p>
                    )}

                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span>👁️ {video.viewCount} vistas</span>
                            <span>❤️ {video.likeCount} likes</span>
                            <span>📅 {new Date(video.createdAt).toLocaleDateString()}</span>
                        </div>

                        <a
                            href={video.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                            Ver original <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════

const AdminVideosManagement = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [selectedVideo, setSelectedVideo] = useState(null);

    useEffect(() => {
        loadVideos();
    }, [filter]);

    const loadVideos = async () => {
        try {
            setLoading(true);
            const data = await adminService.getVideos(filter);
            setVideos(data);
        } catch (error) {
            console.error('Error al cargar vídeos:', error);
            alert('Error al cargar los vídeos');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyVideo = async (videoId, isVerified) => {
        const confirmMessage = isVerified
            ? '¿Aprobar este vídeo? Será visible en el perfil del doctor.'
            : '¿Rechazar este vídeo? No será visible públicamente.';

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            await adminService.verifyVideo(videoId, isVerified);
            setSelectedVideo(null);
            loadVideos();

            // Notificación de éxito
            const message = isVerified ? '✅ Vídeo aprobado correctamente' : '❌ Vídeo rechazado';
            alert(message);
        } catch (error) {
            console.error('Error al verificar vídeo:', error);
            alert('Error al verificar el vídeo. Inténtalo de nuevo.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Cargando vídeos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Gestión de Vídeos</h1>
                    <p className="text-slate-600">Verifica y aprueba los vídeos subidos por los doctores</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Filtros */}
                <div className="flex gap-3 mb-6 flex-wrap">
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'pending'
                                ? 'bg-amber-500 text-white shadow-lg scale-105'
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-amber-300 hover:shadow'
                            }`}
                    >
                        <Clock className="w-4 h-4 inline mr-2" />
                        Pendientes
                    </button>
                    <button
                        onClick={() => setFilter('verified')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'verified'
                                ? 'bg-green-500 text-white shadow-lg scale-105'
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-green-300 hover:shadow'
                            }`}
                    >
                        <CheckCircle className="w-4 h-4 inline mr-2" />
                        Verificados
                    </button>
                    <button
                        onClick={() => setFilter('rejected')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'rejected'
                                ? 'bg-red-500 text-white shadow-lg scale-105'
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-red-300 hover:shadow'
                            }`}
                    >
                        <XCircle className="w-4 h-4 inline mr-2" />
                        Rechazados
                    </button>
                </div>

                {/* Lista de vídeos */}
                <div className="grid grid-cols-1 gap-4">
                    {videos.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <Video className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-600 font-medium">
                                No hay vídeos {filter === 'pending' ? 'pendientes' : filter === 'verified' ? 'verificados' : 'rechazados'}
                            </p>
                        </div>
                    ) : (
                        videos.map((video) => {
                            const thumbnail = getVideoThumbnail(video);
                            const platform = detectPlatform(video.videoUrl);

                            return (
                                <div key={video.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all">
                                    <div className="flex items-start gap-4">
                                        {/* Thumbnail */}
                                        <div className="flex-shrink-0">
                                            {thumbnail ? (
                                                <div className="relative group">
                                                    <img
                                                        src={thumbnail}
                                                        alt={video.title}
                                                        className="w-40 h-24 object-cover bg-slate-100 rounded-lg cursor-pointer"
                                                        onClick={() => setSelectedVideo(video)}
                                                    />
                                                    <div
                                                        className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                        onClick={() => setSelectedVideo(video)}
                                                    >
                                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                                                            <Play className="w-6 h-6 text-slate-900 ml-1" fill="currentColor" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    className="w-40 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center cursor-pointer hover:from-slate-200 hover:to-slate-300 transition-colors group"
                                                    onClick={() => setSelectedVideo(video)}
                                                >
                                                    <Play className="w-8 h-8 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-slate-900 mb-1 truncate">{video.title}</h3>
                                                    <p className="text-sm text-slate-600 mb-2">Dr. {video.doctorName}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ml-4 flex-shrink-0 ${video.isVerified ? 'bg-green-100 text-green-700' :
                                                        video.isActive ? 'bg-amber-100 text-amber-700' :
                                                            'bg-red-100 text-red-700'
                                                    }`}>
                                                    {video.isVerified ? '✓ Verificado' : video.isActive ? '⏱ Pendiente' : '✗ Rechazado'}
                                                </span>
                                            </div>

                                            {video.description && (
                                                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{video.description}</p>
                                            )}

                                            <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                                                <span className="flex items-center gap-1">
                                                    <Video className="w-3 h-3" />
                                                    {platform === 'youtube' ? 'YouTube' : platform === 'vimeo' ? 'Vimeo' : platform === 'tiktok' ? 'TikTok' : video.platform}
                                                </span>
                                                <span>👁️ {video.viewCount}</span>
                                                <span>❤️ {video.likeCount}</span>
                                                <span>📅 {new Date(video.createdAt).toLocaleDateString()}</span>
                                            </div>

                                            {/* Acciones */}
                                            <div className="flex gap-3 flex-wrap">
                                                <button
                                                    onClick={() => setSelectedVideo(video)}
                                                    className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-2 font-medium"
                                                >
                                                    <Play className="w-4 h-4" />
                                                    Reproducir
                                                </button>

                                                <button
                                                    onClick={() => window.open(video.videoUrl, '_blank')}
                                                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 font-medium"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    Abrir
                                                </button>

                                                {!video.isVerified && video.isActive && (
                                                    <>
                                                        <button
                                                            onClick={() => handleVerifyVideo(video.id, true)}
                                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            Aprobar
                                                        </button>
                                                        <button
                                                            onClick={() => handleVerifyVideo(video.id, false)}
                                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                            Rechazar
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Modal */}
            {selectedVideo && (
                <VideoPlayerModal
                    video={selectedVideo}
                    onClose={() => setSelectedVideo(null)}
                />
            )}
        </div>
    );
};

export default AdminVideosManagement;