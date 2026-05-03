import api from './api';

const clinicalNoteService = {
    // ── Notas ──────────────────────────────────────────────────────
    getNotes: (patientId) =>
        api.get(`/doctor/patients/${patientId}/clinical-notes`).then(r => r.data),

    getNote: (noteId) =>
        api.get(`/doctor/clinical-notes/${noteId}`).then(r => r.data),

    createNote: (patientId, dto) =>
        api.post(`/doctor/patients/${patientId}/clinical-notes`, dto).then(r => r.data),

    updateNote: (noteId, dto) =>
        api.put(`/doctor/clinical-notes/${noteId}`, dto).then(r => r.data),

    deleteNote: (noteId) =>
        api.delete(`/doctor/clinical-notes/${noteId}`),

    // ── Adjuntos ───────────────────────────────────────────────────
    uploadAttachment: (noteId, file) => {
        const fd = new FormData();
        fd.append('file', file);
        return api.post(`/doctor/clinical-notes/${noteId}/attachments`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then(r => r.data);
    },

    deleteAttachment: (noteId, attachmentId) =>
        api.delete(`/doctor/clinical-notes/${noteId}/attachments/${attachmentId}`),

    // ── OCR ────────────────────────────────────────────────────────
    performOcr: (noteId, imageFile) => {
        const fd = new FormData();
        fd.append('image', imageFile);
        return api.post(`/doctor/clinical-notes/${noteId}/ocr`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then(r => r.data.text);
    },

    // ── Asistente IA ───────────────────────────────────────────────
    aiAssist: (mode, content, customPrompt = '') =>
        api.post('/doctor/clinical-notes/ai-assist', { mode, content, customPrompt })
            .then(r => r.data.result),

    // ── Descarga PDF ───────────────────────────────────────────────
    downloadPdf: async (noteId, title) => {
        const response = await api.get(`/doctor/clinical-notes/${noteId}/download`, {
            responseType: 'blob',
        });
        const url  = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href     = url;
        link.download = `${title || 'nota-clinica'}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
    },
};

export default clinicalNoteService;
