// ═══════════════════════════════════════════════════════════════
// AvailabilitySettingsPage.jsx - Configuración Completa de Disponibilidad
// ✅ Incluye: Horarios + Duración de citas + Dirección + Modalidades
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, Plus, Trash2, Clock,
    Calendar, MapPin, Video, Home, Copy,
    Settings, CheckCircle, AlertCircle
} from 'lucide-react';
import doctorDashboardService from '../services/doctordashboardService';

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

const AvailabilitySettingsPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [activeTab, setActiveTab] = useState('schedule'); // schedule, settings

    // Horarios semanales
    const [availabilities, setAvailabilities] = useState({});
    const [selectedDay, setSelectedDay] = useState(1);

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

            // Cargar configuración de citas (nuevo endpoint)
            try {
                const settingsData = await doctorDashboardService.getAppointmentSettings();
                setSettings(settingsData);
            } catch (error) {
                console.log('Configuración no disponible aún, usando valores por defecto');
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
            } catch (error) {
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

    const handleSaveAll = async () => {
        setLoading(true);

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
            await doctorDashboardService.updateAppointmentSettings(settings);

            alert('✅ Configuración guardada correctamente');
            navigate('/doctor/dashboard');

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
                            disabled={loading}
                            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 shadow-lg disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
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
                        Define tus horarios, duración de citas y modalidades de atención
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-white rounded-xl p-2 shadow-sm border border-slate-100 inline-flex">
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${activeTab === 'schedule'
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Horarios
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${activeTab === 'settings'
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Configuración
                        </div>
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'schedule' ? (
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
                    />
                ) : (
                    <SettingsTab
                        settings={settings}
                        setSettings={setSettings}
                        durationOptions={DURATION_OPTIONS}
                        videoPlatforms={VIDEO_PLATFORMS}
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
    copyScheduleToAll, timeSlots, days
}) => {
    const selectedSlots = availabilities[selectedDay] || [];

    return (
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
                                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${selectedDay === day.value
                                        ? 'border-purple-600 bg-purple-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-900">{day.label}</span>
                                    {hasSchedule && (
                                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'
                                            }`} />
                                    )}
                                </div>
                                {hasSchedule && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        {availabilities[day.value].length} franja{availabilities[day.value].length !== 1 ? 's' : ''}
                                    </p>
                                )}
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
                            Añade franjas horarias para este día
                        </p>
                        <button
                            onClick={() => addTimeSlot(selectedDay)}
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Añadir primera franja
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {selectedSlots.map((slot) => (
                            <div key={slot.id} className="p-4 border-2 border-slate-200 rounded-xl">
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Hora inicio
                                        </label>
                                        <select
                                            value={slot.startTime}
                                            onChange={(e) => updateTimeSlot(selectedDay, slot.id, 'startTime', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        >
                                            {timeSlots.map(time => (
                                                <option key={time} value={time}>{time}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Hora fin
                                        </label>
                                        <select
                                            value={slot.endTime}
                                            onChange={(e) => updateTimeSlot(selectedDay, slot.id, 'endTime', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        >
                                            {timeSlots.map(time => (
                                                <option key={time} value={time}>{time}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={slot.isAvailable}
                                            onChange={(e) => updateTimeSlot(selectedDay, slot.id, 'isAvailable', e.target.checked)}
                                            className="w-4 h-4 text-purple-600 rounded"
                                        />
                                        <span className="text-sm text-slate-700">Disponible</span>
                                    </label>

                                    <button
                                        onClick={() => removeTimeSlot(selectedDay, slot.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// TAB: Configuración
// ═══════════════════════════════════════════════════════════════

const SettingsTab = ({ settings, setSettings, durationOptions, videoPlatforms }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Duración y Modalidades */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <h2 className="font-bold text-slate-900">Duración y modalidades</h2>
                </div>

                <div className="space-y-4">
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

                    {/* Modalidad Presencial */}
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
                            <p className="text-xs text-slate-500 mt-0.5">
                                Pacientes pueden visitarte en tu consultorio
                            </p>
                        </div>
                    </label>

                    {/* Modalidad Online */}
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
                            <p className="text-xs text-slate-500 mt-0.5">
                                Videollamadas por internet
                            </p>
                        </div>
                    </label>

                    {/* Plataforma de video */}
                    {settings.acceptsOnlineAppointments && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Plataforma preferida
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {videoPlatforms.map(platform => (
                                    <button
                                        key={platform.value}
                                        onClick={() => setSettings({ ...settings, preferredVideoCallPlatform: platform.value })}
                                        className={`p-3 rounded-lg border-2 transition-all ${settings.preferredVideoCallPlatform === platform.value
                                                ? 'border-purple-600 bg-purple-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="text-2xl mb-1">{platform.icon}</div>
                                        <div className="text-xs font-semibold">{platform.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Dirección del consultorio */}
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
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Ciudad
                            </label>
                            <input
                                type="text"
                                value={settings.officeCity || ''}
                                onChange={(e) => setSettings({ ...settings, officeCity: e.target.value })}
                                placeholder="Madrid"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Código postal
                            </label>
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
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Instrucciones adicionales
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
        </div>
    );
};

export default AvailabilitySettingsPage;