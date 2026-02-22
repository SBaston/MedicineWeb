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
    // ══════════════════════════════════════════════════════════════
    getPending: () => api.get('/admin/doctors/pending').then(r => r.data),
    getAllDoctors: (status = '') => api.get(`/admin/doctors${status ? `?status=${status}` : ''}`).then(r => r.data),
    approve: (id) => api.put(`/admin/doctors/${id}/approve`).then(r => r.data),
    reject: (id, reason) => api.put(`/admin/doctors/${id}/reject`, { reason }).then(r => r.data),
    removeDoctor: (id, reason) => api.delete(`/admin/doctors/${id}`, { data: { reason } }).then(r => r.data),

    // ══════════════════════════════════════════════════════════════
    // GESTIÓN DE ADMINS (solo SuperAdmin)
    // ══════════════════════════════════════════════════════════════
    getAdmins: () => api.get('/admin/admins').then(r => r.data),
    createAdmin: (data) => api.post('/admin/admins', data).then(r => r.data),
    deactivateAdmin: (id) => api.delete(`/admin/admins/${id}`).then(r => r.data),
};

export default adminService;