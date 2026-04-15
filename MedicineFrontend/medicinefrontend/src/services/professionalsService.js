// ═══════════════════════════════════════════════════════════════
// services/professionalsService.js
// ✅ Servicio completo para buscar profesionales y ver sus perfiles
// ✅ Incluye obtención de videos publicados
// ═══════════════════════════════════════════════════════════════

import api from './api';

const professionalsService = {
    /**
     * Buscar profesionales con filtros
     */
    search: async (filters = {}) => {
        const params = new URLSearchParams();

        if (filters.search) params.append('search', filters.search);
        if (filters.specialty) params.append('specialty', filters.specialty);
        if (filters.minRating) params.append('minRating', filters.minRating);
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
        if (filters.sortBy) params.append('sortBy', filters.sortBy);

        const response = await api.get(`/professionals/search?${params.toString()}`);
        return response.data;
    },

    /**
     * Obtener detalles completos de un profesional por ID
     */
    getById: async (id) => {
        const response = await api.get(`/professionals/${id}`);
        return response.data;
    },

    /**
     * Obtener videos de un profesional
     */
    getVideos: async (doctorId) => {
        const response = await api.get(`/professionals/${doctorId}/videos`);
        return response.data;
    },

    /**
     * Obtener especialidades disponibles
     */
    getSpecialties: async () => {
        const response = await api.get('/specialties');
        return response.data;
    },

    /**
     * Obtener reviews de un profesional
     */
    getReviews: async (doctorId) => {
        const response = await api.get(`/professionals/${doctorId}/reviews`);
        return response.data;
    },

    /**
     * Obtener disponibilidad de un profesional
     */
    getAvailability: async (doctorId) => {
        const response = await api.get(`/professionals/${doctorId}/availability`);
        return response.data;
    }
};

export default professionalsService;