import api from './api';

/**
 * Servicio de autenticación
 */
const authService = {
    /**
     * Registra un nuevo usuario
     */
    register: async (data) => {
        const response = await api.post('/auth/register', data);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    /**
     * Inicia sesión
     */
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    /**
     * Cierra sesión
     */
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    /**
     * Obtiene el usuario actual del localStorage
     */
    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    /**
     * Verifica si hay un usuario autenticado
     */
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    /**
     * Verifica si un email está disponible
     */
    checkEmail: async (email) => {
        const response = await api.get(`/auth/check-email?email=${email}`);
        return response.data.exists;
    },
};

export default authService;