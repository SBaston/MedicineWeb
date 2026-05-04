import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import adminService from '../services/adminService';
import chatService from '../services/chatService';
import { useTaxRate } from '../hooks/useTaxRate';
import {
    ShieldCheck, ShieldOff, Clock, CheckCircle, XCircle, Trash2, Users,
    Stethoscope, Mail, AlertTriangle, ChevronDown, ChevronUp,
    Star, Crown, UserPlus, FileText, Shield, User, Eye, Download, X, Video,
    Search, BookOpen, Play, GraduationCap, Phone, Calendar, DollarSign,
    ExternalLink, BadgeCheck, AlertCircle, MessageCircle, Plus, Edit2,
    ToggleLeft, ToggleRight, Zap, Percent
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════
// COMPONENTES DE APOYO
// ════════════════════════════════════════════════════════════════

const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-primary-200 transition-all' : ''
            }`}
    >
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-900">{value ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        </div>
    </div>
);

const ConfirmModal = ({ title, description, requireReason, reasonLabel, danger, onConfirm, onCancel }) => {
    const [reason, setReason] = useState('');
    const valid = !requireReason || reason.trim().length >= 10;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${danger ? 'bg-red-100' : 'bg-green-100'}`}>
                        <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-600' : 'text-green-600'}`} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">{description}</p>
                {requireReason && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {reasonLabel} <span className="text-red-500">*</span>
                        </label>
                        <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
                            placeholder="Mínimo 10 caracteres…"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        <p className="text-xs text-gray-400 mt-1">{reason.length} / 10 mínimos</p>
                    </div>
                )}
                <div className="flex gap-3 justify-end">
                    <button onClick={onCancel} className="btn-secondary text-sm px-4 py-2">Cancelar</button>
                    <button onClick={() => onConfirm(reason)} disabled={!valid}
                        className={`text-sm px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                            ${danger ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

// ════════════════════════════════════════════════════════════════
// ✅ COMPONENTE DE IMAGEN INDIVIDUAL (FUERA DE PendingDoctorRow)
// ════════════════════════════════════════════════════════════════

const ImageCard = ({ url, title, required = false, icon: IconComponent = FileText, onView }) => {
    const isPdf = url && url.toLowerCase().includes('.pdf');

    if (!url) {
        return (
            <div className={`${required ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'} rounded-lg border-2 border-dashed p-4 flex flex-col items-center justify-center h-40 sm:h-64`}>
                <IconComponent className={`w-8 h-8 ${required ? 'text-red-300' : 'text-gray-300'} mb-2`} />
                <p className={`text-xs font-semibold ${required ? 'text-red-700' : 'text-gray-600'}`}>{title}</p>
                <p className={`text-xs ${required ? 'text-red-600' : 'text-gray-400'} mt-1`}>
                    {required ? '⚠️ No subido' : 'No subido'}
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
            <div className={`p-3 ${required ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'} border-b`}>
                <p className={`font-semibold text-sm ${required ? 'text-blue-900' : 'text-gray-900'} flex items-center gap-2`}>
                    <IconComponent className="w-4 h-4" />
                    {title}
                </p>
                <p className={`text-xs ${required ? 'text-blue-700' : 'text-gray-600'} mt-0.5`}>
                    {required ? 'Obligatorio' : 'Opcional'}
                </p>
            </div>
            <div className="p-2">
                {isPdf ? (
                    <div
                        className="w-full h-48 bg-red-50 rounded flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-red-100 transition border border-red-200"
                        onClick={() => onView({ url, title, isPdf: true })}
                    >
                        <FileText className="w-12 h-12 text-red-400" />
                        <span className="text-sm font-semibold text-red-700">Documento PDF</span>
                        <span className="text-xs text-blue-600 underline">Clic para previsualizar</span>
                    </div>
                ) : (
                    <img
                        src={url}
                        alt={title}
                        className="w-full h-48 object-contain bg-gray-100 rounded cursor-pointer hover:opacity-80 transition"
                        onClick={() => onView({ url, title, isPdf: false })}
                    />
                )}
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={() => onView({ url, title, isPdf })}
                        className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center gap-1"
                    >
                        <Eye className="w-3 h-3" />
                        Ver
                    </button>
                    <a
                        href={url}
                        download
                        className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center gap-1"
                    >
                        <Download className="w-3 h-3" />
                        Descargar
                    </a>
                </div>
            </div>
        </div>
    );
};

// ════════════════════════════════════════════════════════════════
// PROFESIONALES PENDIENTES - CON 6 IMÁGENES
// ════════════════════════════════════════════════════════════════

