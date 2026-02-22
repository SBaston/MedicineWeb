import api from './api';

/**
 * Servicio para gestionar doctores
 */
const doctorService = {
    /**
     * Obtiene todos los doctores (con filtros opcionales)
     */
    getAllDoctors: async (filters = {}) => {
        const params = new URLSearchParams();

        if (filters.specialtyId) {
            params.append('specialtyId', filters.specialtyId);
        }
        if (filters.search) {
            params.append('search', filters.search);
        }
        if (filters.minRating) {
            params.append('minRating', filters.minRating);
        }

        const response = await api.get(`/doctors?${params.toString()}`);
        return response.data;
    },

    /**
     * Obtiene un doctor por ID
     */
    getDoctorById: async (id) => {
        const response = await api.get(`/doctors/${id}`);
        return response.data;
    },

    /**
     * Obtiene las especialidades médicas
     */
    getSpecialties: async () => {
        const response = await api.get('/specialties');
        return response.data;
    },

    /**
     * Obtiene los videos de redes sociales de un doctor
     */
    getDoctorVideos: async (doctorId) => {
        const response = await api.get(`/doctors/${doctorId}/videos`);
        return response.data;
    },

    /**
     * Obtiene las valoraciones de un doctor
     */
    getDoctorReviews: async (doctorId) => {
        const response = await api.get(`/doctors/${doctorId}/reviews`);
        return response.data;
    },

    /**
     * Obtiene la disponibilidad de un doctor
     */
    getDoctorAvailability: async (doctorId) => {
        const response = await api.get(`/doctors/${doctorId}/availability`);
        return response.data;
    },
};

export default doctorService;