import api from './api';

const professionalsService = {
    /**
     * Busca profesionales con filtros
     * @param {Object} filters - { search, specialty, minRating, maxPrice, sortBy }
     */
    search: async ({ search = '', specialty = '', minRating = '', maxPrice = '', sortBy = 'rating' } = {}) => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (specialty) params.append('specialty', specialty);
        if (minRating) params.append('minRating', minRating);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (sortBy) params.append('sortBy', sortBy);

        const response = await api.get(`/doctors?${params.toString()}`);
        return response.data;
    },

    /** Devuelve todas las especialidades para el filtro */
    getSpecialties: async () => {
        const response = await api.get('/specialties');
        return response.data;
    },

    /** Detalle de un profesional */
    getById: async (id) => {
        const response = await api.get(`/doctors/${id}`);
        return response.data;
    },
};

export default professionalsService;