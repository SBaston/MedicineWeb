// ═══════════════════════════════════════════════════════════════
// components/SocialMediaSection.jsx
// Componente para gestionar redes sociales del doctor
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Youtube, Instagram, Facebook, Twitter, Linkedin, Plus,
    Edit2, Trash2, Eye, EyeOff, Music, AlertCircle, X, TrendingUp
} from 'lucide-react';
import socialMediaService from '../services/socialMediaService';

// Configuración de plataformas con sus iconos y colores
const PLATFORMS = {
    YouTube: {
        icon: Youtube,
        color: 'red',
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        placeholder: 'youtube.com/@tu-canal o @tu-canal'
    },
    Instagram: {
        icon: Instagram,
        color: 'pink',
        bgColor: 'bg-pink-100',
        textColor: 'text-pink-600',
        placeholder: '@tu_usuario o instagram.com/tu_usuario'
    },
    TikTok: {
        icon: Music,
        color: 'black',
        bgColor: 'bg-gray-900',
        textColor: 'text-white',
        placeholder: '@tu_usuario o tiktok.com/@tu_usuario'
    },
    Facebook: {
        icon: Facebook,
        color: 'blue',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        placeholder: 'facebook.com/tu-pagina'
    },
    Twitter: {
        icon: Twitter,
        color: 'blue',
        bgColor: 'bg-sky-100',
        textColor: 'text-sky-600',
        placeholder: '@tu_usuario o x.com/tu_usuario'
    },
    LinkedIn: {
        icon: Linkedin,
        color: 'blue',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        placeholder: 'linkedin.com/in/tu-perfil'
    },
};