const PendingDoctorRow = ({ doctor, onApprove, onReject }) => {
    const [expanded, setExpanded] = useState(false);
    const [showImageModal, setShowImageModal] = useState(null);

    const avatar = doctor.profilePictureUrl
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.fullName)}&background=3b82f6&color=fff&size=200&bold=true`;

    return (
        <>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                    <img src={avatar} alt={doctor.fullName}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-gray-100" />
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{doctor.fullName}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" /> {doctor.email}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {doctor.specialties && doctor.specialties.map(s => (
                                <span key={s} className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full">{s}</span>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => setExpanded(!expanded)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button onClick={() => onReject(doctor)}
                            className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors">
                            <XCircle className="w-4 h-4" /> Rechazar
                        </button>
                        <button onClick={() => onApprove(doctor)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                            <CheckCircle className="w-4 h-4" /> Aprobar
                        </button>
                    </div>
                </div>

                {expanded && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                        {/* Información básica */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Nº Colegiado</p>
                                <p className="font-medium text-gray-800">{doctor.professionalLicense}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Experiencia</p>
                                <p className="font-medium text-gray-800">{doctor.yearsOfExperience ?? 0} años</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Precio / sesión</p>
                                <p className="font-medium text-gray-800">{doctor.pricePerSession} €</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Teléfono</p>
                                <p className="font-medium text-gray-800">{doctor.phoneNumber || '—'}</p>
                            </div>
                        </div>

                        {/* Descripción */}
                        {doctor.description && (
                            <div className="mb-4">
                                <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Descripción</p>
                                <p className="text-gray-700 text-sm">{doctor.description}</p>
                            </div>
                        )}

                        {/* ✅ DOCUMENTOS - 6 IMÁGENES */}
                        <div className="mb-4">
                            <p className="text-sm text-gray-700 font-semibold mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary-600" />
                                Documentos de Verificación
                            </p>

                            {/* CARNET DE COLEGIADO - OBLIGATORIO */}
                            <div className="mb-4">
                                <h4 className="text-xs font-semibold text-gray-900 mb-2">
                                    📋 Carnet de Colegiado <span className="text-red-500">(Obligatorio)</span>
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ImageCard
                                        url={doctor.professionalLicenseFrontImageUrl}
                                        title="Cara Delantera"
                                        required
                                        icon={Shield}
                                        onView={setShowImageModal}
                                    />
                                    <ImageCard
                                        url={doctor.professionalLicenseBackImageUrl}
                                        title="Cara Trasera"
                                        required
                                        icon={Shield}
                                        onView={setShowImageModal}
                                    />
                                </div>
                            </div>

                            {/* DNI/PASAPORTE - OBLIGATORIO */}
                            <div className="mb-4">
                                <h4 className="text-xs font-semibold text-gray-900 mb-2">
                                    🪪 DNI/Pasaporte <span className="text-red-500">(Obligatorio)</span>
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ImageCard
                                        url={doctor.idDocumentFrontImageUrl}
                                        title="Cara Delantera"
                                        required
                                        icon={User}
                                        onView={setShowImageModal}
                                    />
                                    <ImageCard
                                        url={doctor.idDocumentBackImageUrl}
                                        title="Cara Trasera"
                                        required
                                        icon={User}
                                        onView={setShowImageModal}
                                    />
                                </div>
                            </div>

                            {/* TÍTULOS ACADÉMICOS - OBLIGATORIO */}
                            <div>
                                <h4 className="text-xs font-semibold text-gray-900 mb-2">
                                    🎓 Títulos Académicos <span className="text-red-500">(Obligatorio)</span>
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Títulos de especialidad — puede haber varios */}
                                    {(doctor.specialtyDegreeImageUrls?.length > 0
                                        ? doctor.specialtyDegreeImageUrls
                                        : [doctor.specialtyDegreeImageUrl].filter(Boolean)
                                    ).map((url, i) => (
                                        <ImageCard
                                            key={i}
                                            url={url}
                                            title={doctor.specialtyDegreeImageUrls?.length > 1
                                                ? `Título de Especialidad ${i + 1}`
                                                : 'Título de Especialidad'}
                                            required
                                            icon={FileText}
                                            onView={setShowImageModal}
                                        />
                                    ))}
                                    {/* Si no hay ninguno subido */}
                                    {!doctor.specialtyDegreeImageUrls?.length && !doctor.specialtyDegreeImageUrl && (
                                        <ImageCard
                                            url={null}
                                            title="Título de Especialidad"
                                            required
                                            icon={FileText}
                                            onView={setShowImageModal}
                                        />
                                    )}
                                    <ImageCard
                                        url={doctor.universityDegreeImageUrl}
                                        title="Título Universitario"
                                        required
                                        icon={FileText}
                                        onView={setShowImageModal}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de imagen ampliada */}
            {showImageModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowImageModal(null)}
                >
                    <div
                        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
                            <h3 className="font-semibold text-lg">{showImageModal.title}</h3>
                            <button
                                onClick={() => setShowImageModal(null)}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-4">
                            {showImageModal.isPdf ? (
                                <iframe
                                    src={showImageModal.url}
                                    title={showImageModal.title}
                                    className="w-full rounded"
                                    style={{ height: '70vh' }}
                                />
                            ) : (
                                <img
                                    src={showImageModal.url}
                                    alt={showImageModal.title}
                                    className="w-full h-auto"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// ════════════════════════════════════════════════════════════════
// TABLA DE PROFESIONALES
// ════════════════════════════════════════════════════════════════

const STATUS_BADGE = {
    Active: 'bg-green-100 text-green-700',
    PendingReview: 'bg-yellow-100 text-yellow-700',
    Rejected: 'bg-red-100 text-red-700',
    Deleted: 'bg-gray-100 text-gray-400',
};
const STATUS_LABEL = {
    Active: 'Activo', PendingReview: 'Pendiente',
    Rejected: 'Rechazado', Deleted: 'Eliminado'
};

const DoctorRow = ({ doctor, onDelete }) => {
    const avatar = doctor.profilePictureUrl
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.fullName)}&background=10b981&color=fff&size=200&bold=true`;
    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <img src={avatar} alt={doctor.fullName} className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                    <div>
                        <p className="font-medium text-gray-900 text-sm">{doctor.fullName}</p>
                        <p className="text-xs text-gray-400">{doctor.email}</p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">{doctor.specialties.slice(0, 2).join(', ') || '—'}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{doctor.pricePerSession} €</td>
            <td className="px-4 py-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[doctor.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABEL[doctor.status] ?? doctor.status}
                </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    {doctor.averageRating?.toFixed(1) ?? '—'}
                </span>
            </td>
            <td className="px-4 py-3">
                {doctor.status !== 'Deleted' && (
                    <button onClick={() => onDelete(doctor)}
                        className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                )}
            </td>
        </tr>
    );
};

// ════════════════════════════════════════════════════════════════
// FILA DE PROFESIONAL EN EL BUSCADOR (expandible con detalle)
// ════════════════════════════════════════════════════════════════

const PLATFORM_COLORS = {
    YouTube:  'bg-red-100 text-red-700',
    Vimeo:    'bg-blue-100 text-blue-700',
    TikTok:   'bg-gray-100 text-gray-700',
    default:  'bg-slate-100 text-slate-600',
};

const LEVEL_COLORS = {
    Principiante: 'bg-green-100 text-green-700',
    Intermedio:   'bg-yellow-100 text-yellow-700',
    Avanzado:     'bg-red-100 text-red-700',
    default:      'bg-gray-100 text-gray-600',
};

