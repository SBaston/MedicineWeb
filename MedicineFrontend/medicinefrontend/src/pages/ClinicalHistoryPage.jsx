// ═══════════════════════════════════════════════════════════════
// ClinicalHistoryPage.jsx
// Historiales clínicos de un paciente — panel del doctor
// Route: /doctor/patients/:patientId/clinical-history
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Plus, Save, X, Trash2, Download, FileText,
    Mic, MicOff, Upload, Paperclip, Sparkles,
    ChevronLeft, MoreVertical, Loader2, AlertCircle,
    Check, Camera, FileUp, Bot, ChevronDown
} from 'lucide-react';
import clinicalNoteService from '../services/clinicalNoteService';
import api from '../services/api';

// ─────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────
const TABS = [
    { key: 'transcription',   label: 'Transcripción' },
    { key: 'clinicalHistory', label: 'Historia clínica' },
    { key: 'summary',         label: 'Resumen, objetivos y preguntas' },
];

const TAB_FIELD = {
    transcription:   'tabTranscription',
    clinicalHistory: 'tabClinicalHistory',
    summary:         'tabSummary',
};

const TEMPLATES = [
    { value: '',         label: 'Sin plantilla' },
    { value: 'SOAP',     label: 'SOAP' },
    { value: 'Seguimiento', label: 'Seguimiento' },
    { value: 'Primera visita', label: 'Primera visita' },
    { value: 'Urgencias', label: 'Urgencias' },
];

const AI_MODES = [
    { value: 'summary',         label: 'Resumen clínico' },
    { value: 'recommendations', label: 'Recomendaciones' },
    { value: 'differential',    label: 'Diagnóstico diferencial' },
    { value: 'custom',          label: 'Pregunta libre…' },
];

// ─────────────────────────────────────────────────────────────
// COMPONENTE: Editor de texto enriquecido simple (contentEditable)
// ─────────────────────────────────────────────────────────────
const RichEditor = ({ value, onChange, placeholder }) => {
    const ref = useRef(null);
    const lastHtml = useRef(value || '');

    // Sincronizar hacia el DOM solo cuando cambia desde fuera
    useEffect(() => {
        if (ref.current && ref.current.innerHTML !== (value || '')) {
            ref.current.innerHTML = value || '';
            lastHtml.current = value || '';
        }
    }, [value]);

    const handleInput = () => {
        const html = ref.current?.innerHTML || '';
        if (html !== lastHtml.current) {
            lastHtml.current = html;
            onChange(html);
        }
    };

    const execCmd = (cmd, val = null) => {
        document.execCommand(cmd, false, val);
        ref.current?.focus();
        handleInput();
    };

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-3 py-1.5 border-b border-gray-100 bg-gray-50 flex-wrap">
                <ToolbarBtn onClick={() => execCmd('bold')}      title="Negrita">     <strong>B</strong>   </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd('italic')}    title="Cursiva">     <em>I</em>           </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd('underline')} title="Subrayado">   <u>U</u>             </ToolbarBtn>
                <div className="w-px h-4 bg-gray-300 mx-1" />
                <ToolbarBtn onClick={() => execCmd('insertUnorderedList')} title="Lista">• Lista</ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd('insertOrderedList')}   title="Numerada">1. Num</ToolbarBtn>
                <div className="w-px h-4 bg-gray-300 mx-1" />
                <ToolbarBtn onClick={() => execCmd('removeFormat')} title="Quitar formato">Aa</ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd('undo')} title="Deshacer">↩</ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd('redo')} title="Rehacer">↪</ToolbarBtn>
            </div>
            {/* Área editable */}
            <div
                ref={ref}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                data-placeholder={placeholder}
                className="flex-1 p-4 overflow-y-auto text-sm text-gray-800 outline-none min-h-[200px]
                    [&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-gray-400"
            />
        </div>
    );
};

const ToolbarBtn = ({ onClick, title, children }) => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        className="px-2 py-0.5 rounded text-xs font-medium text-gray-600 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-200"
    >
        {children}
    </button>
);