const SocialMediaSection = () => {
    const queryClient = useQueryClient();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);

    // Obtener redes sociales del doctor
    const { data: socialAccounts = [], isLoading, error } = useQuery({
        queryKey: ['social-media'],
        queryFn: socialMediaService.getAll
    });

    // Mutation para eliminar
    const deleteMutation = useMutation({
        mutationFn: (id) => socialMediaService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['social-media']);
        }
    });

    // Mutation para toggle (activar/desactivar)
    const toggleMutation = useMutation({
        mutationFn: (id) => socialMediaService.toggle(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['social-media']);
        }
    });

    const handleDelete = async (account) => {
        if (window.confirm(`¿Eliminar ${account.platform} de tu perfil?`)) {
            try {
                await deleteMutation.mutateAsync(account.id);
            } catch (error) {
                alert('Error al eliminar la red social');
            }
        }
    };

    const handleToggle = async (accountId) => {
        try {
            await toggleMutation.mutateAsync(accountId);
        } catch (error) {
            alert('Error al cambiar el estado de la red social');
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Cargando redes sociales...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-semibold text-red-900 mb-2">
                            Error al cargar redes sociales
                        </h3>
                        <p className="text-red-800 text-sm">
                            {error.message || 'No se pudieron cargar tus redes sociales'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                            Mis Redes Sociales
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Vincula tus redes para destacar en la plataforma y atraer más pacientes
                        </p>
                    </div>
                    {socialAccounts.length < Object.keys(PLATFORMS).length && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                        >
                            <Plus className="w-4 h-4" />
                            Añadir Red Social
                        </button>
                    )}
                </div>

                {socialAccounts.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <Instagram className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No has añadido ninguna red social
                        </h3>
                        <p className="text-gray-600 mb-2">
                            Vincula tus redes para atraer más pacientes y destacar tu contenido
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            🎯 Los profesionales con redes sociales aparecen primero en las búsquedas
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold inline-flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Añadir mi primera red social
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {socialAccounts.map((account) => (
                            <SocialAccountCard
                                key={account.id}
                                account={account}
                                onEdit={() => setEditingAccount(account)}
                                onToggle={() => handleToggle(account.id)}
                                onDelete={() => handleDelete(account)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal para añadir/editar */}
            {(showAddModal || editingAccount) && (
                <AddEditSocialModal
                    account={editingAccount}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingAccount(null);
                    }}
                    onSuccess={() => {
                        queryClient.invalidateQueries(['social-media']);
                        setShowAddModal(false);
                        setEditingAccount(null);
                    }}
                    existingPlatforms={socialAccounts.map(a => a.platform)}
                />
            )}
        </>
    );
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTE: Tarjeta de red social
// ═══════════════════════════════════════════════════════════════

const SocialAccountCard = ({ account, onEdit, onToggle, onDelete }) => {
    const platform = PLATFORMS[account.platform];
    const Icon = platform?.icon || Instagram;

    return (
        <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
            <div className={`w-14 h-14 ${platform.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-7 h-7 ${platform.textColor}`} />
            </div>

            <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{account.platform}</p>
                <p className="text-sm text-gray-600 truncate">{account.profileUrl}</p>
                {account.followerCount && (
                    <p className="text-xs text-gray-500 mt-1">
                        {account.followerCount.toLocaleString()} seguidores
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onToggle}
                    className={`p-2 rounded-lg transition-colors ${account.isActive
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    title={account.isActive ? 'Ocultar del perfil' : 'Mostrar en perfil'}
                >
                    {account.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>

                <button
                    onClick={onEdit}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    title="Editar"
                >
                    <Edit2 className="w-5 h-5" />
                </button>

                <button
                    onClick={onDelete}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    title="Eliminar"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTE: Modal para añadir/editar red social
// ═══════════════════════════════════════════════════════════════

const AddEditSocialModal = ({ account, onClose, onSuccess, existingPlatforms }) => {
    const isEditing = !!account;
    const [formData, setFormData] = useState({
        platform: account?.platform || '',
        profileUrl: account?.profileUrl || '',
        followerCount: account?.followerCount || ''
    });
    const [error, setError] = useState('');

    const mutation = useMutation({
        mutationFn: (data) => {
            if (isEditing) {
                return socialMediaService.update(account.id, {
                    profileUrl: data.profileUrl,
                    followerCount: data.followerCount ? parseInt(data.followerCount) : null,
                    isActive: true
                });
            } else {
                return socialMediaService.create({
                    platform: data.platform,
                    profileUrl: data.profileUrl,
                    followerCount: data.followerCount ? parseInt(data.followerCount) : null
                });
            }
        },
        onSuccess: () => {
            onSuccess();
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'Error al guardar');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!formData.platform && !isEditing) {
            setError('Selecciona una plataforma');
            return;
        }

        if (!formData.profileUrl.trim()) {
            setError('Ingresa la URL o usuario de tu perfil');
            return;
        }

        mutation.mutate(formData);
    };

    const availablePlatforms = Object.keys(PLATFORMS).filter(
        p => !existingPlatforms.includes(p) || p === account?.platform
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900">
                        {isEditing ? 'Editar' : 'Añadir'} Red Social
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <span className="text-red-700 text-sm">{error}</span>
                        </div>
                    )}

                    {!isEditing && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Plataforma *
                            </label>
                            <select
                                value={formData.platform}
                                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Selecciona una plataforma</option>
                                {availablePlatforms.map(platform => (
                                    <option key={platform} value={platform}>{platform}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            URL o Usuario *
                        </label>
                        <input
                            type="text"
                            value={formData.profileUrl}
                            onChange={(e) => setFormData({ ...formData, profileUrl: e.target.value })}
                            placeholder={formData.platform ? PLATFORMS[formData.platform]?.placeholder : 'Ingresa URL o usuario'}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Ejemplo: @tu_usuario o la URL completa de tu perfil
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número de Seguidores (Opcional)
                        </label>
                        <input
                            type="number"
                            value={formData.followerCount}
                            onChange={(e) => setFormData({ ...formData, followerCount: e.target.value })}
                            placeholder="Ej: 1500"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="0"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-colors"
                        >
                            {mutation.isPending ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Añadir')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SocialMediaSection;