// ═══════════════════════════════════════════════════════════════
// AvailabilitySettingsPage.jsx - Configuración Completa de Disponibilidad
// ✅ Horarios + Zona horaria + Días bloqueados + Modalidades
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, Plus, Trash2, Clock,
    Calendar, MapPin, Video, Home, Copy,
    Settings, CheckCircle, AlertCircle, Globe, Ban
} from 'lucide-react';
import doctorDashboardService from '../services/doctordashboardService';
import TwoFactorSettings from '../components/TwoFactorSettings';

const DAYS = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 0, label: 'Domingo' },
];

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2).toString().padStart(2, '0');
    const minute = (i % 2) * 30;
    const minuteStr = minute.toString().padStart(2, '0');
    return `${hour}:${minuteStr}`;
});

const DURATION_OPTIONS = [
    { value: 15, label: '15 minutos' },
    { value: 30, label: '30 minutos' },
    { value: 45, label: '45 minutos' },
    { value: 60, label: '1 hora' },
    { value: 90, label: '1 hora 30 min' },
    { value: 120, label: '2 horas' },
];

const VIDEO_PLATFORMS = [
    { value: 'Zoom', label: 'Zoom', icon: '📹' },
    { value: 'GoogleMeet', label: 'Google Meet', icon: '🎥' },
    { value: 'MicrosoftTeams', label: 'Microsoft Teams', icon: '💼' },
    { value: 'Otro', label: 'Otro', icon: '🔗' },
];

const COMMON_TIMEZONES = [
    { group: 'Europa', zones: [
        { value: 'Europe/Madrid', label: 'España (Madrid) UTC+1/+2' },
        { value: 'Europe/London', label: 'Reino Unido (Londres) UTC+0/+1' },
        { value: 'Europe/Paris', label: 'Francia (París) UTC+1/+2' },
        { value: 'Europe/Berlin', label: 'Alemania (Berlín) UTC+1/+2' },
        { value: 'Europe/Rome', label: 'Italia (Roma) UTC+1/+2' },
        { value: 'Europe/Lisbon', label: 'Portugal (Lisboa) UTC+0/+1' },
        { value: 'Europe/Amsterdam', label: 'Países Bajos (Ámsterdam) UTC+1/+2' },
        { value: 'Europe/Warsaw', label: 'Polonia (Varsovia) UTC+1/+2' },
        { value: 'Europe/Bucharest', label: 'Rumanía (Bucarest) UTC+2/+3' },
        { value: 'Europe/Athens', label: 'Grecia (Atenas) UTC+2/+3' },
        { value: 'Europe/Moscow', label: 'Rusia (Moscú) UTC+3' },
    ]},
    { group: 'América', zones: [
        { value: 'America/Mexico_City', label: 'México (Ciudad de México) UTC-6' },
        { value: 'America/Bogota', label: 'Colombia (Bogotá) UTC-5' },
        { value: 'America/Lima', label: 'Perú (Lima) UTC-5' },
        { value: 'America/Caracas', label: 'Venezuela (Caracas) UTC-4' },
        { value: 'America/Santiago', label: 'Chile (Santiago) UTC-4/-3' },
        { value: 'America/Argentina/Buenos_Aires', label: 'Argentina (Buenos Aires) UTC-3' },
        { value: 'America/Sao_Paulo', label: 'Brasil (São Paulo) UTC-3' },
        { value: 'America/New_York', label: 'EE.UU. Este (Nueva York) UTC-5/-4' },
        { value: 'America/Chicago', label: 'EE.UU. Centro (Chicago) UTC-6/-5' },
        { value: 'America/Los_Angeles', label: 'EE.UU. Oeste (Los Ángeles) UTC-8/-7' },
        { value: 'America/Toronto', label: 'Canadá (Toronto) UTC-5/-4' },
        { value: 'America/Vancouver', label: 'Canadá (Vancouver) UTC-8/-7' },
    ]},
    { group: 'Asia / Pacífico', zones: [
        { value: 'Asia/Dubai', label: 'Emiratos Árabes (Dubái) UTC+4' },
        { value: 'Asia/Kolkata', label: 'India (Calcuta) UTC+5:30' },
        { value: 'Asia/Bangkok', label: 'Tailandia (Bangkok) UTC+7' },
        { value: 'Asia/Singapore', label: 'Singapur UTC+8' },
        { value: 'Asia/Shanghai', label: 'China (Shanghái) UTC+8' },
        { value: 'Asia/Tokyo', label: 'Japón (Tokio) UTC+9' },
        { value: 'Asia/Seoul', label: 'Corea del Sur (Seúl) UTC+9' },
        { value: 'Australia/Perth', label: 'Australia Oeste (Perth) UTC+8' },
        { value: 'Australia/Sydney', label: 'Australia Este (Sídney) UTC+10/+11' },
        { value: 'Australia/Melbourne', label: 'Australia (Melbourne) UTC+10/+11' },
        { value: 'Pacific/Auckland', label: 'Nueva Zelanda (Auckland) UTC+12/+13' },
    ]},
    { group: 'África / Oriente Medio', zones: [
        { value: 'Africa/Cairo', label: 'Egipto (El Cairo) UTC+2' },
        { value: 'Africa/Lagos', label: 'Nigeria (Lagos) UTC+1' },
        { value: 'Africa/Johannesburg', label: 'Sudáfrica (Johannesburgo) UTC+2' },
        { value: 'Africa/Nairobi', label: 'Kenia (Nairobi) UTC+3' },
    ]},
    { group: 'UTC', zones: [
        { value: 'UTC', label: 'UTC (Tiempo Universal Coordinado)' },
    ]},
];

const AvailabilitySettingsPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [activeTab, setActiveTab] = useState('schedule'); // schedule, settings, blocked
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Horarios semanales
    const [availabilities, setAvailabilities] = useState({});
    const [selectedDay, setSelectedDay] = useState(1);

    // Días bloqueados (fechas específicas sin disponibilidad)
    const [blockedDates, setBlockedDates] = useState([]);
    const [newBlockedDate, setNewBlockedDate] = useState('');
    const [newBlockedReason, setNewBlockedReason] = useState('');

    // Configuración de citas
    const [settings, setSettings] = useState({
        defaultAppointmentDuration: 30,
        acceptsInPersonAppointments: true,
        acceptsOnlineAppointments: true,
        preferredVideoCallPlatform: 'GoogleMeet',
        officeAddress: '',
        officeCity: '',
        officePostalCode: '',
        officeCountry: 'España',
        officeInstructions: '',
        onlineInstructions: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoadingData(true);

            // Cargar horarios
            const availData = await doctorDashboardService.getAvailabilities();
            const grouped = {};
            availData.forEach(av => {
                if (!grouped[av.dayOfWeek]) grouped[av.dayOfWeek] = [];
                grouped[av.dayOfWeek].push(av);
            });
            setAvailabilities(grouped);

            // Cargar configuración de citas
            try {
                const settingsData = await doctorDashboardService.getAppointmentSettings();
                if (settingsData) {
                    setSettings(prev => ({
                        ...prev,
                        ...settingsData,
                        timezone: settingsData.timezone || prev.timezone,
                    }));
                }
            } catch {
                // Endpoint no disponible aún, se usan valores por defecto
            }

            // Cargar días bloqueados
            try {
                const blockedData = await doctorDashboardService.getBlockedDates();
                if (Array.isArray(blockedData)) setBlockedDates(blockedData);
            } catch {
                // Endpoint no disponible aún
            }

        } catch (error) {
            console.error('Error al cargar datos:', error);
            alert('Error al cargar la configuración');
        } finally {
            setLoadingData(false);
        }
    };

    const addTimeSlot = (dayValue) => {
        const newSlot = {
            id: `temp_${Date.now()}`,
            dayOfWeek: dayValue,
            startTime: '09:00',
            endTime: '17:00',
            isAvailable: true,
            notes: '',
            isNew: true
        };
        setAvailabilities(prev => ({
            ...prev,
            [dayValue]: [...(prev[dayValue] || []), newSlot]
        }));
    };

    const removeTimeSlot = async (dayValue, slotId) => {
        if (slotId.toString().startsWith('temp_')) {
            setAvailabilities(prev => ({
                ...prev,
                [dayValue]: prev[dayValue].filter(slot => slot.id !== slotId)
            }));
        } else {
            if (!confirm('¿Eliminar esta franja horaria?')) return;
            try {
                await doctorDashboardService.deleteAvailability(slotId);
                setAvailabilities(prev => ({
                    ...prev,
                    [dayValue]: prev[dayValue].filter(slot => slot.id !== slotId)
                }));
            } catch {
                alert('Error al eliminar');
            }
        }
    };

    const updateTimeSlot = (dayValue, slotId, field, value) => {
        setAvailabilities(prev => ({
            ...prev,
            [dayValue]: prev[dayValue].map(slot =>
                slot.id === slotId
                    ? { ...slot, [field]: value, modified: !slot.isNew }
                    : slot
            )
        }));
    };

    const copyScheduleToAll = (sourceDayValue) => {
        if (!confirm('¿Copiar este horario a todos los días?')) return;
        const sourceSchedule = availabilities[sourceDayValue] || [];
        const newAvailabilities = {};
        DAYS.forEach(day => {
            newAvailabilities[day.value] = sourceSchedule.map(slot => ({
                ...slot,
                id: `temp_${Date.now()}_${Math.random()}`,
                dayOfWeek: day.value,
                isNew: true
            }));
        });
        setAvailabilities(newAvailabilities);
    };

    const addBlockedDate = () => {
        if (!newBlockedDate) return;
        const exists = blockedDates.some(bd => bd.date === newBlockedDate);
        if (exists) {
            alert('Esta fecha ya está bloqueada');
            return;
        }
        setBlockedDates(prev => [
            ...prev,
            {
                id: `temp_${Date.now()}`,
                date: newBlockedDate,
                reason: newBlockedReason || 'No disponible',
                isNew: true
            }
        ].sort((a, b) => a.date.localeCompare(b.date)));
        setNewBlockedDate('');
        setNewBlockedReason('');
    };

    const removeBlockedDate = async (id) => {
        if (id.toString().startsWith('temp_')) {
            setBlockedDates(prev => prev.filter(bd => bd.id !== id));
        } else {
            try {
                await doctorDashboardService.deleteBlockedDate(id);
                setBlockedDates(prev => prev.filter(bd => bd.id !== id));
            } catch {
                // Si el endpoint no existe, eliminar solo localmente
                setBlockedDates(prev => prev.filter(bd => bd.id !== id));
            }
        }
    };

    const handleSaveAll = async () => {
        setLoading(true);
        setSaveSuccess(false);

        try {
            // 1. Guardar horarios
            const allSlots = Object.values(availabilities).flat();
            for (const slot of allSlots) {
                if (slot.isNew) {
                    await doctorDashboardService.createAvailability({
                        dayOfWeek: slot.dayOfWeek,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        isAvailable: slot.isAvailable,
                        notes: slot.notes || null
                    });
                } else if (slot.modified) {
                    await doctorDashboardService.updateAvailability(slot.id, {
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        isAvailable: slot.isAvailable,
                        notes: slot.notes || null
                    });
                }
            }

            // 2. Guardar configuración de citas
            try {
                await doctorDashboardService.updateAppointmentSettings(settings);
            } catch {
                // Endpoint no disponible aún, continuar sin error fatal
            }

            // 3. Guardar días bloqueados nuevos
            for (const bd of blockedDates.filter(bd => bd.isNew)) {
                try {
                    await doctorDashboardService.createBlockedDate({
                        date: bd.date,
                        reason: bd.reason
                    });
                } catch {
                    // Endpoint no disponible aún
                }
            }

            setSaveSuccess(true);
            setTimeout(() => {
                navigate('/doctor/dashboard');
            }, 1200);

        } catch (error) {
            console.error('Error al guardar:', error);
            alert('❌ Error al guardar la configuración');
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Cargando configuración...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate('/doctor/dashboard')}
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Volver</span>
                        </button>

                        <button
                            onClick={handleSaveAll}
                            disabled={loading || saveSuccess}
                            className={`px-6 py-2.5 rounded-lg font-semibold shadow-lg flex items-center gap-2 transition-all ${
                                saveSuccess
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 disabled:opacity-50'
                            }`}
                        >
                            {saveSuccess ? (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    ¡Guardado!
                                </>
                            ) : loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Guardar todo
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Title */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        Configuración de disponibilidad
                    </h1>
                    <p className="text-slate-600">
                        Define tus horarios, modalidades de atención y días en los que no estarás disponible
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-white rounded-xl p-2 shadow-sm border border-slate-100 w-fit">
                    {[
                        { key: 'schedule', label: 'Horarios', icon: Calendar },
                        { key: 'settings', label: 'Configuración', icon: Settings },
                        { key: 'blocked', label: 'Días bloqueados', icon: Ban },
                    ].map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`px-5 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                                activeTab === key
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                            {key === 'blocked' && blockedDates.length > 0 && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                                    activeTab === 'blocked' ? 'bg-white/30 text-white' : 'bg-red-100 text-red-600'
                                }`}>
                                    {blockedDates.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {activeTab === 'schedule' && (
                    <ScheduleTab
                        availabilities={availabilities}
                        selectedDay={selectedDay}
                        setSelectedDay={setSelectedDay}
                        addTimeSlot={addTimeSlot}
                        removeTimeSlot={removeTimeSlot}
                        updateTimeSlot={updateTimeSlot}
                        copyScheduleToAll={copyScheduleToAll}
                        timeSlots={TIME_SLOTS}
                        days={DAYS}
                        timezone={settings.timezone}
                    />
                )}

                {activeTab === 'settings' && (
                    <SettingsTab
                        settings={settings}
                        setSettings={setSettings}
                        durationOptions={DURATION_OPTIONS}
                        timezones={COMMON_TIMEZONES}
                    />
                )}

                {activeTab === 'blocked' && (
                    <BlockedDatesTab
                        blockedDates={blockedDates}
                        newBlockedDate={newBlockedDate}
                        setNewBlockedDate={setNewBlockedDate}
                        newBlockedReason={newBlockedReason}
                        setNewBlockedReason={setNewBlockedReason}
                        addBlockedDate={addBlockedDate}
                        removeBlockedDate={removeBlockedDate}
                    />
                )}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// TAB: Horarios
// ═══════════════════════════════════════════════════════════════

const ScheduleTab = ({
    availabilities, selectedDay, setSelectedDay,
    addTimeSlot, removeTimeSlot, updateTimeSlot,
    copyScheduleToAll, timeSlots, days, timezone
}) => {
    const selectedSlots = availabilities[selectedDay] || [];

    // Formatear zona horaria de forma legible
    const timezoneLabel = (() => {
        try {
            const now = new Date();
            const formatter = new Intl.DateTimeFormat('es', {
                timeZone: timezone,
                timeZoneName: 'short'
            });
            const parts = formatter.formatToParts(now);
            const tzPart = parts.find(p => p.type === 'timeZoneName');
            return tzPart ? `(${tzPart.value})` : '';
        } catch {
            return '';
        }
    })();

    return (
        <div className="space-y-4">
            {/* Aviso zona horaria */}
            <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                <Globe className="w-4 h-4 flex-shrink-0 text-blue-600" />
                <span>
                    Los horarios se interpretan en tu zona horaria configurada:{' '}
                    <strong>{timezone} {timezoneLabel}</strong>.
                    Puedes cambiarla en la pestaña <em>Configuración</em>.
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Days List */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="font-bold text-slate-900 mb-4">Días de la semana</h2>
                    <div className="space-y-2">
                        {days.map((day) => {
                            const hasSchedule = availabilities[day.value]?.length > 0;
                            const isActive = availabilities[day.value]?.some(s => s.isAvailable);

                            return (
                                <button
                                    key={day.value}
                                    onClick={() => setSelectedDay(day.value)}
                                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                                        selectedDay === day.value
                                            ? 'border-purple-600 bg-purple-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-slate-900">{day.label}</span>
                                        <span className={`w-2.5 h-2.5 rounded-full ${
                                            !hasSchedule ? 'bg-slate-200' :
                                            isActive ? 'bg-green-500' : 'bg-gray-300'
                                        }`} />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {hasSchedule
                                            ? `${availabilities[day.value].length} franja${availabilities[day.value].length !== 1 ? 's' : ''}`
                                            : 'Sin horario'}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Time Slots Editor */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold text-slate-900">
                            {days.find(d => d.value === selectedDay)?.label}
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => copyScheduleToAll(selectedDay)}
                                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <Copy className="w-4 h-4" />
                                Copiar a todos
                            </button>
                            <button
                                onClick={() => addTimeSlot(selectedDay)}
                                className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Añadir franja
                            </button>
                        </div>
                    </div>

                    {selectedSlots.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-600 font-medium mb-2">Sin horarios configurados</p>
                            <p className="text-slate-500 text-sm mb-4">
                                Pulsa "Añadir franja" para definir un rango horario en este día
                            </p>
                            <button
                                onClick={() => addTimeSlot(selectedDay)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Añadir primera franja
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {selectedSlots.map((slot) => (
                                <TimeSlotCard
                                    key={slot.id}
                                    slot={slot}
                                    selectedDay={selectedDay}
                                    updateTimeSlot={updateTimeSlot}
                                    removeTimeSlot={removeTimeSlot}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Normaliza "HH:mm:ss" → "HH:mm" para que sea compatible con input[type=time]
const toHHMM = (t = '') => (t.length > 5 ? t.slice(0, 5) : t);

const TimeSlotCard = ({ slot, selectedDay, updateTimeSlot, removeTimeSlot }) => {
    return (
        <div className={`p-4 border-2 rounded-xl transition-all ${
            slot.isAvailable ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'
        }`}>
            <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Hora inicio
                    </label>
                    <input
                        type="time"
                        value={toHHMM(slot.startTime)}
                        onChange={(e) => updateTimeSlot(selectedDay, slot.id, 'startTime', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Hora fin
                    </label>
                    <input
                        type="time"
                        value={toHHMM(slot.endTime)}
                        onChange={(e) => updateTimeSlot(selectedDay, slot.id, 'endTime', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                </div>
            </div>

            {/* Crossed midnight warning */}
            {slot.startTime >= slot.endTime && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Esta franja cruza la medianoche ({slot.startTime} del día hasta {slot.endTime} del día siguiente).
                    Esto es válido si tu zona horaria lo requiere.
                </div>
            )}

            <div className="flex items-center justify-between pt-1">
                {/* Toggle: Activa / Pausada */}
                <button
                    type="button"
                    onClick={() => updateTimeSlot(selectedDay, slot.id, 'isAvailable', !slot.isAvailable)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        slot.isAvailable
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                >
                    <span className={`w-2 h-2 rounded-full ${slot.isAvailable ? 'bg-green-500' : 'bg-slate-400'}`} />
                    {slot.isAvailable ? 'Activa' : 'Pausada'}
                </button>

                <button
                    onClick={() => removeTimeSlot(selectedDay, slot.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar franja"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// TAB: Configuración
// ═══════════════════════════════════════════════════════════════

const SettingsTab = ({ settings, setSettings, durationOptions, timezones }) => {
    return (
        <div className="space-y-6">
            {/* Fila 1: Duración y Modalidades */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <h2 className="font-bold text-slate-900">Duración y modalidades</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Duración */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Duración predeterminada de citas
                        </label>
                        <select
                            value={settings.defaultAppointmentDuration}
                            onChange={(e) => setSettings({ ...settings, defaultAppointmentDuration: parseInt(e.target.value) })}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
                        >
                            {durationOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">
                            Las citas se programarán con esta duración por defecto
                        </p>
                    </div>

                    {/* Modalidades */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-purple-300 transition-colors">
                            <input
                                type="checkbox"
                                checked={settings.acceptsInPersonAppointments}
                                onChange={(e) => setSettings({ ...settings, acceptsInPersonAppointments: e.target.checked })}
                                className="w-5 h-5 text-purple-600 rounded"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <Home className="w-4 h-4 text-slate-600" />
                                    <span className="font-semibold text-slate-900">Citas presenciales</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">Pacientes pueden visitarte en tu consultorio</p>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-purple-300 transition-colors">
                            <input
                                type="checkbox"
                                checked={settings.acceptsOnlineAppointments}
                                onChange={(e) => setSettings({ ...settings, acceptsOnlineAppointments: e.target.checked })}
                                className="w-5 h-5 text-purple-600 rounded"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <Video className="w-4 h-4 text-slate-600" />
                                    <span className="font-semibold text-slate-900">Citas online</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">Videollamadas por internet</p>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Dirección del consultorio - SOLO si acceptsInPersonAppointments */}
            {settings.acceptsInPersonAppointments && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-6">
                        <MapPin className="w-5 h-5 text-purple-600" />
                        <h2 className="font-bold text-slate-900">Dirección del consultorio</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Dirección completa
                            </label>
                            <input
                                type="text"
                                value={settings.officeAddress || ''}
                                onChange={(e) => setSettings({ ...settings, officeAddress: e.target.value })}
                                placeholder="Calle, número, piso..."
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Ciudad</label>
                                <input
                                    type="text"
                                    value={settings.officeCity || ''}
                                    onChange={(e) => setSettings({ ...settings, officeCity: e.target.value })}
                                    placeholder="Madrid"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Código postal</label>
                                <input
                                    type="text"
                                    value={settings.officePostalCode || ''}
                                    onChange={(e) => setSettings({ ...settings, officePostalCode: e.target.value })}
                                    placeholder="28001"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">País</label>
                            <input
                                type="text"
                                value={settings.officeCountry || ''}
                                onChange={(e) => setSettings({ ...settings, officeCountry: e.target.value })}
                                placeholder="España"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Instrucciones adicionales (opcional)
                            </label>
                            <textarea
                                value={settings.officeInstructions || ''}
                                onChange={(e) => setSettings({ ...settings, officeInstructions: e.target.value })}
                                placeholder="Ej: Edificio con portero, 2º piso derecha..."
                                rows={3}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg resize-none"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Zona horaria */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-5 h-5 text-purple-600" />
                    <h2 className="font-bold text-slate-900">Zona horaria</h2>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                    Define en qué zona horaria se interpretarán tus horarios.
                    Si vives fuera de España, selecciona tu zona local.
                </p>
                <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg max-w-lg"
                >
                    {timezones.map(group => (
                        <optgroup key={group.group} label={group.group}>
                            {group.zones.map(tz => (
                                <option key={tz.value} value={tz.value}>{tz.label}</option>
                            ))}
                        </optgroup>
                    ))}
                </select>
                <p className="text-xs text-slate-400 mt-2">
                    Detectada automáticamente: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </p>
            </div>

            {/* Seguridad: 2FA */}
            <TwoFactorSettings />
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// TAB: Días Bloqueados
// ═══════════════════════════════════════════════════════════════

const BlockedDatesTab = ({
    blockedDates, newBlockedDate, setNewBlockedDate,
    newBlockedReason, setNewBlockedReason,
    addBlockedDate, removeBlockedDate
}) => {
    const today = new Date().toISOString().split('T')[0];

    const formatDate = (dateStr) => {
        try {
            const date = new Date(dateStr + 'T00:00:00');
            return date.toLocaleDateString('es-ES', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const upcomingBlocked = blockedDates.filter(bd => bd.date >= today);
    const pastBlocked = blockedDates.filter(bd => bd.date < today);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulario para añadir */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                    <Ban className="w-5 h-5 text-red-500" />
                    <h2 className="font-bold text-slate-900">Bloquear un día específico</h2>
                </div>
                <p className="text-sm text-slate-600 mb-6">
                    Bloquea días puntuales en los que no podrás atender citas —
                    vacaciones, formaciones, imprevistos, etc. Ese día no aparecerá como disponible para los pacientes.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Fecha a bloquear *
                        </label>
                        <input
                            type="date"
                            value={newBlockedDate}
                            min={today}
                            onChange={(e) => setNewBlockedDate(e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Motivo (opcional)
                        </label>
                        <input
                            type="text"
                            value={newBlockedReason}
                            onChange={(e) => setNewBlockedReason(e.target.value)}
                            placeholder="Ej: Vacaciones, Congreso médico, Guardia..."
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
                            onKeyDown={(e) => { if (e.key === 'Enter') addBlockedDate(); }}
                        />
                    </div>
                    <button
                        onClick={addBlockedDate}
                        disabled={!newBlockedDate}
                        className="w-full py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Bloquear este día
                    </button>
                </div>
            </div>

            {/* Lista de días bloqueados */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="font-bold text-slate-900 mb-6">
                    Días bloqueados
                    {blockedDates.length > 0 && (
                        <span className="ml-2 text-sm font-normal text-slate-500">({blockedDates.length})</span>
                    )}
                </h2>

                {blockedDates.length === 0 ? (
                    <div className="text-center py-12">
                        <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                        <p className="text-slate-600 font-medium">Sin días bloqueados</p>
                        <p className="text-slate-500 text-sm mt-1">
                            Estás disponible todos los días según tu horario habitual
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {upcomingBlocked.length > 0 && (
                            <>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Próximos</p>
                                {upcomingBlocked.map(bd => (
                                    <BlockedDateCard key={bd.id} bd={bd} formatDate={formatDate} onRemove={removeBlockedDate} isPast={false} />
                                ))}
                            </>
                        )}
                        {pastBlocked.length > 0 && (
                            <>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-4">Pasados</p>
                                {pastBlocked.map(bd => (
                                    <BlockedDateCard key={bd.id} bd={bd} formatDate={formatDate} onRemove={removeBlockedDate} isPast={true} />
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const BlockedDateCard = ({ bd, formatDate, onRemove, isPast }) => (
    <div className={`flex items-start justify-between p-4 rounded-xl border transition-all ${
        isPast ? 'border-slate-100 bg-slate-50 opacity-60' : 'border-red-100 bg-red-50'
    }`}>
        <div className="flex items-start gap-3">
            <Ban className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isPast ? 'text-slate-400' : 'text-red-500'}`} />
            <div>
                <p className={`font-semibold text-sm capitalize ${isPast ? 'text-slate-600' : 'text-slate-800'}`}>
                    {formatDate(bd.date)}
                </p>
                {bd.reason && (
                    <p className="text-xs text-slate-500 mt-0.5">{bd.reason}</p>
                )}
            </div>
        </div>
        <button
            onClick={() => onRemove(bd.id)}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded-lg transition-colors ml-2 flex-shrink-0"
            title="Eliminar bloqueo"
        >
            <Trash2 className="w-3.5 h-3.5" />
        </button>
    </div>
);

export default AvailabilitySettingsPage;
