// ═══════════════════════════════════════════════════════════════
// Frontend/src/services/professionalsService.js - CORREGIDO
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

        const response = await api.get(`/professionals?${params.toString()}`);
        return response.data;
    },

    /**
     * Obtener especialidades ACTIVAS (público)
     * Usado en ProfessionalsPage para el filtro de especialidades
     */
    getSpecialties: async () => {
        const response = await api.get('/specialties/active');  // ✅ CAMBIADO: de /specialties a /specialties/active
        return response.data;
    },

    /**
     * Obtener detalle de un profesional
     */
    getById: async (id) => {
        const response = await api.get(`/professionals/${id}`);
        return response.data;
    }
};

export default professionalsService;