// ─────────────────────────────────────────────────────────────
// COMPONENTE: Panel de IA
// ─────────────────────────────────────────────────────────────
const AiPanel = ({ noteContent, onInsert, onClose }) => {
    const [mode, setMode]             = useState('summary');
    const [customPrompt, setCustom]   = useState('');
    const [result, setResult]         = useState('');
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState('');

    const run = async () => {
        setLoading(true); setError(''); setResult('');
        try {
            const r = await clinicalNoteService.aiAssist(mode, noteContent, customPrompt);
            setResult(r);
        } catch {
            setError('Error al conectar con el asistente IA.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute right-0 top-10 z-30 w-96 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
                    <Bot className="w-4 h-4" /> Asistente IA
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>

            <select
                value={mode}
                onChange={e => setMode(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5"
            >
                {AI_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>

            {mode === 'custom' && (
                <textarea
                    value={customPrompt}
                    onChange={e => setCustom(e.target.value)}
                    placeholder="¿Qué quieres preguntar sobre esta nota?"
                    rows={2}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 resize-none"
                />
            )}

            <button
                onClick={run}
                disabled={loading || !noteContent}
                className="btn-primary w-full text-sm py-1.5 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'Procesando…' : 'Generar'}
            </button>

            {error && <p className="text-red-600 text-xs">{error}</p>}

            {result && (
                <div className="space-y-2">
                    <div className="bg-purple-50 rounded-lg p-3 text-xs text-gray-700 max-h-48 overflow-y-auto whitespace-pre-wrap">
                        {result}
                    </div>
                    <button
                        onClick={() => { onInsert(result); onClose(); }}
                        className="w-full text-xs text-purple-700 border border-purple-200 rounded-lg py-1 hover:bg-purple-50 transition-colors"
                    >
                        Insertar en la nota
                    </button>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────
const ClinicalHistoryPage = () => {
    const { patientId } = useParams();
    const navigate      = useNavigate();

    // ── Estado general ──
    const [notes, setNotes]           = useState([]);
    const [patient, setPatient]       = useState(null);
    const [loading, setLoading]       = useState(true);
    const [saving, setSaving]         = useState(false);
    const [error, setError]           = useState('');
    const [saveMsg, setSaveMsg]       = useState('');

    // ── Nota activa ──
    const [activeNote, setActiveNote] = useState(null); // null = ninguna abierta
    const [activeTab, setActiveTab]   = useState('clinicalHistory');
    const [noteData, setNoteData]     = useState({ title: '', template: '', tabTranscription: '', tabClinicalHistory: '', tabSummary: '' });
    const [isDirty, setIsDirty]       = useState(false);

    // ── Grabación de voz ──
    const [recording, setRecording]   = useState(false);
    const recognitionRef              = useRef(null);

    // ── IA ──
    const [showAi, setShowAi]         = useState(false);

    // ── Adjuntos ──
    const fileInputRef                = useRef(null);
    const ocrInputRef                 = useRef(null);

    // ─────────────────────────────────────────────────────────
    // Cargar paciente y notas
    // ─────────────────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [patientRes, notesData] = await Promise.all([
                    api.get(`/patient/profile/${patientId}`).catch(() => ({ data: null })),
                    clinicalNoteService.getNotes(patientId),
                ]);
                setPatient(patientRes.data);
                setNotes(notesData);
            } catch {
                setError('Error al cargar los datos del paciente.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [patientId]);

    // ─────────────────────────────────────────────────────────
    // Abrir nota
    // ─────────────────────────────────────────────────────────
    const openNote = async (noteId) => {
        try {
            const note = await clinicalNoteService.getNote(noteId);
            setActiveNote(note);
            setNoteData({
                title:              note.title || '',
                template:           note.template || '',
                tabTranscription:   note.tabTranscription   || '',
                tabClinicalHistory: note.tabClinicalHistory || '',
                tabSummary:         note.tabSummary         || '',
            });
            setIsDirty(false);
            setActiveTab('clinicalHistory');
        } catch {
            setError('Error al abrir la nota.');
        }
    };

    // ─────────────────────────────────────────────────────────
    // Crear nueva nota
    // ─────────────────────────────────────────────────────────
    const createNote = async () => {
        try {
            const note = await clinicalNoteService.createNote(patientId, {
                title: `Nota del ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
            });
            setNotes(prev => [note, ...prev]);
            await openNote(note.id);
        } catch {
            setError('Error al crear la nota.');
        }
    };

    // ─────────────────────────────────────────────────────────
    // Guardar nota
    // ─────────────────────────────────────────────────────────
    const saveNote = async () => {
        if (!activeNote) return;
        setSaving(true);
        try {
            const updated = await clinicalNoteService.updateNote(activeNote.id, {
                title:              noteData.title,
                template:           noteData.template || null,
                tabTranscription:   noteData.tabTranscription   || null,
                tabClinicalHistory: noteData.tabClinicalHistory || null,
                tabSummary:         noteData.tabSummary         || null,
            });
            setActiveNote(updated);
            setNotes(prev => prev.map(n => n.id === updated.id
                ? { ...n, title: updated.title, updatedAt: updated.updatedAt }
                : n));
            setIsDirty(false);
            setSaveMsg('Guardado');
            setTimeout(() => setSaveMsg(''), 2000);
        } catch {
            setError('Error al guardar.');
        } finally {
            setSaving(false);
        }
    };

    // ─────────────────────────────────────────────────────────
    // Cerrar nota
    // ─────────────────────────────────────────────────────────
    const closeNote = () => {
        setActiveNote(null);
        setNoteData({ title: '', template: '', tabTranscription: '', tabClinicalHistory: '', tabSummary: '' });
        setIsDirty(false);
        setShowAi(false);
    };

    // ─────────────────────────────────────────────────────────
    // Eliminar nota
    // ─────────────────────────────────────────────────────────
    const deleteNote = async (noteId, e) => {
        e.stopPropagation();
        if (!window.confirm('¿Eliminar esta nota? Esta acción no se puede deshacer.')) return;
        try {
            await clinicalNoteService.deleteNote(noteId);
            setNotes(prev => prev.filter(n => n.id !== noteId));
            if (activeNote?.id === noteId) closeNote();
        } catch {
            setError('Error al eliminar.');
        }
    };

    // ─────────────────────────────────────────────────────────
    // Grabación de voz (Web Speech API)
    // ─────────────────────────────────────────────────────────
    const toggleRecording = useCallback(() => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome.');
            return;
        }
        if (recording) {
            recognitionRef.current?.stop();
            setRecording(false);
            return;
        }
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SR();
        rec.lang = 'es-ES';
        rec.continuous = true;
        rec.interimResults = true;
        rec.onresult = (e) => {
            const transcript = Array.from(e.results).map(r => r[0].transcript).join(' ');
            setNoteData(prev => {
                const field = TAB_FIELD[activeTab];
                return { ...prev, [field]: (prev[field] || '') + ' ' + transcript };
            });
            setIsDirty(true);
        };
        rec.onend = () => setRecording(false);
        rec.start();
        recognitionRef.current = rec;
        setRecording(true);
    }, [recording, activeTab]);

    // ─────────────────────────────────────────────────────────
    // Subir adjunto
    // ─────────────────────────────────────────────────────────
    const handleAttachmentUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !activeNote) return;
        try {
            const att = await clinicalNoteService.uploadAttachment(activeNote.id, file);
            setActiveNote(prev => ({ ...prev, attachments: [...(prev.attachments || []), att] }));
        } catch {
            setError('Error al subir el adjunto.');
        }
        e.target.value = '';
    };

    // ─────────────────────────────────────────────────────────
    // OCR — imagen → texto
    // ─────────────────────────────────────────────────────────
    const handleOcrUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !activeNote) return;
        try {
            const text = await clinicalNoteService.performOcr(activeNote.id, file);
            const field = TAB_FIELD[activeTab];
            setNoteData(prev => ({ ...prev, [field]: (prev[field] || '') + '\n' + text }));
            setIsDirty(true);
        } catch {
            setError('Error en OCR. Asegúrate de que la imagen sea legible.');
        }
        e.target.value = '';
    };

    // ─────────────────────────────────────────────────────────
    // Importar documento (extrae texto plano del nombre por ahora, lo adjunta)
    // ─────────────────────────────────────────────────────────
    const handleDocumentImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !activeNote) return;
        // Subir como adjunto y notificar
        try {
            const att = await clinicalNoteService.uploadAttachment(activeNote.id, file);
            setActiveNote(prev => ({ ...prev, attachments: [...(prev.attachments || []), att] }));
            setSaveMsg(`Documento "${file.name}" importado como adjunto`);
            setTimeout(() => setSaveMsg(''), 3000);
        } catch {
            setError('Error al importar el documento.');
        }
        e.target.value = '';
    };

    // ─────────────────────────────────────────────────────────
    // Descargar PDF
    // ─────────────────────────────────────────────────────────
    const handleDownload = () => {
        if (!activeNote) return;
        clinicalNoteService.downloadPdf(activeNote.id, noteData.title);
    };

    // ─────────────────────────────────────────────────────────
    // Contenido actual de la pestaña activa (para la IA)
    // ─────────────────────────────────────────────────────────
    const currentTabContent = noteData[TAB_FIELD[activeTab]] || '';

    // ─────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
    );

    const patientName = patient
        ? `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim()
        : `Paciente #${patientId}`;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">

            {/* ── SIDEBAR IZQUIERDO ── */}
            <aside className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
                {/* Cabecera */}
                <div className="p-4 border-b border-gray-100">
                    <button
                        onClick={() => navigate('/doctor/dashboard')}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-3 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" /> Volver al panel
                    </button>
                    <h1 className="font-bold text-gray-900 text-lg leading-tight">{patientName}</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Historia clínica</p>
                </div>

                {/* Botón nueva nota */}
                <div className="p-3 border-b border-gray-100">
                    <button
                        onClick={createNote}
                        className="btn-primary w-full text-sm py-2 flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Nueva Nota
                    </button>
                </div>

                {/* Lista de notas */}
                <div className="flex-1 overflow-y-auto">
                    {notes.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 text-sm">
                            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p>No hay notas aún.</p>
                            <p>Crea la primera nota con el botón de arriba.</p>
                        </div>
                    ) : (
                        notes.map(note => (
                            <button
                                key={note.id}
                                onClick={() => openNote(note.id)}
                                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors group relative ${
                                    activeNote?.id === note.id ? 'bg-primary-50 border-l-2 border-l-primary-500' : ''
                                }`}
                            >
                                <p className="text-sm font-medium text-gray-800 truncate pr-6">{note.title}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {new Date(note.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    {note.attachmentsCount > 0 && ` · 📎 ${note.attachmentsCount}`}
                                </p>
                                <button
                                    onClick={(e) => deleteNote(note.id, e)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 transition-all"
                                    title="Eliminar nota"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </button>
                        ))
                    )}
                </div>
            </aside>

            {/* ── ÁREA PRINCIPAL ── */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {activeNote ? (
                    <>
                        {/* Cabecera del editor */}
                        <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
                            {/* Título editable */}
                            <input
                                type="text"
                                value={noteData.title}
                                onChange={e => { setNoteData(p => ({ ...p, title: e.target.value })); setIsDirty(true); }}
                                className="flex-1 text-sm font-medium bg-transparent border border-transparent rounded-lg px-2 py-1 hover:border-gray-200 focus:border-primary-400 focus:outline-none"
                                placeholder="Título de la nota"
                            />

                            {/* Fecha */}
                            <span className="text-xs text-gray-400 flex-shrink-0">
                                {new Date(activeNote.createdAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>

                            {/* Guardar */}
                            <button
                                onClick={saveNote}
                                disabled={saving}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                    saveMsg ? 'bg-green-100 text-green-700' : 'bg-primary-600 text-white hover:bg-primary-700'
                                } disabled:opacity-50`}
                            >
                                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : saveMsg ? <Check className="w-3.5 h-3.5" />
                                    : <Save className="w-3.5 h-3.5" />}
                                {saving ? 'Guardando…' : saveMsg || 'Guardar'}
                            </button>

                            {/* Cerrar */}
                            <button onClick={closeNote} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" title="Cerrar">
                                <X className="w-4 h-4" />
                            </button>
                        </header>

                        {/* Selector de plantilla */}
                        <div className="bg-white border-b border-gray-100 px-4 py-1.5 flex items-center gap-3 flex-shrink-0">
                            <span className="text-xs text-gray-500">Plantilla:</span>
                            <select
                                value={noteData.template}
                                onChange={e => { setNoteData(p => ({ ...p, template: e.target.value })); setIsDirty(true); }}
                                className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
                            >
                                {TEMPLATES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>

                        {/* Pestañas */}
                        <div className="bg-white border-b border-gray-200 px-4 flex items-center gap-1 flex-shrink-0">
                            {TABS.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === tab.key
                                            ? 'border-primary-600 text-primary-700'
                                            : 'border-transparent text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}

                            {/* Botones de herramientas en la barra de pestañas */}
                            <div className="ml-auto flex items-center gap-1 pb-0.5 relative">
                                {/* IA */}
                                <button
                                    onClick={() => setShowAi(p => !p)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        showAi ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                                    }`}
                                >
                                    <Sparkles className="w-3.5 h-3.5" /> Herramientas IA <ChevronDown className="w-3 h-3" />
                                </button>

                                {/* Grabar */}
                                <button
                                    onClick={toggleRecording}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        recording ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                    title={recording ? 'Detener grabación' : 'Grabar y transcribir'}
                                >
                                    {recording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                    {recording ? 'Detener' : 'Grabar'}
                                </button>

                                {/* Importar documento */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                                    title="Importar documento (Word, PDF…)"
                                >
                                    <FileUp className="w-3.5 h-3.5" /> Importar
                                </button>
                                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" onChange={handleDocumentImport} className="hidden" />

                                {/* OCR */}
                                <button
                                    onClick={() => ocrInputRef.current?.click()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                                    title="OCR: transcribir nota manuscrita"
                                >
                                    <Camera className="w-3.5 h-3.5" /> OCR
                                </button>
                                <input ref={ocrInputRef} type="file" accept="image/*" onChange={handleOcrUpload} className="hidden" />

                                {/* Adjuntar */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                                    title="Adjuntar archivo"
                                >
                                    <Paperclip className="w-3.5 h-3.5" />
                                </button>

                                {/* Descargar PDF */}
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                                    title="Descargar como PDF"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                </button>

                                {/* Panel IA */}
                                {showAi && (
                                    <AiPanel
                                        noteContent={currentTabContent.replace(/<[^>]+>/g, ' ')}
                                        onInsert={(text) => {
                                            const field = TAB_FIELD[activeTab];
                                            setNoteData(p => ({ ...p, [field]: (p[field] || '') + '\n' + text }));
                                            setIsDirty(true);
                                        }}
                                        onClose={() => setShowAi(false)}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Área de edición */}
                        <div className="flex-1 overflow-hidden flex flex-col bg-white">
                            <RichEditor
                                key={activeTab}
                                value={noteData[TAB_FIELD[activeTab]]}
                                onChange={(html) => {
                                    const field = TAB_FIELD[activeTab];
                                    setNoteData(p => ({ ...p, [field]: html }));
                                    setIsDirty(true);
                                }}
                                placeholder={
                                    activeTab === 'transcription'   ? 'Escribe o dicta la transcripción de la sesión…' :
                                    activeTab === 'clinicalHistory' ? 'Historia clínica del paciente…' :
                                    'Resumen de la sesión, objetivos y preguntas pendientes…'
                                }
                            />
                        </div>

                        {/* Adjuntos */}
                        {activeNote.attachments?.length > 0 && (
                            <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 flex-shrink-0">
                                <p className="text-xs font-medium text-gray-500 mb-1.5">Adjuntos ({activeNote.attachments.length})</p>
                                <div className="flex flex-wrap gap-2">
                                    {activeNote.attachments.map(att => (
                                        <a
                                            key={att.id}
                                            href={att.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            <Paperclip className="w-3 h-3 text-gray-400" />
                                            {att.fileName}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="mx-4 mb-2 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 text-xs">
                                <AlertCircle className="w-3.5 h-3.5" /> {error}
                                <button onClick={() => setError('')} className="ml-auto"><X className="w-3 h-3" /></button>
                            </div>
                        )}
                    </>
                ) : (
                    /* Estado vacío */
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
                        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                            <FileText className="w-10 h-10 opacity-40" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium text-gray-600">Comienza a Tomar Notas</p>
                            <p className="text-sm mt-1">Crea y organiza tus notas clínicas sin esfuerzo</p>
                        </div>
                        <div className="flex gap-3">
                            <ActionCard icon={<FileText className="w-5 h-5" />} label="Crear nueva nota"     onClick={createNote} />
                            <ActionCard icon={<Mic className="w-5 h-5" />}      label="Grabar y transcribir" onClick={createNote} />
                            <ActionCard icon={<Bot className="w-5 h-5" />}       label="Asistente IA"         onClick={createNote} />
                        </div>
                        <button onClick={createNote} className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Crear nueva nota
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

const ActionCard = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center gap-2 px-6 py-4 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all text-gray-600 hover:text-primary-700 text-xs font-medium"
    >
        {icon}
        {label}
    </button>
);

export default ClinicalHistoryPage;
