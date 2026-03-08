// ═══════════════════════════════════════════════════════════════
// Frontend/src/services/doctorService.js
// Servicio para registro y gestión de doctores
// ═══════════════════════════════════════════════════════════════

import api from './api';

const doctorService = {
    /**
     * Validar documento con OCR antes del registro completo
     */
    validateDocument: async (imageBase64) => {
        const response = await api.post('/doctors/validate-document', {
            imageBase64
        });
        return response.data;
    },

    /**
     * Registro completo de doctor
     */
    register: async (data) => {
        const response = await api.post('/doctors/register', {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
            professionalLicense: data.professionalLicense,
            specialtyIds: data.specialtyIds, // Array de IDs
            yearsOfExperience: data.yearsOfExperience,
            pricePerSession: data.pricePerSession,
            description: data.description,
            phoneNumber: data.phoneNumber,
            professionalLicenseImage: data.professionalLicenseImage,
            idDocumentImage: data.idDocumentImage,
            degreeImage: data.degreeImage
        });
        return response.data;
    },

    /**
     * Obtener información de un doctor
     */
    getById: async (id) => {
        const response = await api.get(`/doctors/${id}`);
        return response.data;
    },

    /**
     * Verificar si un email ya está registrado
     */
    checkEmailAvailability: async (email) => {
        const response = await api.get(`/doctors/check-email?email=${encodeURIComponent(email)}`);
        return response.data;
    }
};

export default doctorService;