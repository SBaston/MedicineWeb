import api from './api';

/**
 * Servicio para gestionar pacientes
 */
const patientService = {
    /**
     * Obtiene el perfil del paciente actual
     */
    getMyProfile: async () => {
        const response = await api.get('/patients/me');
        // El backend devuelve { patient, profileCompletion, isProfileComplete }
        return response.data;
    },

    /**
     * Actualiza el perfil del paciente
     */
    updateProfile: async (data) => {
        const response = await api.put('/patients/me', data);
        return response.data;
    },

    /**
     * Calcula el porcentaje de completitud del perfil
     */
    getProfileCompletion: (profileData) => {
        // Si el backend ya lo calculó, usarlo
        if (profileData.profileCompletion !== undefined) {
            return profileData.profileCompletion;
        }

        // Fallback: calcular en el frontend
        const patient = profileData.patient || profileData;
        const fields = [
            patient.phoneNumber,
            patient.address,
            patient.city,
            patient.postalCode,
            patient.gender,
            patient.profilePictureUrl,
        ];

        const completed = fields.filter(field => field && field.trim() !== '').length;
        const total = fields.length;

        return Math.round((completed / total) * 100);
    },

    /**
     * Obtiene los campos faltantes del perfil
     */
    getMissingFields: (profileData) => {
        const patient = profileData.patient || profileData;
        const missing = [];

        if (!patient.phoneNumber) missing.push('Teléfono');
        if (!patient.address) missing.push('Dirección');
        if (!patient.city) missing.push('Ciudad');
        if (!patient.postalCode) missing.push('Código postal');
        if (!patient.gender) missing.push('Género');
        if (!patient.profilePictureUrl) missing.push('Foto de perfil');

        return missing;
    },
};

export default patientService;