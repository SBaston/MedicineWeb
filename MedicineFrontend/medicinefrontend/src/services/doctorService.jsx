// ═══════════════════════════════════════════════════════════════
// Frontend/src/services/doctorService.js
// Servicio para registro y gestión de doctores
// ✅ ACTUALIZADO: 6 imágenes, sin OCR
// ═══════════════════════════════════════════════════════════════

import api from './api';

const doctorService = {
    /**
     * ✅ Registro completo de doctor con 6 imágenes
     */
    register: async (data) => {
        // Crear FormData para enviar imágenes
        const formData = new FormData();

        // Datos básicos
        formData.append('firstName', data.firstName);
        formData.append('lastName', data.lastName);
        formData.append('email', data.email);
        formData.append('password', data.password);
        formData.append('professionalLicense', data.professionalLicense);
        formData.append('yearsOfExperience', data.yearsOfExperience || 0);
        formData.append('pricePerSession', data.pricePerSession);

        // Opcionales
        if (data.description) formData.append('description', data.description);
        if (data.phoneNumber) formData.append('phoneNumber', data.phoneNumber);

        // Especialidades (array de IDs)
        if (data.specialtyIds && data.specialtyIds.length > 0) {
            data.specialtyIds.forEach(id => {
                formData.append('specialtyIds', id);
            });
        }

        // ✅ 6 IMÁGENES (Base64 a FormData)
        // OBLIGATORIAS
        if (data.professionalLicenseFront) {
            const blob1 = dataURLtoBlob(data.professionalLicenseFront);
            formData.append('professionalLicenseFront', blob1, 'license_front.jpg');
        }
        if (data.professionalLicenseBack) {
            const blob2 = dataURLtoBlob(data.professionalLicenseBack);
            formData.append('professionalLicenseBack', blob2, 'license_back.jpg');
        }

        // OPCIONALES
        if (data.idDocumentFront) {
            const blob3 = dataURLtoBlob(data.idDocumentFront);
            formData.append('idDocumentFront', blob3, 'id_front.jpg');
        }
        if (data.idDocumentBack) {
            const blob4 = dataURLtoBlob(data.idDocumentBack);
            formData.append('idDocumentBack', blob4, 'id_back.jpg');
        }
        if (data.specialtyDegree) {
            const blob5 = dataURLtoBlob(data.specialtyDegree);
            formData.append('specialtyDegree', blob5, 'specialty_degree.jpg');
        }
        if (data.universityDegree) {
            const blob6 = dataURLtoBlob(data.universityDegree);
            formData.append('universityDegree', blob6, 'university_degree.jpg');
        }
        if (data.profilePicture) {
            const blob7 = dataURLtoBlob(data.profilePicture);
            formData.append('profilePicture', blob7, 'profile.jpg');
        }

        const response = await api.post('/doctors/register', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
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

// ═══════════════════════════════════════════════════════════════
// HELPER: Convertir Base64 a Blob
// ═══════════════════════════════════════════════════════════════
function dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

export default doctorService;