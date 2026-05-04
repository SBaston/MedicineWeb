// ═══════════════════════════════════════════════════════════════
// Frontend/src/services/adminService.js
// ✅ SISTEMA SIMPLIFICADO: Sin correcciones, solo aprobar/rechazar
// ═══════════════════════════════════════════════════════════════

import api from './api';

const adminService = {
    // ══════════════════════════════════════════════════════════════
    // DATOS DEL ADMIN LOGUEADO
    // ══════════════════════════════════════════════════════════════
    getMe: () => api.get('/admin/me').then(r => r.data),

    // ══════════════════════════════════════════════════════════════
    // DASHBOARD
    // ══════════════════════════════════════════════════════════════
    getStats: () => api.get('/admin/dashboard').then(r => r.data),

    // ══════════════════════════════════════════════════════════════
    // GESTIÓN DE PROFESIONALES
    // ✅ SIMPLIFICADO: Solo aprobar/rechazar
    // ══════════════════════════════════════════════════════════════
    getPending: () => api.get('/admin/doctors/pending').then(r => r.data),
    getAllDoctors: (status = '') => api.get(`/admin/doctors${status ? `?status=${status}` : ''}`).then(r => r.data),
    searchDoctors: (q = '') => api.get(`/admin/doctors${q ? `?search=${encodeURIComponent(q)}` : ''}`).then(r => r.data),
    getDoctorDetail: (id) => api.get(`/admin/doctors/${id}/detail`).then(r => r.data),
    approve: (id) => api.put(`/admin/doctors/${id}/approve`).then(r => r.data),
    reject: (id, reason) => api.put(`/admin/doctors/${id}/reject`, { reason }).then(r => r.data),
    removeDoctor: (id, reason) => api.delete(`/admin/doctors/${id}`, { data: { reason } }).then(r => r.data),

    // ══════════════════════════════════════════════════════════════
    // GESTIÓN DE ADMINS (solo SuperAdmin)
    // ══════════════════════════════════════════════════════════════
    getAdmins: () => api.get('/admin/admins').then(r => r.data),
    createAdmin: (data) => api.post('/admin/admins', data).then(r => r.data),
    deactivateAdmin: (id) => api.delete(`/admin/admins/${id}`).then(r => r.data),
    reactivateAdmin: (id) => api.put(`/admin/admins/${id}/reactivate`).then(r => r.data),

    // ══════════════════════════════════════════════════════════════
    // GESTIÓN DE VÍDEOS - Verificación por admin
    // ══════════════════════════════════════════════════════════════
    //getVideos: (filter = 'pending') => api.get(`/admin/videos?filter=${filter}`).then(r => r.data),
    //verifyVideo: (id, isVerified) => api.patch(`/admin/videos/${id}/verify`, { isVerified }).then(r => r.data),

    // ══════════════════════════════════════════════════════════════
    // GESTIÓN DE 2FA
    // ══════════════════════════════════════════════════════════════
    getUsersWith2FA: () => api.get('/admin/users/2fa-enabled').then(r => r.data),
    disable2FA: (userId) => api.delete(`/admin/users/${userId}/2fa`).then(r => r.data),

    // ══════════════════════════════════════════════════════════════
    // CONFIGURACIÓN DE PLATAFORMA (solo SuperAdmin)
    // ══════════════════════════════════════════════════════════════
    getSettings: () => api.get('/settings').then(r => r.data),
    updateSetting: (key, value) => api.put(`/settings/${key}`, { value }).then(r => r.data),
    seedSettings: () => api.post('/settings/seed').then(r => r.data),
};

export default adminService;