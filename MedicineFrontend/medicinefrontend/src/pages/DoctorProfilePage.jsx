// ═══════════════════════════════════════════════════════════════
// DoctorProfilePage.jsx - Vista del perfil del doctor
// ✅ Avatar posicionado correctamente sin colapsar con el cover
// ✅ Especialidades visibles correctamente
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Phone, Briefcase, DollarSign, Star,
    Calendar, Award, Edit, ArrowLeft,
    FileText, Stethoscope, TrendingUp
} from 'lucide-react';
import doctorDashboardService from '../services/doctordashboardService';

const DoctorProfilePage = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const [profileData, statsData] = await Promise.all([
                doctorDashboardService.getProfile(),
                doctorDashboardService.getStats()
            ]);

            console.log('📋 Profile Data:', profileData);
            console.log('📊 Stats Data:', statsData);

            setProfile(profileData);
            setStats(statsData);
        } catch (error) {
            console.error('Error al cargar perfil:', error);
            alert('Error al cargar el perfil');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Cargando perfil...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-600">Error al cargar el perfil</p>
            </div>
        );
    }

    const fullName = `${profile.firstName} ${profile.lastName}`;
    const avatarUrl = profile.profilePictureUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=3b82f6&color=fff&size=200&bold=true`;

    // ✅ Manejar especialidades
    const getSpecialties = () => {
        if (!profile.specialties || !Array.isArray(profile.specialties)) {
            return [];
        }

        return profile.specialties.map(s => {
            if (typeof s === 'string') return s;
            if (typeof s === 'object' && s !== null) {
                return s.name || s.specialtyName || s.Name || s.SpecialtyName || 'Especialidad';
            }
            return 'Especialidad';
        }).filter(Boolean);
    };

    const specialties = getSpecialties();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate('/doctor/dashboard')}
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Volver al dashboard
                        </button>

                        <button
                            onClick={() => navigate('/doctor/profile/complete')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                            Editar perfil
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Profile Header Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden mb-8">
                    {/* Cover gradient - ✅ Altura aumentada para evitar colapso */}
                    <div className="h-40 bg-gradient-to-r from-blue-600 to-indigo-600"></div>

                    {/* ✅ Contenedor con padding top para el avatar */}
                    <div className="px-8 pb-8 pt-4">
                        {/* Avatar and basic info */}
                        <div className="flex flex-col md:flex-row md:items-start gap-6 -mt-16">
                            {/* ✅ Avatar con z-index para estar por encima */}
                            <div className="relative z-10 flex-shrink-0">
                                <img
                                    src={avatarUrl}
                                    alt={fullName}
                                    className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl object-cover"
                                />
                            </div>

                            {/* ✅ Info con margin top para alinearse correctamente */}
                            <div className="flex-1 mt-0 md:mt-12">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                    <div>
                                        <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                            Dr. {fullName}
                                        </h1>
                                        {/* Especialidades */}
                                        {specialties.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {specialties.map((specialty, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                                                    >
                                                        {specialty}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Rating */}
                                    {stats && (
                                        <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-lg flex-shrink-0">
                                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                            <span className="font-bold text-slate-900">{stats.averageRating.toFixed(1)}</span>
                                            <span className="text-sm text-slate-600">({stats.totalReviews} reseñas)</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick stats */}
                        {stats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
                                <div className="text-center">
                                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-2">
                                        <Briefcase className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">{profile.yearsOfExperience || 0}</p>
                                    <p className="text-sm text-slate-600">Años experiencia</p>
                                </div>

                                <div className="text-center">
                                    <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl mx-auto mb-2">
                                        <DollarSign className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">€{profile.pricePerSession}</p>
                                    <p className="text-sm text-slate-600">Por sesión</p>
                                </div>

                                <div className="text-center">
                                    <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mx-auto mb-2">
                                        <User className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">{stats.activePatients || 0}</p>
                                    <p className="text-sm text-slate-600">Pacientes</p>
                                </div>

                                <div className="text-center">
                                    <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl mx-auto mb-2">
                                        <Calendar className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">{stats.upcomingAppointments || 0}</p>
                                    <p className="text-sm text-slate-600">Citas próximas</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* About Me */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                Sobre mí
                            </h2>
                            {profile.description ? (
                                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{profile.description}</p>
                            ) : (
                                <div className="text-center py-8">
                                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-400 italic">No hay descripción disponible</p>
                                    <button
                                        onClick={() => navigate('/doctor/profile/complete')}
                                        className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                    >
                                        Añadir biografía →
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Specialties Detail */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Stethoscope className="w-5 h-5 text-blue-600" />
                                Especialidades
                            </h2>
                            {specialties.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {specialties.map((specialty, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100"
                                        >
                                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Award className="w-5 h-5 text-white" />
                                            </div>
                                            <span className="font-medium text-slate-900">{specialty}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-400 italic">No hay especialidades registradas</p>
                                </div>
                            )}
                        </div>

                        {/* Professional Info */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Award className="w-5 h-5 text-blue-600" />
                                Información profesional
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                    <FileText className="w-5 h-5 text-slate-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-slate-600 mb-1">Número de colegiado</p>
                                        <p className="font-semibold text-slate-900">{profile.professionalLicense}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                    <Briefcase className="w-5 h-5 text-slate-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-slate-600 mb-1">Años de experiencia</p>
                                        <p className="font-semibold text-slate-900">
                                            {profile.yearsOfExperience ? `${profile.yearsOfExperience} años` : 'No especificado'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-slate-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-slate-600 mb-1">Precio por sesión</p>
                                        <p className="font-semibold text-slate-900">€{profile.pricePerSession}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Contact Info */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Mail className="w-5 h-5 text-blue-600" />
                                Información de contacto
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Email</p>
                                        <p className="text-sm font-medium text-slate-900 break-all">{profile.email}</p>
                                    </div>
                                </div>

                                {profile.phoneNumber && (
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Teléfono</p>
                                            <p className="text-sm font-medium text-slate-900">{profile.phoneNumber}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats Summary */}
                        {stats && (
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5" />
                                    Resumen de actividad
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between pb-3 border-b border-white/20">
                                        <span className="text-blue-100">Cursos publicados</span>
                                        <span className="font-bold text-xl">{stats.publishedCourses || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between pb-3 border-b border-white/20">
                                        <span className="text-blue-100">Vídeos activos</span>
                                        <span className="font-bold text-xl">{stats.uploadedVideos || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-blue-100">Valoración</span>
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                                            <span className="font-bold text-xl">{stats.averageRating.toFixed(1)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorProfilePage;