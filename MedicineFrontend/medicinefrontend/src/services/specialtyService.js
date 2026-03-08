// ═══════════════════════════════════════════════════════════════
// Frontend/src/services/specialtyService.js - CON SOFT DELETE
// ═══════════════════════════════════════════════════════════════

import api from './api';

const specialtyService = {
    /**
     * Obtener todas las especialidades ACTIVAS (público)
     * Para el dropdown de doctores
     */
    getActive: async () => {
        const response = await api.get('/specialties');
        return response.data;
    },

    /**
     * Obtener TODAS las especialidades NO ELIMINADAS (admin only)
     */
    getAll: async () => {
        const response = await api.get('/specialties/all');
        return response.data;
    },

    /**
     * Obtener TODAS incluyendo eliminadas (admin only)
     */
    getAllIncludingDeleted: async () => {
        const response = await api.get('/specialties/all-including-deleted');
        return response.data;
    },

    /**
     * Crear especialidad (admin only)
     */
    create: async (data) => {
        const response = await api.post('/specialties', data);
        return response.data;
    },

    /**
     * Actualizar especialidad - SOLO DESCRIPCIÓN (admin only)
     */
    update: async (id, data) => {
        const response = await api.put(`/specialties/${id}`, data);
        return response.data;
    },

    /**
     * SOFT DELETE - Archivar especialidad (admin only)
     */
    softDelete: async (id) => {
        const response = await api.delete(`/specialties/${id}`);
        return response.data;
    },

    /**
     * RESTAURAR especialidad archivada (admin only)
     */
    restore: async (id) => {
        const response = await api.post(`/specialties/${id}/restore`);
        return response.data;
    },

    /**
     * Activar/Desactivar especialidad (admin only)
     */
    toggleActive: async (id) => {
        const response = await api.patch(`/specialties/${id}/toggle`);
        return response.data;
    }
};

export default specialtyService;