import api from './api';

const specialtyService = {
    // Público - Especialidades activas (para dropdown)
    getActive: async () => {
        const response = await api.get('/specialties');
        return response.data;
    },

    // Admin - Todas las especialidades
    getAll: async () => {
        const response = await api.get('/specialties/all');
        return response.data;
    },

    // Admin - Crear especialidad
    create: async (data) => {
        const response = await api.post('/specialties', data);
        return response.data;
    },

    // Admin - Actualizar especialidad
    update: async (id, data) => {
        const response = await api.put(`/specialties/${id}`, data);
        return response.data;
    },

    // Admin - Eliminar especialidad
    delete: async (id) => {
        const response = await api.delete(`/specialties/${id}`);
        return response.data;
    },

    // Admin - Toggle activo/inactivo
    toggleActive: async (id) => {
        const response = await api.patch(`/specialties/${id}/toggle`);
        return response.data;
    }
};

export default specialtyService;