// ═══════════════════════════════════════════════════════════════
// AdminVideosManagement.jsx - Con debugging mejorado
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Video, CheckCircle, XCircle, Clock, ExternalLink, X, Play } from 'lucide-react';
import adminService from '../services/adminService';

// ═══════════════════════════════════════════════════════════════
// FUNCIONES HELPER PARA DETECTAR PLATAFORMA Y EXTRAER IDs
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
    // https://www.youtube.com/watch?v=VIDEO_ID
    // https://youtu.be/VIDEO_ID
    // https://www.youtube.com/embed/VIDEO_ID
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            console.log('✅ YouTube ID encontrado:', match[1]);
            return match[1];
        }
    }

    console.warn('❌ No se pudo extraer YouTube ID de:', url);
    return null;
};

const extractVimeoId = (url) => {
    // https://vimeo.com/123456789
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match && match[1]) {
        console.log('✅ Vimeo ID encontrado:', match[1]);
        return match[1];
    }

    console.warn('❌ No se pudo extraer Vimeo ID de:', url);
    return null;
};

const extractTikTokId = (url) => {
    // https://www.tiktok.com/@username/video/1234567890123456789
    const match = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
    if (match && match[1]) {
        console.log('✅ TikTok ID encontrado:', match[1]);
        return match[1];
    }

    console.warn('❌ No se pudo extraer TikTok ID de:', url);
    return null;
};

// ═══════════════════════════════════════════════════════════════
// MODAL REPRODUCTOR CON DEBUG
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// SOLO LA PARTE DEL MODAL - Reemplaza en tu archivo
// ═══════════════════════════════════════════════════════════════

