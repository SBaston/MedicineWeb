// ═══════════════════════════════════════════════════════════════
// services/appointmentService.js
// Servicio para gestión de citas médicas
// ═══════════════════════════════════════════════════════════════

import api from './api';

const appointmentService = {
    /**
     * Obtiene los slots disponibles de un profesional para una fecha
     * @param {number} doctorId
     * @param {string} date  Formato YYYY-MM-DD
     */
    getAvailableSlots: async (doctorId, date) => {
        const response = await api.get(`/appointments/available-slots/${doctorId}`, {
            params: { date },
        });
        return response.data;
    },

    /**
     * Reserva una cita (solo pacientes autenticados)
     * @param {{ doctorId, appointmentDate, appointmentType, reason }} data
     */
    book: async (data) => {
        const response = await api.post('/appointments', data);
        return response.data;
    },

    /**
     * Obtiene las citas del paciente autenticado
     */
    getMyAppointments: async () => {
        const response = await api.get('/appointments/my');
        return response.data;
    },

    /**
     * Cancela una cita
     * @param {number} appointmentId
     * @param {string} reason
     */
    cancel: async (appointmentId, reason = '') => {
        const response = await api.put(`/appointments/${appointmentId}/cancel`, { reason });
        return response.data;
    },

    // ─── Doctor ───────────────────────────────────────────────

    /**
     * Obtiene las citas del doctor autenticado
     */
    getDoctorAppointments: async () => {
        const response = await api.get('/doctor/appointments');
        return response.data;
    },

    /**
     * El doctor añade el enlace de videollamada a una cita online
     * @param {number} appointmentId
     * @param {{ meetingLink, platform }} data
     */
    addMeetingLink: async (appointmentId, data) => {
        const response = await api.post(`/doctor/appointments/${appointmentId}/meeting-link`, data);
        return response.data;
    },
};

export default appointmentService;
