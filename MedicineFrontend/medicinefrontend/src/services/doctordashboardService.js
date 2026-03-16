// ═══════════════════════════════════════════════════════════════
// services/doctorDashboardService.js
// Servicio para conectar con el backend del dashboard
// ═══════════════════════════════════════════════════════════════

import api from './api';

const doctorDashboardService = {
    // ══════════════════════════════════════════════════════════
    // DASHBOARD STATS
    // ══════════════════════════════════════════════════════════
    getStats: async () => {
        const response = await api.get('/doctor/stats');
        return response.data;
    },

    // ══════════════════════════════════════════════════════════
    // PROFILE
    // ══════════════════════════════════════════════════════════
    getProfile: async () => {
        const response = await api.get('/doctor/profile');
        return response.data;
    },

    updateProfile: async (data) => {
        const response = await api.put('/doctor/profile', data);
        return response.data;
    },

    uploadProfilePicture: async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/doctor/profile/picture', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    // ══════════════════════════════════════════════════════════
    // AVAILABILITY
    // ══════════════════════════════════════════════════════════
    getAvailabilities: async () => {
        const response = await api.get('/doctor/availability');
        return response.data;
    },

    createAvailability: async (data) => {
        const response = await api.post('/doctor/availability', data);
        return response.data;
    },

    updateAvailability: async (id, data) => {
        const response = await api.put(`/doctor/availability/${id}`, data);
        return response.data;
    },

    deleteAvailability: async (id) => {
        const response = await api.delete(`/doctor/availability/${id}`);
        return response.data;
    },

    // ══════════════════════════════════════════════════════════
    // VIDEOS
    // ══════════════════════════════════════════════════════════
    getVideos: async () => {
        const response = await api.get('/doctor/videos');
        return response.data;
    },

    createVideo: async (data) => {
        const response = await api.post('/doctor/videos', data);
        return response.data;
    },

    updateVideo: async (id, data) => {
        const response = await api.put(`/doctor/videos/${id}`, data);
        return response.data;
    },

    deleteVideo: async (id) => {
        const response = await api.delete(`/doctor/videos/${id}`);
        return response.data;
    },

    toggleVideoStatus: async (id) => {
        const response = await api.patch(`/doctor/videos/${id}/toggle`);
        return response.data;
    },

    // ══════════════════════════════════════════════════════════
    // EARNINGS
    // ══════════════════════════════════════════════════════════
    getEarnings: async (timeRange = 'month', filterType = 'all') => {
        const response = await api.get('/doctor/earnings', {
            params: { timeRange, filterType }
        });
        return response.data;
    },

    // ══════════════════════════════════════════════════════════
    // PRICING
    // ══════════════════════════════════════════════════════════
    getPricing: async () => {
        const response = await api.get('/doctor/pricing');
        return response.data;
    },

    updatePricing: async (data) => {
        const response = await api.put('/doctor/pricing', data);
        return response.data;
    },

    // ══════════════════════════════════════════════════════════
    // COURSES
    // ══════════════════════════════════════════════════════════
    getCourses: async () => {
        const response = await api.get('/doctor/courses');
        return response.data;
    },

    getCourse: async (id) => {
        const response = await api.get(`/doctor/courses/${id}`);
        return response.data;
    },

    createCourse: async (data) => {
        const response = await api.post('/doctor/courses', data);
        return response.data;
    },

    updateCourse: async (id, data) => {
        const response = await api.put(`/doctor/courses/${id}`, data);
        return response.data;
    },

    deleteCourse: async (id) => {
        const response = await api.delete(`/doctor/courses/${id}`);
        return response.data;
    },

    publishCourse: async (id) => {
        const response = await api.post(`/doctor/courses/${id}/publish`);
        return response.data;
    },

    uploadCourseCover: async (id, file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post(`/doctor/courses/${id}/cover-image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    // ══════════════════════════════════════════════════════════
    // COURSE MODULES
    // ══════════════════════════════════════════════════════════
    createModule: async (courseId, data) => {
        const response = await api.post(`/doctor/courses/${courseId}/modules`, data);
        return response.data;
    },

    updateModule: async (courseId, moduleId, data) => {
        const response = await api.put(`/doctor/courses/${courseId}/modules/${moduleId}`, data);
        return response.data;
    },

    deleteModule: async (courseId, moduleId) => {
        const response = await api.delete(`/doctor/courses/${courseId}/modules/${moduleId}`);
        return response.data;
    }
};

export default doctorDashboardService;