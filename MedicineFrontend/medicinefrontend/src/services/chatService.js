// ═══════════════════════════════════════════════════════════════
// services/chatService.js
// API calls para el sistema de chat premium
// ═══════════════════════════════════════════════════════════════
import api from './api';

const chatService = {
    // ── Planes (públicos) ──────────────────────────────────────
    getActivePlans: async () => {
        const res = await api.get('/chat/plans');
        return res.data;
    },

    // ── Suscripciones del paciente ─────────────────────────────
    getMySubscriptions: async () => {
        const res = await api.get('/chat/subscriptions');
        return res.data;
    },

    getSubscriptionWithDoctor: async (doctorId) => {
        const res = await api.get(`/chat/subscriptions/doctor/${doctorId}`);
        return res.data;
    },

    // ── Checkout ───────────────────────────────────────────────
    createCheckout: async (doctorId, chatPlanId) => {
        const res = await api.post('/chat/checkout', { doctorId, chatPlanId });
        return res.data; // { checkoutUrl }
    },

    // ── Mensajes ───────────────────────────────────────────────
    getMessages: async (subscriptionId, page = 1) => {
        const res = await api.get(`/chat/messages/${subscriptionId}?page=${page}`);
        return res.data;
    },

    sendMessage: async (subscriptionId, content) => {
        const res = await api.post(`/chat/messages/${subscriptionId}`, { content });
        return res.data;
    },

    markRead: async (subscriptionId) => {
        await api.post(`/chat/messages/${subscriptionId}/read`);
    },

    // ── Doctor: sus suscripciones activas ─────────────────────
    getDoctorSubscriptions: async () => {
        const res = await api.get('/chat/doctor/subscriptions');
        return res.data;
    },

    // ── Admin: gestión de planes ───────────────────────────────
    admin: {
        getPlans: async () => {
            const res = await api.get('/admin/chat/plans');
            return res.data;
        },
        createPlan: async (dto) => {
            const res = await api.post('/admin/chat/plans', dto);
            return res.data;
        },
        updatePlan: async (id, dto) => {
            const res = await api.put(`/admin/chat/plans/${id}`, dto);
            return res.data;
        },
        deactivatePlan: async (id) => {
            const res = await api.delete(`/admin/chat/plans/${id}`);
            return res.data;
        },
        getStats: async () => {
            const res = await api.get('/admin/chat/stats');
            return res.data;
        },
    },
};

export default chatService;
