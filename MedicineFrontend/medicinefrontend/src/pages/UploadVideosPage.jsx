// ═══════════════════════════════════════════════════════════════
// UploadVideosPage.jsx - Subir Vídeos de Redes Sociales
// SIN MOCKS - Conectado con backend real
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Upload, Video, Trash2, Eye, EyeOff,
    CheckCircle, AlertCircle, ExternalLink, Save, Plus
} from 'lucide-react';
import doctorDashboardService from '../services/doctordashboardService';

const PLATFORMS = [
    { value: 'TikTok', label: 'TikTok', color: 'from-black to-pink-600', icon: '🎵' },
    { value: 'Instagram', label: 'Instagram', color: 'from-purple-600 to-pink-600', icon: '📷' },
    { value: 'YouTube', label: 'YouTube', color: 'from-red-600 to-red-700', icon: '▶️' },
];

const UploadVideosPage = () => {
    const navigate = useNavigate();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [newVideo, setNewVideo] = useState({
        platform: 'TikTok',
        videoUrl: '',
        title: '',
        description: '',
        tags: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadVideos();
    }, []);

    const loadVideos = async () => {
        try {
            setLoadingData(true);
            const data = await doctorDashboardService.getVideos();
            setVideos(data);
        } catch (error) {
            console.error('Error al cargar vídeos:', error);
            alert('Error al cargar los vídeos');
        } finally {
            setLoadingData(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewVideo(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateVideo = () => {
        const newErrors = {};

        if (!newVideo.videoUrl) {
            newErrors.videoUrl = 'La URL del vídeo es obligatoria';
        } else if (!newVideo.videoUrl.startsWith('http')) {
            newErrors.videoUrl = 'La URL debe ser válida (comenzar con http:// o https://)';
        }

        if (!newVideo.title) {
            newErrors.title = 'El título es obligatorio';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddVideo = async () => {
        if (!validateVideo()) return;

        setLoading(true);

        try {
            const videoData = {
                platform: newVideo.platform,
                videoUrl: newVideo.videoUrl,
                title: newVideo.title,
                description: newVideo.description || null,
                tags: newVideo.tags || null
            };

            await doctorDashboardService.createVideo(videoData);

            // Reset form
            setNewVideo({
                platform: 'TikTok',
                videoUrl: '',
                title: '',
                description: '',
                tags: '',
            });

            // Recargar lista
            await loadVideos();

            alert('✅ Vídeo añadido correctamente');

        } catch (error) {
            console.error('Error al añadir vídeo:', error);
            alert('❌ Error al añadir el vídeo');
        } finally {
            setLoading(false);
        }
    };

    const toggleVideoStatus = async (videoId) => {
        try {
            await doctorDashboardService.toggleVideoStatus(videoId);
            await loadVideos();
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            alert('Error al cambiar el estado del vídeo');
        }
    };

    const deleteVideo = async (videoId) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este vídeo?')) return;

        try {
            await doctorDashboardService.deleteVideo(videoId);
            await loadVideos();
            alert('✅ Vídeo eliminado');
        } catch (error) {
            console.error('Error al eliminar:', error);
            alert('❌ Error al eliminar el vídeo');
        }
    };

    const getPlatformColor = (platform) => {
        return PLATFORMS.find(p => p.value === platform)?.color || 'from-slate-600 to-slate-700';
    };

    const getPlatformIcon = (platform) => {
        return PLATFORMS.find(p => p.value === platform)?.icon || '🎬';
    };

    if (loadingData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50 to-orange-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Cargando vídeos...</p>
                </div>
            </div>
        );
    }

    const verifiedCount = videos.filter(v => v.isVerified && v.isActive).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate('/doctor')}
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Volver</span>
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm text-slate-600">Vídeos publicados</p>
                                <p className="text-lg font-bold text-red-600">{videos.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Mis vídeos</h1>
                    <p className="text-slate-600">
                        Comparte tus vídeos de TikTok, Instagram o YouTube para ganar visibilidad
                    </p>
                </div>

                {/* Info Banner */}
                <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl p-6 mb-8 shadow-lg">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Video className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-2">⚠️ Requisito obligatorio para publicarte</h3>
                            <p className="text-white/90 mb-3">
                                Debes tener al menos <strong>3 vídeos verificados</strong> para que tu perfil sea visible a los pacientes.
                                Los vídeos ayudan a generar confianza y mostrar tu expertise.
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Verificados: {verifiedCount}/3</span>
                                </div>
                                {verifiedCount >= 3 && (
                                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">
                                        ✅ Requisito cumplido
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Add New Video */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Plus className="w-5 h-5 text-red-600" />
                                <h2 className="text-xl font-bold text-slate-900">Añadir nuevo vídeo</h2>
                            </div>

                            <div className="space-y-4">
                                {/* Platform */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                                        Plataforma *
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {PLATFORMS.map(platform => (
                                            <button
                                                key={platform.value}
                                                type="button"
                                                onClick={() => setNewVideo(prev => ({ ...prev, platform: platform.value }))}
                                                className={`p-4 rounded-xl border-2 transition-all ${newVideo.platform === platform.value
                                                        ? 'border-red-600 bg-red-50'
                                                        : 'border-slate-200 hover:border-slate-300'
                                                    }`}
                                            >
                                                <div className="text-3xl mb-2">{platform.icon}</div>
                                                <div className="font-semibold text-sm">{platform.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* URL */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        URL del vídeo *
                                    </label>
                                    <input
                                        type="text"
                                        name="videoUrl"
                                        value={newVideo.videoUrl}
                                        onChange={handleInputChange}
                                        placeholder="https://tiktok.com/@usuario/video123"
                                        className={`w-full px-4 py-3 rounded-lg border ${errors.videoUrl ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                            } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                                    />
                                    {errors.videoUrl && (
                                        <p className="text-red-600 text-sm mt-1">{errors.videoUrl}</p>
                                    )}
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Título *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={newVideo.title}
                                        onChange={handleInputChange}
                                        placeholder="Ej: Consejos para el dolor de espalda"
                                        maxLength={200}
                                        className={`w-full px-4 py-3 rounded-lg border ${errors.title ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                            } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                                    />
                                    {errors.title && (
                                        <p className="text-red-600 text-sm mt-1">{errors.title}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Descripción
                                    </label>
                                    <textarea
                                        name="description"
                                        value={newVideo.description}
                                        onChange={handleInputChange}
                                        placeholder="Breve descripción del contenido del vídeo"
                                        rows={3}
                                        maxLength={1000}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                    />
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Etiquetas (separadas por comas)
                                    </label>
                                    <input
                                        type="text"
                                        name="tags"
                                        value={newVideo.tags}
                                        onChange={handleInputChange}
                                        placeholder="salud, fisioterapia, ejercicios"
                                        maxLength={500}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                </div>

                                <button
                                    onClick={handleAddVideo}
                                    disabled={loading}
                                    className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg font-semibold hover:from-red-700 hover:to-orange-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Añadiendo...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5" />
                                            Añadir vídeo
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Videos List */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Vídeos subidos ({videos.length})</h2>

                            {videos.length === 0 ? (
                                <div className="text-center py-12">
                                    <Video className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-600">Aún no has subido ningún vídeo</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {videos.map(video => (
                                        <div
                                            key={video.id}
                                            className="p-4 rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-colors"
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Platform Badge */}
                                                <div className={`w-16 h-16 bg-gradient-to-br ${getPlatformColor(video.platform)} rounded-xl flex items-center justify-center text-3xl flex-shrink-0`}>
                                                    {getPlatformIcon(video.platform)}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <div className="flex-1">
                                                            <h3 className="font-bold text-slate-900 mb-1">{video.title}</h3>
                                                            {video.description && (
                                                                <p className="text-sm text-slate-600 mb-2">{video.description}</p>
                                                            )}
                                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                                <span>{video.platform}</span>
                                                                <span>•</span>
                                                                <span>{video.createdAt}</span>
                                                                {video.viewCount > 0 && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span>👁️ {video.viewCount.toLocaleString()}</span>
                                                                    </>
                                                                )}
                                                                {video.likeCount > 0 && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span>❤️ {video.likeCount.toLocaleString()}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Status Badges */}
                                                        <div className="flex flex-col gap-2">
                                                            {video.isVerified ? (
                                                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                                                    <CheckCircle className="w-3 h-3" />
                                                                    Verificado
                                                                </span>
                                                            ) : (
                                                                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    Pendiente
                                                                </span>
                                                            )}
                                                            {!video.isActive && (
                                                                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                                                                    Oculto
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Tags */}
                                                    {video.tags && (
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {video.tags.split(',').map((tag, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs"
                                                                >
                                                                    #{tag.trim()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2">
                                                        <a
                                                            href={video.videoUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                            Ver vídeo
                                                        </a>
                                                        <button
                                                            onClick={() => toggleVideoStatus(video.id)}
                                                            className="px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1"
                                                        >
                                                            {video.isActive ? (
                                                                <>
                                                                    <EyeOff className="w-4 h-4" />
                                                                    Ocultar
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Eye className="w-4 h-4" />
                                                                    Mostrar
                                                                </>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => deleteVideo(video.id)}
                                                            className="px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-4">Estadísticas</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Total vídeos</span>
                                    <span className="font-bold text-slate-900">{videos.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Verificados</span>
                                    <span className="font-bold text-emerald-600">
                                        {videos.filter(v => v.isVerified).length}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Pendientes</span>
                                    <span className="font-bold text-amber-600">
                                        {videos.filter(v => !v.isVerified).length}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Activos</span>
                                    <span className="font-bold text-blue-600">
                                        {videos.filter(v => v.isActive).length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl p-6 border border-red-200">
                            <h3 className="font-bold text-slate-900 mb-3">💡 Consejos</h3>
                            <ul className="space-y-2 text-sm text-slate-700">
                                <li className="flex items-start gap-2">
                                    <span className="text-red-600">•</span>
                                    <span>Sube vídeos educativos de calidad que demuestren tu expertise</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-600">•</span>
                                    <span>Evita contenido promocional o publicitario</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-600">•</span>
                                    <span>Los vídeos cortos (30-60s) funcionan mejor</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-600">•</span>
                                    <span>Añade etiquetas relevantes para mejor visibilidad</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadVideosPage;