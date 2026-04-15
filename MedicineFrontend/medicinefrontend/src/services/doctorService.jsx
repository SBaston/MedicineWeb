// ═══════════════════════════════════════════════════════════════
// Frontend/src/services/doctorService.jsx
// ✅ CORREGIDO: specialtyIds maneja objetos y números
// ═══════════════════════════════════════════════════════════════

import api from './api';

const doctorService = {
    /**
     * ✅ Registro completo de doctor con 6 imágenes + términos + redes
     */
    register: async (data) => {
        // Crear FormData para enviar imágenes
        const formData = new FormData();

        // Datos personales
        formData.append('firstName', data.firstName);
        formData.append('lastName', data.lastName);
        formData.append('email', data.email);
        formData.append('password', data.password);

        // Datos profesionales
        formData.append('professionalLicense', data.professionalLicense);
        formData.append('yearsOfExperience', data.yearsOfExperience || 0);
        formData.append('pricePerSession', data.pricePerSession);

        // Opcionales
        if (data.description) formData.append('description', data.description);
        if (data.phoneNumber) formData.append('phoneNumber', data.phoneNumber);

        // ✅ CORREGIDO: Especialidades - Manejar objetos y números
        if (data.specialtyIds && data.specialtyIds.length > 0) {
            data.specialtyIds.forEach(item => {
                // Si es un objeto, extraer el id
                let id;
                if (typeof item === 'object' && item !== null) {
                    id = item.id || item.Id || item.ID;
                } else {
                    id = item;
                }

                // Convertir a número y añadir
                const numericId = parseInt(id);
                if (!isNaN(numericId)) {
                    formData.append('specialtyIds', numericId);
                }
            });
        }

        // ✅ Términos de contenido
        formData.append('acceptContentTerms', data.acceptContentTerms || false);
        formData.append('termsVersion', data.termsVersion || 'v1.0');

        // ✅ Redes sociales (opcional)
        if (data.socialMediaLinks && data.socialMediaLinks.length > 0) {
            formData.append('socialMediaLinks', JSON.stringify(data.socialMediaLinks));
        }

        // ✅ 6 IMÁGENES (Base64 a Blob)
        // OBLIGATORIAS
        if (data.professionalLicenseFront) {
            const blob1 = dataURLtoBlob(data.professionalLicenseFront);
            if (blob1) formData.append('professionalLicenseFront', blob1, 'license_front.jpg');
        }
        if (data.professionalLicenseBack) {
            const blob2 = dataURLtoBlob(data.professionalLicenseBack);
            if (blob2) formData.append('professionalLicenseBack', blob2, 'license_back.jpg');
        }

        // OBLIGATORIAS (DNI)
        if (data.idDocumentFront) {
            const blob3 = dataURLtoBlob(data.idDocumentFront);
            if (blob3) formData.append('idDocumentFront', blob3, 'id_front.jpg');
        }
        if (data.idDocumentBack) {
            const blob4 = dataURLtoBlob(data.idDocumentBack);
            if (blob4) formData.append('idDocumentBack', blob4, 'id_back.jpg');
        }

        // OBLIGATORIAS (Títulos) — extensión dinámica según tipo de archivo
        if (data.specialtyDegree) {
            const blob5 = dataURLtoBlob(data.specialtyDegree);
            const ext5 = data.specialtyDegree.startsWith('data:application/pdf') ? 'pdf' : 'jpg';
            if (blob5) formData.append('specialtyDegree', blob5, `specialty_degree.${ext5}`);
        }
        if (data.universityDegree) {
            const blob6 = dataURLtoBlob(data.universityDegree);
            const ext6 = data.universityDegree.startsWith('data:application/pdf') ? 'pdf' : 'jpg';
            if (blob6) formData.append('universityDegree', blob6, `university_degree.${ext6}`);
        }

        // OPCIONAL (Foto de perfil)
        if (data.profilePicture) {
            const blob7 = dataURLtoBlob(data.profilePicture);
            if (blob7) formData.append('profilePicture', blob7, 'profile.jpg');
        }

        // ✅ DEBUG: Ver qué se envía
        console.log('📦 FormData construido en doctorService:');
        for (let [key, value] of formData.entries()) {
            if (value instanceof Blob) {
                console.log(`  ${key}: Blob (${value.size} bytes)`);
            } else {
                console.log(`  ${key}: ${value}`);
            }
        }

        try {
            const response = await api.post('/doctors/register', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('❌ Error en API:', error.response?.data);
            throw error;
        }
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
    if (!dataURL || !dataURL.includes(',')) {
        console.error('❌ dataURL inválido:', dataURL?.substring(0, 50));
        return null;
    }

    try {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    } catch (error) {
        console.error('❌ Error convirtiendo base64 a blob:', error);
        return null;
    }
}

export default doctorService;