const VideoPlayerModal = ({ video, onClose }) => {
    if (!video) return null;

    console.log('🎬 VideoPlayerModal - Video data:', video);
    console.log('🔗 Video URL:', video.videoUrl);
    console.log('📺 Platform from backend:', video.platform);

    const detectedPlatform = detectPlatform(video.videoUrl);
    const platform = (video.platform?.toLowerCase() || detectedPlatform || '').toLowerCase();

    console.log('🎯 Platform detectada:', platform);

    const getEmbedContent = () => {
        const url = video.videoUrl;

        if (platform === 'youtube') {
            const videoId = extractYouTubeId(url);
            if (videoId) {
                // ✅ SIN autoplay para evitar problemas
                const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
                console.log('▶️ YouTube embed URL:', embedUrl);
                return {
                    type: 'iframe',
                    url: embedUrl
                };
            }
        }

        if (platform === 'vimeo') {
            const videoId = extractVimeoId(url);
            if (videoId) {
                const embedUrl = `https://player.vimeo.com/video/${videoId}`;
                console.log('▶️ Vimeo embed URL:', embedUrl);
                return {
                    type: 'iframe',
                    url: embedUrl
                };
            }
        }

        if (platform === 'tiktok') {
            const videoId = extractTikTokId(url);
            console.log('▶️ TikTok URL:', url);
            return {
                type: 'tiktok',
                url: url,
                videoId: videoId
            };
        }

        console.warn('⚠️ Plataforma no soportada o URL inválida');
        return {
            type: 'external',
            url: url
        };
    };

    const embedContent = getEmbedContent();
    console.log('📦 Embed content:', embedContent);

    return (
        <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-slate-800 text-white">
                    <div className="flex-1">
                        <h3 className="font-bold text-lg">{video.title}</h3>
                        <p className="text-sm text-slate-300">Dr. {video.doctorName} • {platform || 'Desconocida'}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-700 transition-colors ml-4"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Video Player */}
                <div className="bg-black">
                    {embedContent.type === 'iframe' && (
                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                            <iframe
                                src={embedContent.url}
                                className="absolute top-0 left-0 w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                allowFullScreen
                                title={video.title}
                                style={{
                                    border: 'none',
                                    width: '100%',
                                    height: '100%',
                                    display: 'block'
                                }}
                            />
                        </div>
                    )}

                    {embedContent.type === 'tiktok' && (
                        <div className="bg-slate-900 p-8 min-h-[500px] flex items-center justify-center">
                            <div className="max-w-md w-full text-center">
                                <Video className="w-16 h-16 text-white mx-auto mb-4" />
                                <p className="text-white text-lg mb-2">Vídeo de TikTok</p>
                                <p className="text-slate-400 text-sm mb-6">
                                    TikTok no permite reproducir vídeos embebidos.<br />
                                    Haz click en el botón para verlo en TikTok.
                                </p>
                                <a
                                    href={embedContent.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all text-lg font-semibold shadow-lg hover:shadow-xl"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                    Abrir en TikTok
                                </a>
                            </div>
                        </div>
                    )}

                    {embedContent.type === 'external' && (
                        <div className="bg-slate-900 p-8 min-h-[500px] flex items-center justify-center">
                            <div className="text-center">
                                <Video className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                                <p className="text-white font-semibold mb-2 text-lg">
                                    No se puede reproducir aquí
                                </p>
                                <p className="text-slate-400 mb-1 text-sm">
                                    Plataforma: {platform || 'Desconocida'}
                                </p>
                                <p className="text-slate-500 mb-6 text-xs font-mono break-all max-w-md">
                                    {video.videoUrl}
                                </p>
                                <a
                                    href={video.videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold shadow-lg hover:shadow-xl"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                    Abrir vídeo externamente
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer con info */}
                <div className="p-4 bg-slate-50 border-t border-slate-200">
                    {video.description && (
                        <p className="text-sm text-slate-700 mb-3">{video.description}</p>
                    )}

                    <div className="flex items-center justify-between">
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
            console.log('📹 Vídeos cargados:', data);
            setVideos(data);
        } catch (error) {
            console.error('❌ Error al cargar vídeos:', error);
            alert('Error al cargar los vídeos');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyVideo = async (videoId, isVerified) => {
        try {
            await adminService.verifyVideo(videoId, isVerified);
            alert(isVerified ? '✅ Vídeo aprobado' : '❌ Vídeo rechazado');
            setSelectedVideo(null);
            loadVideos();
        } catch (error) {
            console.error('Error al verificar vídeo:', error);
            alert('Error al verificar el vídeo');
        }
    };

    const getVideoThumbnail = (video) => {
        const { videoUrl } = video;
        const platform = detectPlatform(videoUrl);

        if (platform === 'youtube') {
            const videoId = extractYouTubeId(videoUrl);
            if (videoId) return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        }

        return null;
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
                <div className="flex gap-3 mb-6">
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'pending'
                                ? 'bg-amber-500 text-white shadow-lg'
                                : 'bg-white text-slate-700 border border-slate-200'
                            }`}
                    >
                        <Clock className="w-4 h-4 inline mr-2" />
                        Pendientes
                    </button>
                    <button
                        onClick={() => setFilter('verified')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'verified'
                                ? 'bg-green-500 text-white shadow-lg'
                                : 'bg-white text-slate-700 border border-slate-200'
                            }`}
                    >
                        <CheckCircle className="w-4 h-4 inline mr-2" />
                        Verificados
                    </button>
                    <button
                        onClick={() => setFilter('rejected')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'rejected'
                                ? 'bg-red-500 text-white shadow-lg'
                                : 'bg-white text-slate-700 border border-slate-200'
                            }`}
                    >
                        <XCircle className="w-4 h-4 inline mr-2" />
                        Rechazados
                    </button>
                </div>

                {/* Lista de vídeos */}
                <div className="grid grid-cols-1 gap-4">
                    {videos.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                            <Video className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-600 font-medium">No hay vídeos {filter}</p>
                        </div>
                    ) : (
                        videos.map((video) => {
                            const thumbnail = getVideoThumbnail(video);

                            return (
                                <div key={video.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
                                    <div className="flex items-start gap-4">
                                        {/* Thumbnail */}
                                        <div className="flex-shrink-0">
                                            {thumbnail ? (
                                                <div className="relative group">
                                                    <img
                                                        src={thumbnail}
                                                        alt={video.title}
                                                        className="w-40 h-24 object-cover bg-slate-100 rounded-lg cursor-pointer"
                                                        onClick={() => {
                                                            console.log('🖱️ Click en thumbnail:', video);
                                                            setSelectedVideo(video);
                                                        }}
                                                    />
                                                    <div
                                                        className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                        onClick={() => setSelectedVideo(video)}
                                                    >
                                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                                                            <Play className="w-6 h-6 text-slate-900 ml-1" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    className="w-40 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center cursor-pointer hover:from-slate-200 hover:to-slate-300 transition-colors"
                                                    onClick={() => setSelectedVideo(video)}
                                                >
                                                    <Play className="w-8 h-8 text-slate-400" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="font-bold text-slate-900 mb-1">{video.title}</h3>
                                                    <p className="text-sm text-slate-600 mb-2">Dr. {video.doctorName}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${video.isVerified ? 'bg-green-100 text-green-700' :
                                                        video.isActive ? 'bg-amber-100 text-amber-700' :
                                                            'bg-red-100 text-red-700'
                                                    }`}>
                                                    {video.isVerified ? 'Verificado' : video.isActive ? 'Pendiente' : 'Rechazado'}
                                                </span>
                                            </div>

                                            {video.description && (
                                                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{video.description}</p>
                                            )}

                                            <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                                                <span>{video.platform}</span>
                                                <span>👁️ {video.viewCount}</span>
                                                <span>❤️ {video.likeCount}</span>
                                                <span>📅 {new Date(video.createdAt).toLocaleDateString()}</span>
                                            </div>

                                            {/* Acciones */}
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => {
                                                        console.log('▶️ Reproducir click:', video);
                                                        setSelectedVideo(video);
                                                    }}
                                                    className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-2"
                                                >
                                                    <Play className="w-4 h-4" />
                                                    Reproducir
                                                </button>

                                                <button
                                                    onClick={() => window.open(video.videoUrl, '_blank')}
                                                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    Abrir
                                                </button>

                                                {!video.isVerified && video.isActive && (
                                                    <>
                                                        <button
                                                            onClick={() => handleVerifyVideo(video.id, true)}
                                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            Aprobar
                                                        </button>
                                                        <button
                                                            onClick={() => handleVerifyVideo(video.id, false)}
                                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
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
                    onClose={() => {
                        console.log('❌ Cerrar modal');
                        setSelectedVideo(null);
                    }}
                />
            )}
        </div>
    );
};

export default AdminVideosManagement;