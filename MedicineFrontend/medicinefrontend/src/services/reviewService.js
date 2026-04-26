// ═══════════════════════════════════════════════════════════════
// services/reviewService.js
// Gestión de reseñas: lectura pública, elegibilidad y creación
// ═══════════════════════════════════════════════════════════════

import api from './api';

const reviewService = {
    /**
     * Reseñas visibles de un profesional (público, sin autenticación)
     */
    getDoctorReviews: async (doctorId) => {
        const response = await api.get(`/reviews/doctor/${doctorId}`);
        return response.data;
    },

    /**
     * Citas completadas del paciente con este doctor que aún no tienen reseña.
     * Solo pacientes autenticados. Lista vacía → no puede reseñar.
     */
    getEligibleAppointments: async (doctorId) => {
        const response = await api.get(`/reviews/eligible/${doctorId}`);
        return response.data;
    },

    /**
     * Crear una nueva reseña.
     * @param {{ doctorId, appointmentId, rating, comment? }} dto
     */
    createReview: async (dto) => {
        const response = await api.post('/reviews', dto);
        return response.data;
    },
};

export default reviewService;
