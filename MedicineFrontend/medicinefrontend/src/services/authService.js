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

    // ── 2FA ──────────────────────────────────────────────────────
    /** Paso 2 del login: verifica el código TOTP y devuelve el JWT */
    verifyTwoFactorLogin: async (userId, code) => {
        const response = await api.post('/auth/2fa/login-verify', { userId, code });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    /** Genera el secreto TOTP y devuelve la URI para el QR */
    setupTwoFactor: async () => {
        const response = await api.post('/auth/2fa/setup');
        return response.data; // { otpAuthUri, manualEntryKey }
    },

    /** Activa definitivamente el 2FA. Devuelve { message, recoveryCodes: string[] } */
    enableTwoFactor: async (code) => {
        const response = await api.post('/auth/2fa/enable', { code });
        return response.data; // { message, recoveryCodes }
    },

    /** Desactiva el 2FA verificando el código actual */
    disableTwoFactor: async (code) => {
        const response = await api.post('/auth/2fa/disable', { code });
        return response.data;
    },

    /** Paso 2 del login usando un código de recuperación en lugar del TOTP */
    useRecoveryCode: async (userId, code) => {
        const response = await api.post('/auth/2fa/use-recovery-code', { userId, code });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },
};

export default authService;