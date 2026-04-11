// ═══════════════════════════════════════════════════════════════
// services/socialMediaService.js
// Servicio para gestión de redes sociales del doctor
// ═══════════════════════════════════════════════════════════════

import api from './api';

const socialMediaService = {
    // ══════════════════════════════════════════════════════════
    // REDES SOCIALES
    // ══════════════════════════════════════════════════════════

    /**
     * Obtener todas las redes sociales del doctor autenticado
     */
    getAll: async () => {
        try {
            const response = await api.get('/doctor/social-media');
            return response.data;
        } catch (error) {
            console.error('Error al obtener redes sociales:', error);
            throw error;
        }
    },

    /**
     * Añadir nueva red social
     * @param {Object} data - { platform, profileUrl, followerCount }
     */
    create: async (data) => {
        try {
            const response = await api.post('/doctor/social-media', data);
            return response.data;
        } catch (error) {
            console.error('Error al crear red social:', error);
            throw error;
        }
    },

    /**
     * Actualizar red social existente
     * @param {number} id - ID de la red social
     * @param {Object} data - { profileUrl, followerCount, isActive }
     */
    update: async (id, data) => {
        try {
            const response = await api.put(`/doctor/social-media/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Error al actualizar red social:', error);
            throw error;
        }
    },

    /**
     * Eliminar red social
     * @param {number} id - ID de la red social
     */
    delete: async (id) => {
        try {
            const response = await api.delete(`/doctor/social-media/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error al eliminar red social:', error);
            throw error;
        }
    },

    /**
     * Activar/Desactivar red social
     * @param {number} id - ID de la red social
     */
    toggle: async (id) => {
        try {
            const response = await api.patch(`/doctor/social-media/${id}/toggle`);
            return response.data;
        } catch (error) {
            console.error('Error al cambiar estado de red social:', error);
            throw error;
        }
    },

    // ══════════════════════════════════════════════════════════
    // TÉRMINOS Y CONDICIONES
    // ══════════════════════════════════════════════════════════

    /**
     * Verificar si el doctor ha aceptado términos de contenido
     */
    getConsentStatus: async () => {
        try {
            const response = await api.get('/doctor/content-terms/status');
            return response.data;
        } catch (error) {
            console.error('Error al verificar términos:', error);
            throw error;
        }
    },

    /**
     * Aceptar términos de contenido (normalmente se hace en el registro)
     * @param {string} termsVersion - Versión de los términos (default: 'v1.0')
     */
    acceptTerms: async (termsVersion = 'v1.0') => {
        try {
            const response = await api.post('/doctor/content-terms/accept', {
                acceptTerms: true,
                termsVersion
            });
            return response.data;
        } catch (error) {
            console.error('Error al aceptar términos:', error);
            throw error;
        }
    },
};

export default socialMediaService;