const DoctorSearchRow = ({ doctor }) => {
    const [expanded, setExpanded]         = useState(false);
    const [detail, setDetail]             = useState(null);
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState(null);
    const [showImageModal, setShowImageModal] = useState(null);

    const avatar = doctor.profilePictureUrl
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.fullName)}&background=6366f1&color=fff&size=200&bold=true`;

    const handleToggle = async () => {
        if (!expanded && !detail) {
            setLoading(true);
            setError(null);
            try {
                const data = await adminService.getDoctorDetail(doctor.id);
                setDetail(data);
            } catch {
                setError('No se pudo cargar el detalle del profesional.');
            } finally {
                setLoading(false);
            }
        }
        setExpanded(v => !v);
    };

    return (
        <>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* Cabecera de la fila */}
            <button
                onClick={handleToggle}
                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
            >
                <img src={avatar} alt={doctor.fullName}
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0 border-2 border-gray-100" />

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">{doctor.fullName}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[doctor.status] ?? 'bg-gray-100 text-gray-500'}`}>
                            {STATUS_LABEL[doctor.status] ?? doctor.status}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" /> {doctor.email}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                        {doctor.specialties?.slice(0, 3).map(s => (
                            <span key={s} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full">{s}</span>
                        ))}
                        {doctor.specialties?.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">+{doctor.specialties.length - 3}</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-400">Valoración</p>
                        <p className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                            {doctor.averageRating?.toFixed(1) ?? '—'}
                        </p>
                    </div>
                    {loading
                        ? <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        : expanded
                            ? <ChevronUp className="w-5 h-5 text-gray-400" />
                            : <ChevronDown className="w-5 h-5 text-gray-400" />
                    }
                </div>
            </button>

            {/* Detalle expandido */}
            {expanded && (
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-5 space-y-6">
                    {error && (
                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {detail && (
                        <>
                            {/* ── Datos básicos ── */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5 flex items-center gap-1">
                                        <Phone className="w-3 h-3" /> Teléfono
                                    </p>
                                    <p className="font-medium text-gray-800">{detail.profile.phoneNumber || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Experiencia
                                    </p>
                                    <p className="font-medium text-gray-800">{detail.profile.yearsOfExperience ?? 0} años</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5 flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" /> Precio / sesión
                                    </p>
                                    <p className="font-medium text-gray-800">{detail.profile.pricePerSession} €</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5 flex items-center gap-1">
                                        <Shield className="w-3 h-3" /> Nº Colegiado
                                    </p>
                                    <p className="font-medium text-gray-800">{detail.profile.professionalLicense}</p>
                                </div>
                            </div>

                            {/* ── Descripción ── */}
                            {detail.profile.description && (
                                <div>
                                    <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Descripción profesional</p>
                                    <p className="text-sm text-gray-700 leading-relaxed">{detail.profile.description}</p>
                                </div>
                            )}

                            {/* ── Documentos ── */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
                                    <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center">
                                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                                    </div>
                                    Documentación acreditativa
                                </h3>

                                {/* Nº Colegiado */}
                                <div className="mb-4">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                        <Shield className="w-3.5 h-3.5 text-primary-500" /> Licencia colegial
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <ImageCard
                                            url={detail.profile.professionalLicenseFrontImageUrl}
                                            title="Cara Delantera"
                                            required
                                            icon={FileText}
                                            onView={setShowImageModal}
                                        />
                                        <ImageCard
                                            url={detail.profile.professionalLicenseBackImageUrl}
                                            title="Cara Trasera"
                                            required
                                            icon={FileText}
                                            onView={setShowImageModal}
                                        />
                                    </div>
                                </div>

                                {/* DNI */}
                                <div className="mb-4">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-blue-500" /> Documento de identidad (DNI/NIE/Pasaporte)
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <ImageCard
                                            url={detail.profile.idDocumentFrontImageUrl}
                                            title="Cara Delantera"
                                            required
                                            icon={FileText}
                                            onView={setShowImageModal}
                                        />
                                        <ImageCard
                                            url={detail.profile.idDocumentBackImageUrl}
                                            title="Cara Trasera"
                                            required
                                            icon={FileText}
                                            onView={setShowImageModal}
                                        />
                                    </div>
                                </div>

                                {/* Títulos */}
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                        <GraduationCap className="w-3.5 h-3.5 text-indigo-500" /> Títulos académicos
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {/* Títulos de especialidad — puede haber varios */}
                                        {(detail.profile.specialtyDegreeImageUrls?.length > 0
                                            ? detail.profile.specialtyDegreeImageUrls
                                            : [detail.profile.specialtyDegreeImageUrl].filter(Boolean)
                                        ).map((url, i) => (
                                            <ImageCard
                                                key={i}
                                                url={url}
                                                title={detail.profile.specialtyDegreeImageUrls?.length > 1
                                                    ? `Título de Especialidad ${i + 1}`
                                                    : 'Título de Especialidad'}
                                                required
                                                icon={FileText}
                                                onView={setShowImageModal}
                                            />
                                        ))}
                                        {!detail.profile.specialtyDegreeImageUrls?.length && !detail.profile.specialtyDegreeImageUrl && (
                                            <ImageCard
                                                url={null}
                                                title="Título de Especialidad"
                                                required
                                                icon={FileText}
                                                onView={setShowImageModal}
                                            />
                                        )}
                                        <ImageCard
                                            url={detail.profile.universityDegreeImageUrl}
                                            title="Título Universitario"
                                            required
                                            icon={FileText}
                                            onView={setShowImageModal}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ── Vídeos ── */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
                                        <Play className="w-3.5 h-3.5 text-red-600" />
                                    </div>
                                    Vídeos publicados
                                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full font-normal">
                                        {detail.videos.length}
                                    </span>
                                </h3>

                                {detail.videos.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic">Este profesional no ha publicado vídeos.</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {detail.videos.map(v => (
                                            <div key={v.id} className="bg-white border border-gray-200 rounded-lg p-3 flex gap-3">
                                                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <Video className="w-5 h-5 text-red-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{v.title}</p>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${PLATFORM_COLORS[v.platform] ?? PLATFORM_COLORS.default}`}>
                                                            {v.platform}
                                                        </span>
                                                        {v.isVerified
                                                            ? <span className="flex items-center gap-0.5 text-xs text-green-600"><BadgeCheck className="w-3 h-3" /> Verificado</span>
                                                            : <span className="text-xs text-yellow-600">Pendiente</span>
                                                        }
                                                        {!v.isActive && <span className="text-xs text-gray-400">Inactivo</span>}
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {v.viewCount} reproducciones · {v.likeCount} likes
                                                    </p>
                                                </div>
                                                <a href={v.videoUrl} target="_blank" rel="noopener noreferrer"
                                                    className="flex-shrink-0 self-start p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                                                    title="Abrir vídeo">
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ── Cursos ── */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
                                        <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                                    </div>
                                    Cursos
                                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full font-normal">
                                        {detail.courses.length}
                                    </span>
                                </h3>

                                {detail.courses.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic">Este profesional no ha creado cursos.</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {detail.courses.map(c => (
                                            <div key={c.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                                {c.coverImageUrl
                                                    ? <img src={c.coverImageUrl} alt={c.title} className="w-full h-24 object-cover" />
                                                    : <div className="w-full h-24 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                                                        <BookOpen className="w-8 h-8 text-indigo-300" />
                                                      </div>
                                                }
                                                <div className="p-3">
                                                    <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">{c.title}</p>
                                                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                                        {c.isPublished
                                                            ? <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">Publicado</span>
                                                            : <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded font-medium">Borrador</span>
                                                        }
                                                        {c.level && (
                                                            <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${LEVEL_COLORS[c.level] ?? LEVEL_COLORS.default}`}>
                                                                {c.level}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                                        <span>{c.price === 0 ? 'Gratis' : `${c.price} €`}</span>
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-3 h-3" /> {c.totalEnrollments}
                                                            {c.averageRating > 0 && (
                                                                <>
                                                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 ml-1" />
                                                                    {c.averageRating.toFixed(1)}
                                                                </>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>

        {/* Modal de imagen ampliada */}
        {showImageModal && (
            <div
                className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
                onClick={() => setShowImageModal(null)}
            >
                <div
                    className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
                        <h3 className="font-semibold text-lg">{showImageModal.title}</h3>
                        <button onClick={() => setShowImageModal(null)}
                            className="text-gray-400 hover:text-gray-600 transition">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="p-4">
                        {showImageModal.isPdf ? (
                            <iframe
                                src={showImageModal.url}
                                title={showImageModal.title}
                                className="w-full rounded"
                                style={{ height: '70vh' }}
                            />
                        ) : (
                            <img
                                src={showImageModal.url}
                                alt={showImageModal.title}
                                className="w-full h-auto"
                            />
                        )}
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

// ════════════════════════════════════════════════════════════════
// SECCIÓN BUSCADOR DE PROFESIONALES
// ════════════════════════════════════════════════════════════════

const SearchDoctorsSection = () => {
    const [query, setQuery] = useState('');

    const { data: allDoctors = [], isLoading } = useQuery({
        queryKey: ['admin-doctors-search'],
        queryFn: () => adminService.getAllDoctors(''),   // todos los no-eliminados
    });

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim();
        if (!q) return allDoctors;
        return allDoctors.filter(d =>
            d.fullName.toLowerCase().includes(q) ||
            d.email.toLowerCase().includes(q) ||
            d.specialties?.some(s => s.toLowerCase().includes(q)) ||
            d.professionalLicense?.toLowerCase().includes(q)
        );
    }, [query, allDoctors]);

    return (
        <div>
            {/* Buscador */}
            <div className="relative mb-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Buscar por nombre, email, especialidad o nº colegiado…"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Contador de resultados */}
            {!isLoading && (
                <p className="text-xs text-gray-400 mb-3">
                    {query
                        ? `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''} para "${query}"`
                        : `${allDoctors.length} profesional${allDoctors.length !== 1 ? 'es' : ''} en el sistema`
                    }
                </p>
            )}

            {/* Lista */}
            {isLoading ? (
                <div className="text-center py-12 text-gray-400 text-sm">Cargando profesionales…</div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 py-14 text-center">
                    <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium text-gray-500">Sin resultados</p>
                    <p className="text-sm text-gray-400 mt-1">
                        {query ? 'Prueba con otro nombre o especialidad.' : 'No hay profesionales registrados.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(d => (
                        <DoctorSearchRow key={d.id} doctor={d} />
                    ))}
                </div>
            )}
        </div>
    );
};

// ════════════════════════════════════════════════════════════════
// SECCIÓN DE PLANES DE CHAT PREMIUM
// ════════════════════════════════════════════════════════════════

const ChatPlansSection = () => {
    const queryClient = useQueryClient();
    const ivaRate = useTaxRate();
    const [showForm, setShowForm] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [form, setForm] = useState({
        name: '', description: '', price: '', durationDays: '',
        platformCommissionPercent: '20', isActive: true,
    });
    const [formError, setFormError] = useState('');

    const { data: plans = [], isLoading } = useQuery({
        queryKey: ['admin-chat-plans'],
        queryFn: chatService.admin.getPlans,
    });

    const { data: stats } = useQuery({
        queryKey: ['admin-chat-stats'],
        queryFn: chatService.admin.getStats,
    });

    const createMut = useMutation({
        mutationFn: chatService.admin.createPlan,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-chat-plans'] }); resetForm(); },
        onError: (e) => setFormError(e.response?.data?.message || 'Error al crear el plan'),
    });

    const updateMut = useMutation({
        mutationFn: ({ id, dto }) => chatService.admin.updatePlan(id, dto),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-chat-plans'] }); resetForm(); },
        onError: (e) => setFormError(e.response?.data?.message || 'Error al actualizar el plan'),
    });

    const deactivateMut = useMutation({
        mutationFn: chatService.admin.deactivatePlan,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-chat-plans'] }),
    });

    const resetForm = () => {
        setShowForm(false);
        setEditingPlan(null);
        setFormError('');
        setForm({ name: '', description: '', price: '', durationDays: '', platformCommissionPercent: '20', isActive: true });
    };

    const openEdit = (plan) => {
        setEditingPlan(plan);
        setForm({
            name: plan.name,
            description: plan.description || '',
            price: plan.price.toString(),
            durationDays: plan.durationDays.toString(),
            platformCommissionPercent: plan.platformCommissionPercent.toString(),
            isActive: plan.isActive,
        });
        setShowForm(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError('');
        const price = parseFloat(form.price);
        const days = parseInt(form.durationDays, 10);
        const comm = parseFloat(form.platformCommissionPercent);
        if (!form.name.trim() || isNaN(price) || price <= 0 || isNaN(days) || days < 1 || isNaN(comm) || comm < 0 || comm > 100) {
            setFormError('Revisa los campos: nombre, precio, días y comisión son obligatorios.');
            return;
        }
        const dto = {
            name: form.name.trim(),
            description: form.description.trim() || null,
            price,
            durationDays: days,
            platformCommissionPercent: comm,
            isVatExempt: false,   // los planes de chat siempre llevan IVA
            isActive: form.isActive,
        };
        if (editingPlan) {
            updateMut.mutate({ id: editingPlan.id, dto });
        } else {
            createMut.mutate(dto);
        }
    };

    const activePlans = plans.filter(p => p.isActive);
    const inactivePlans = plans.filter(p => !p.isActive);

    return (
        <div className="mt-10 pt-8 border-t-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Planes de Chat Premium</h2>
                        <p className="text-sm text-gray-500">Configura duración, precio y reparto de ingresos</p>
                    </div>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo plan
                </button>
            </div>

            {/* Stats rápidos */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {stats.byStatus?.map(s => (
                        <div key={s.status} className="bg-white rounded-xl border border-gray-100 p-4">
                            <p className="text-xs text-gray-500 mb-1 capitalize">{s.status}</p>
                            <p className="text-xl font-bold text-gray-900">{s.count}</p>
                            <p className="text-xs text-gray-400">{s.revenue?.toFixed(2)} € recaudados</p>
                        </div>
                    ))}
                    <div className="bg-violet-50 rounded-xl border border-violet-200 p-4">
                        <p className="text-xs text-violet-600 font-medium mb-1">Ingresos plataforma</p>
                        <p className="text-xl font-bold text-violet-700">{stats.platformRevenue?.toFixed(2)} €</p>
                        <p className="text-xs text-violet-400">comisión s/ precio neto</p>
                    </div>
                </div>
            )}

            {/* Formulario crear/editar */}
            {showForm && (
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-6 mb-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        {editingPlan ? <><Edit2 className="w-4 h-4" /> Editar plan: {editingPlan.name}</> : <><Plus className="w-4 h-4" /> Nuevo plan de chat</>}
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre del plan *</label>
                            <input
                                type="text" required maxLength={100}
                                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="ej: Mensual, Trimestral…"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción</label>
                            <input
                                type="text" maxLength={500}
                                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Descripción breve del plan…"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Precio neto (€) *
                                {form.price && !isNaN(parseFloat(form.price)) && (
                                    <span className="text-violet-600 font-normal ml-2">
                                        → Con IVA ({(ivaRate * 100).toFixed(0)}%): <strong>{(parseFloat(form.price) * (1 + ivaRate)).toFixed(2)} €</strong>
                                    </span>
                                )}
                            </label>
                            <input
                                type="number" required min="1" step="1"
                                value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                                placeholder="15"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Duración (días) *</label>
                            <input
                                type="number" required min="1" max="3650" step="1"
                                value={form.durationDays} onChange={e => setForm(f => ({ ...f, durationDays: e.target.value }))}
                                placeholder="30"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Comisión plataforma (%) *
                                <span className="text-gray-400 font-normal ml-1">
                                    → Profesional recibe: {form.platformCommissionPercent ? (100 - parseFloat(form.platformCommissionPercent)).toFixed(0) : '—'}%
                                </span>
                            </label>
                            <input
                                type="number" required min="0" max="100" step="0.1"
                                value={form.platformCommissionPercent}
                                onChange={e => setForm(f => ({ ...f, platformCommissionPercent: e.target.value }))}
                                placeholder="20"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                        <div className="flex items-center gap-6 pt-5">
                            {/* IVA siempre aplicado a planes de chat — no editable */}
                            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                                <Percent className="w-3.5 h-3.5" />
                                IVA incluido (tipo general)
                            </span>
                            {editingPlan && (
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox" checked={form.isActive}
                                        onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                                        className="w-4 h-4 rounded text-violet-600"
                                    />
                                    <span className="text-sm text-gray-700">Plan activo</span>
                                </label>
                            )}
                        </div>

                        {formError && (
                            <div className="sm:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {formError}
                            </div>
                        )}

                        <div className="sm:col-span-2 flex gap-3 justify-end">
                            <button type="button" onClick={resetForm}
                                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                                Cancelar
                            </button>
                            <button type="submit"
                                disabled={createMut.isPending || updateMut.isPending}
                                className="px-6 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
                                {(createMut.isPending || updateMut.isPending) ? 'Guardando…' : (editingPlan ? 'Actualizar plan' : 'Crear plan')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lista de planes */}
            {isLoading ? (
                <div className="text-center py-10 text-gray-400">Cargando planes…</div>
            ) : plans.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No hay planes de chat configurados</p>
                    <p className="text-sm text-gray-400 mt-1">Crea el primer plan para que los pacientes puedan contratar el chat Premium</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {[...activePlans, ...inactivePlans].map(plan => {
                        const doctorPct = 100 - plan.platformCommissionPercent;
                        return (
                            <div
                                key={plan.id}
                                className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${plan.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${plan.isActive ? 'bg-violet-100' : 'bg-gray-100'}`}>
                                    <Crown className={`w-5 h-5 ${plan.isActive ? 'text-violet-600' : 'text-gray-400'}`} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-gray-900">{plan.name}</span>
                                        {plan.isActive
                                            ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Activo</span>
                                            : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Inactivo</span>
                                        }
                                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">IVA incluido</span>
                                    </div>
                                    {plan.description && (
                                        <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                                        <span className="font-bold text-gray-900 text-sm">{plan.price.toFixed(2)} €</span>
                                        <span>·</span>
                                        <span>{plan.durationDays} días</span>
                                        <span>·</span>
                                        <span className="flex items-center gap-1">
                                            <Percent className="w-3 h-3" />
                                            Plataforma: {plan.platformCommissionPercent}% · Profesional: {doctorPct.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => openEdit(plan)}
                                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
                                        title="Editar plan"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    {plan.isActive && (
                                        <button
                                            onClick={() => { if (window.confirm(`¿Desactivar el plan "${plan.name}"?`)) deactivateMut.mutate(plan.id); }}
                                            className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                                            title="Desactivar plan"
                                        >
                                            <ToggleLeft className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ════════════════════════════════════════════════════════════════
// SECCIÓN DE CONFIGURACIÓN DE PLATAFORMA (solo para SuperAdmin)
// ════════════════════════════════════════════════════════════════

const PlatformSettingsSection = () => {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'Admin' && user?.isSuperAdmin === true;

    const { data: settings = [], isLoading } = useQuery({
        queryKey: ['admin-platform-settings'],
        queryFn: adminService.getSettings,
        enabled: isSuperAdmin,
    });

    const currentIva = settings.find(s => s.key === 'IvaRate');
    const currentIvaPercent = currentIva ? (parseFloat(currentIva.value) * 100).toFixed(0) : '21';

    if (!isSuperAdmin) return null;

    return (
        <div className="mt-10 pt-8 border-t-2 border-gray-200">
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                        <Percent className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Configuración de Plataforma</h2>
                        <p className="text-sm text-gray-500">Parámetros fiscales y de facturación — solo SuperAdmin</p>
                    </div>
                </div>
                <Link
                    to="/admin/settings"
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors flex-shrink-0"
                >
                    <Edit2 className="w-4 h-4" />
                    Editar configuración
                </Link>
            </div>

            {isLoading ? (
                <div className="text-center py-10 text-gray-400 text-sm">Cargando configuración…</div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">

                    {/* IVA */}
                    <div className="flex items-center justify-between px-5 py-4 gap-4">
                        <div className="flex-1">
                            <p className="font-semibold text-gray-900 flex items-center gap-2">
                                Tipo de IVA general
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Art. 90 LIVA</span>
                            </p>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Se aplica a citas y suscripciones de chat premium abonadas por pacientes.
                            </p>
                        </div>

                        <span className="text-2xl font-bold text-gray-900 flex-shrink-0">{currentIvaPercent}%</span>
                    </div>

                    {/* Otros ajustes en modo solo lectura */}
                    {settings
                        .filter(s => s.key !== 'IvaRate')
                        .map(s => (
                            <div key={s.key} className="flex items-center justify-between px-5 py-4 gap-4">
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">{s.key}</p>
                                    {s.description && (
                                        <p className="text-sm text-gray-500 mt-0.5">{s.description}</p>
                                    )}
                                </div>
                                <span className="text-sm text-gray-600 font-medium flex-shrink-0">{s.value}</span>
                            </div>
                        ))
                    }
                </div>
            )}

        </div>
    );
};

// ════════════════════════════════════════════════════════════════
// SECCIÓN GESTIÓN DE 2FA — Pacientes y Profesionales
// Accesible para cualquier Admin
// ════════════════════════════════════════════════════════════════

const TwoFactorManagementSection = () => {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [confirmDisable, setConfirmDisable] = useState(null); // { userId, fullName, role }

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['2fa-users'],
        queryFn: adminService.getUsersWith2FA,
    });

    const disable2FAMut = useMutation({
        mutationFn: (userId) => adminService.disable2FA(userId),
        onSuccess: () => {
            qc.invalidateQueries(['2fa-users']);
            setConfirmDisable(null);
        },
    });

    const filtered = users.filter(u =>
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const roleLabel = (role) => role === 'Doctor' ? 'Profesional' : 'Paciente';
    const roleBadge = (role) => role === 'Doctor'
        ? 'bg-indigo-100 text-indigo-700'
        : 'bg-blue-100 text-blue-700';

    return (
        <div className="mt-10 pt-8 border-t-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                        <ShieldOff className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Gestión de 2FA</h2>
                        <p className="text-sm text-gray-500">
                            Pacientes y profesionales con verificación en dos pasos activa
                        </p>
                    </div>
                </div>

                {/* Búsqueda */}
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o email…"
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            {['Nombre', 'Email', 'Tipo', '2FA', 'Acción'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            <tr><td colSpan={5} className="text-center py-10 text-gray-400">Cargando…</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-10">
                                    <ShieldCheck className="w-10 h-10 text-green-300 mx-auto mb-2" />
                                    <p className="text-gray-400 text-sm">
                                        {search ? 'No hay resultados para esa búsqueda.' : 'Ningún usuario tiene 2FA activo.'}
                                    </p>
                                </td>
                            </tr>
                        ) : filtered.map(u => (
                            <tr key={u.userId} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-gray-900">{u.fullName}</td>
                                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${roleBadge(u.role)}`}>
                                        {u.role === 'Doctor'
                                            ? <Stethoscope className="w-3 h-3" />
                                            : <User className="w-3 h-3" />
                                        }
                                        {roleLabel(u.role)}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                        <ShieldCheck className="w-3 h-3" /> Activo
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => setConfirmDisable(u)}
                                        className="flex items-center gap-1 px-3 py-1.5 border border-orange-200 text-orange-600 hover:bg-orange-50 rounded-lg text-xs font-medium transition-colors"
                                    >
                                        <ShieldOff className="w-3.5 h-3.5" /> Desactivar 2FA
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de confirmación */}
            {confirmDisable && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <ShieldOff className="w-5 h-5 text-orange-600" />
                            </div>
                            <h3 className="font-bold text-gray-900">Desactivar 2FA</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                            ¿Desactivar la verificación en dos pasos de{' '}
                            <strong>{confirmDisable.fullName}</strong>?{' '}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${roleBadge(confirmDisable.role)}`}>
                                {roleLabel(confirmDisable.role)}
                            </span>
                        </p>
                        <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 mb-6">
                            El usuario podrá iniciar sesión sin 2FA. Se recomienda pedirle que lo reactive desde su perfil en cuanto recupere el acceso.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setConfirmDisable(null)}
                                className="btn-secondary text-sm px-4 py-2"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => disable2FAMut.mutate(confirmDisable.userId)}
                                disabled={disable2FAMut.isPending}
                                className="bg-orange-600 hover:bg-orange-700 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                            >
                                {disable2FAMut.isPending ? 'Desactivando…' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ════════════════════════════════════════════════════════════════
// SECCIÓN DE ADMINS (solo para SuperAdmin)
// ════════════════════════════════════════════════════════════════

const AdminsSection = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [confirmReactivate, setConfirmReactivate] = useState(null);
    const [confirmDisable2FA, setConfirmDisable2FA] = useState(null);

    const isSuperAdmin = user?.role === 'Admin' && user?.isSuperAdmin === true;

    const { data: admins = [], isLoading } = useQuery({
        queryKey: ['admins-list'],
        queryFn: adminService.getAdmins,
        enabled: isSuperAdmin,
    });

    const deactivateMut = useMutation({
        mutationFn: (id) => adminService.deactivateAdmin(id),
        onSuccess: () => {
            qc.invalidateQueries(['admins-list']);
            qc.invalidateQueries(['admin-stats']);
            setConfirmDelete(null);
        },
    });

    const reactivateMut = useMutation({
        mutationFn: (id) => adminService.reactivateAdmin(id),
        onSuccess: () => {
            qc.invalidateQueries(['admins-list']);
            qc.invalidateQueries(['admin-stats']);
            setConfirmReactivate(null);
        },
    });

    const disable2FAMut = useMutation({
        mutationFn: (userId) => adminService.disable2FA(userId),
        onSuccess: () => {
            qc.invalidateQueries(['admins-list']);
            setConfirmDisable2FA(null);
        },
    });

    if (!isSuperAdmin) {
        return null;
    }

    return (
        <div className="mt-10 pt-8 border-t-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                        <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Gestión de Administradores</h2>
                        <p className="text-sm text-gray-500">
                            {admins.length} administrador{admins.length !== 1 ? 'es' : ''} en el sistema
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/admin/create')}
                    className="flex items-center gap-2 btn-primary px-5 py-2.5"
                >
                    <UserPlus className="w-4 h-4" />
                    Nuevo administrador
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            {['Nombre', 'Email', 'Departamento', 'Tipo', '2FA', 'Estado', 'Fecha de alta', 'Acciones'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            <tr><td colSpan={8} className="text-center py-10 text-gray-400">Cargando…</td></tr>
                        ) : admins.length === 0 ? (
                            <tr><td colSpan={8} className="text-center py-10 text-gray-400">No hay administradores registrados</td></tr>
                        ) : admins.map(admin => (
                            <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-gray-900">{admin.fullName}</td>
                                <td className="px-4 py-3 text-gray-600">{admin.email}</td>
                                <td className="px-4 py-3 text-gray-500 text-xs">{admin.department || '—'}</td>
                                <td className="px-4 py-3">
                                    {admin.isSuperAdmin ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                                            <Crown className="w-3 h-3" /> SuperAdmin
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                            <ShieldCheck className="w-3 h-3" /> Admin
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    {admin.twoFactorEnabled ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                            <ShieldCheck className="w-3 h-3" /> Activo
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-semibold">
                                            <ShieldOff className="w-3 h-3" /> Inactivo
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${admin.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                        {admin.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-xs">
                                    {new Date(admin.createdAt).toLocaleDateString('es-ES')}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col gap-1.5">
                                        {!admin.isSuperAdmin && (
                                            admin.isActive ? (
                                                <button onClick={() => setConfirmDelete(admin)}
                                                    className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" /> Desactivar
                                                </button>
                                            ) : (
                                                <button onClick={() => setConfirmReactivate(admin)}
                                                    className="flex items-center gap-1 px-3 py-1.5 border border-green-200 text-green-600 hover:bg-green-50 rounded-lg text-xs font-medium transition-colors">
                                                    <CheckCircle className="w-3.5 h-3.5" /> Reactivar
                                                </button>
                                            )
                                        )}
                                        {admin.twoFactorEnabled && (
                                            <button onClick={() => setConfirmDisable2FA(admin)}
                                                className="flex items-center gap-1 px-3 py-1.5 border border-orange-200 text-orange-600 hover:bg-orange-50 rounded-lg text-xs font-medium transition-colors">
                                                <ShieldOff className="w-3.5 h-3.5" /> Desactivar 2FA
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {confirmDelete && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="font-bold text-gray-900">Desactivar administrador</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">
                            ¿Desactivar a <strong>{confirmDelete.fullName}</strong>?<br />
                            Perderá el acceso al panel de administración.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setConfirmDelete(null)} className="btn-secondary text-sm px-4 py-2">
                                Cancelar
                            </button>
                            <button
                                onClick={() => deactivateMut.mutate(confirmDelete.id)}
                                disabled={deactivateMut.isPending}
                                className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                            >
                                {deactivateMut.isPending ? 'Desactivando…' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmReactivate && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <h3 className="font-bold text-gray-900">Reactivar administrador</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">
                            ¿Reactivar a <strong>{confirmReactivate.fullName}</strong>?<br />
                            Recuperará el acceso al panel de administración.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setConfirmReactivate(null)} className="btn-secondary text-sm px-4 py-2">
                                Cancelar
                            </button>
                            <button
                                onClick={() => reactivateMut.mutate(confirmReactivate.id)}
                                disabled={reactivateMut.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                            >
                                {reactivateMut.isPending ? 'Reactivando…' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmDisable2FA && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <ShieldOff className="w-5 h-5 text-orange-600" />
                            </div>
                            <h3 className="font-bold text-gray-900">Desactivar 2FA</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                            ¿Desactivar la verificación en dos pasos de <strong>{confirmDisable2FA.fullName}</strong>?
                        </p>
                        <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 mb-6">
                            El usuario podrá iniciar sesión sin 2FA. Se recomienda pedirle que lo reactive de inmediato desde su perfil.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setConfirmDisable2FA(null)} className="btn-secondary text-sm px-4 py-2">
                                Cancelar
                            </button>
                            <button
                                onClick={() => disable2FAMut.mutate(confirmDisable2FA.userId)}
                                disabled={disable2FAMut.isPending}
                                className="bg-orange-600 hover:bg-orange-700 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                            >
                                {disable2FAMut.isPending ? 'Desactivando…' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ════════════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL
// ════════════════════════════════════════════════════════════════

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [tab, setTab] = useState('pending');
    const [filter, setFilter] = useState('active');
    const [modal, setModal] = useState(null);

    const invalidate = () => {
        qc.invalidateQueries(['admin-pending']);
        qc.invalidateQueries(['admin-doctors']);
        qc.invalidateQueries(['admin-stats']);
    };

    const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: adminService.getStats });
    const { data: pending = [], isLoading: lPend } = useQuery({
        queryKey: ['admin-pending'],
        queryFn: adminService.getPending,
        enabled: tab === 'pending'
    });
    const { data: doctors = [], isLoading: lAll } = useQuery({
        queryKey: ['admin-doctors', filter],
        queryFn: () => adminService.getAllDoctors(filter),
        enabled: tab === 'all'
    });

    const approveMut = useMutation({
        mutationFn: ({ id }) => adminService.approve(id),
        onSuccess: () => { invalidate(); setModal(null); },
    });
    const rejectMut = useMutation({
        mutationFn: ({ id, reason }) => adminService.reject(id, reason),
        onSuccess: () => { invalidate(); setModal(null); },
    });
    const deleteMut = useMutation({
        mutationFn: ({ id, reason }) => adminService.removeDoctor(id, reason),
        onSuccess: () => { invalidate(); setModal(null); },
    });

    return (
        <div className="container-custom py-8">

            {/* Cabecera */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
                        <p className="text-sm text-gray-500">
                            {user?.isSuperAdmin ? 'SuperAdmin · Acceso completo' : 'Administrador'}
                        </p>
                    </div>
                </div>

                {/* BOTONES DE GESTIÓN */}
                <div className="flex gap-3">
                    {/* BOTÓN DE ESPECIALIDADES */}
                    <button
                        onClick={() => navigate('/admin/specialties')}
                        className="flex items-center gap-2 btn-primary px-5 py-2.5"
                    >
                        <Stethoscope className="w-4 h-4" />
                        Gestionar Especialidades
                    </button>

                    {/* BOTÓN DE VÍDEOS */}
                    {/*<button*/}
                    {/*    onClick={() => navigate('/admin/videos')}*/}
                    {/*    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg px-5 py-2.5 transition-colors"*/}
                    {/*>*/}
                    {/*    <Video className="w-4 h-4" />*/}
                    {/*    Verificar Vídeos*/}
                    {/*</button>*/}
                </div>
            </div>

            {/* Estadísticas - con click en specialties */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                    icon={Clock}
                    label="Pendientes de revisión"
                    value={stats?.pendingReview}
                    color="bg-yellow-500"
                />
                <StatCard
                    icon={CheckCircle}
                    label="Profesionales activos"
                    value={stats?.activeProfessionals}
                    color="bg-green-500"
                />
                <StatCard
                    icon={Users}
                    label="Pacientes registrados"
                    value={stats?.totalPatients}
                    color="bg-blue-500"
                />
                <StatCard
                    icon={Stethoscope}
                    label="Especialidades"
                    value={stats?.totalSpecialties ?? 0}
                    color="bg-purple-500"
                    onClick={() => navigate('/admin/specialties')}
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
                {[
                    { key: 'pending', label: 'Pendientes', icon: Clock },
                    { key: 'all', label: 'Todos los profesionales', icon: Users },
                    { key: 'search', label: 'Buscar profesional', icon: Search },
                ].map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setTab(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                        <Icon className="w-4 h-4" />
                        {label}
                        {key === 'pending' && stats?.pendingReview > 0 && (
                            <span className="w-5 h-5 bg-yellow-500 text-white rounded-full text-xs flex items-center justify-center">
                                {stats.pendingReview}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab: Pendientes */}
            {tab === 'pending' && (
                <div className="space-y-3">
                    {lPend ? (
                        <p className="text-sm text-gray-400 text-center py-10">Cargando…</p>
                    ) : pending.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
                            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                            <p className="font-medium text-gray-500">Sin solicitudes pendientes</p>
                            <p className="text-sm text-gray-400 mt-1">Todos los profesionales han sido revisados.</p>
                        </div>
                    ) : pending.map(d => (
                        <PendingDoctorRow key={d.id} doctor={d}
                            onApprove={doc => setModal({ type: 'approve', doctor: doc })}
                            onReject={doc => setModal({ type: 'reject', doctor: doc })}
                        />
                    ))}
                </div>
            )}

            {/* Tab: Todos */}
            {tab === 'all' && (
                <div>
                    <div className="flex gap-2 mb-4 flex-wrap">
                        {['active', 'pending', 'rejected', 'deleted'].map(s => (
                            <button key={s} onClick={() => setFilter(s)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                {{ active: 'Activos', pending: 'Pendientes', rejected: 'Rechazados', deleted: 'Eliminados' }[s]}
                            </button>
                        ))}
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    {['Profesional', 'Especialidades', 'Precio', 'Estado', 'Valoración', 'Acciones'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {lAll ? (
                                    <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Cargando…</td></tr>
                                ) : doctors.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No hay profesionales en este estado.</td></tr>
                                ) : doctors.map(d => (
                                    <DoctorRow key={d.id} doctor={d}
                                        onDelete={doc => setModal({ type: 'delete', doctor: doc })}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab: Buscar profesional */}
            {tab === 'search' && <SearchDoctorsSection />}

            {/* Planes de Chat Premium */}
            <ChatPlansSection />

            {/* Configuración de plataforma - Solo SuperAdmin */}
            <PlatformSettingsSection />

            {/* Gestión de 2FA — Pacientes y Profesionales */}
            <TwoFactorManagementSection />

            {/* Sección de Admins - Solo SuperAdmin */}
            <AdminsSection />

            {/* Modales */}
            {modal?.type === 'approve' && (
                <ConfirmModal
                    title={`Aprobar a ${modal.doctor.fullName}`}
                    description="El profesional recibirá acceso completo y podrá recibir pacientes."
                    requireReason={false}
                    onConfirm={() => approveMut.mutate({ id: modal.doctor.id })}
                    onCancel={() => setModal(null)}
                />
            )}
            {modal?.type === 'reject' && (
                <ConfirmModal
                    title={`Rechazar a ${modal.doctor.fullName}`}
                    description="El profesional no podrá acceder a la plataforma. Recibirá un email con el motivo."
                    requireReason reasonLabel="Motivo del rechazo" danger
                    onConfirm={reason => rejectMut.mutate({ id: modal.doctor.id, reason })}
                    onCancel={() => setModal(null)}
                />
            )}
            {modal?.type === 'delete' && (
                <ConfirmModal
                    title={`Eliminar a ${modal.doctor.fullName}`}
                    description="El profesional perderá el acceso. Sus datos históricos se conservarán conforme al RGPD."
                    requireReason reasonLabel="Motivo de la eliminación" danger
                    onConfirm={reason => deleteMut.mutate({ id: modal.doctor.id, reason })}
                    onCancel={() => setModal(null)}
                />
            )}
        </div>
    );
};

export default AdminDashboard;