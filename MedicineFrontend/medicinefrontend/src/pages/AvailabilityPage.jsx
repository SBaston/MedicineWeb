// ═══════════════════════════════════════════════════════════════
// AvailabilityPage.jsx - Gestión de Disponibilidad Horaria
// SIN MOCKS - Conectado con backend real
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, Plus, Trash2, Clock,
    Calendar, CheckCircle, XCircle, Copy
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

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
});

const AvailabilityPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [availabilities, setAvailabilities] = useState({});
    const [selectedDay, setSelectedDay] = useState(null);

    useEffect(() => {
        loadAvailabilities();
    }, []);

    const loadAvailabilities = async () => {
        try {
            setLoadingData(true);
            const data = await doctorDashboardService.getAvailabilities();

            // Organizar por día
            const grouped = {};
            data.forEach(av => {
                if (!grouped[av.dayOfWeek]) {
                    grouped[av.dayOfWeek] = [];
                }
                grouped[av.dayOfWeek].push(av);
            });

            setAvailabilities(grouped);
        } catch (error) {
            console.error('Error al cargar disponibilidades:', error);
            alert('Error al cargar los horarios');
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
            // Es temporal, solo quitar del estado
            setAvailabilities(prev => ({
                ...prev,
                [dayValue]: prev[dayValue].filter(slot => slot.id !== slotId)
            }));
        } else {
            // Es del backend, eliminar
            if (!confirm('¿Eliminar esta franja horaria?')) return;

            try {
                await doctorDashboardService.deleteAvailability(slotId);
                setAvailabilities(prev => ({
                    ...prev,
                    [dayValue]: prev[dayValue].filter(slot => slot.id !== slotId)
                }));
            } catch (error) {
                console.error('Error al eliminar:', error);
                alert('Error al eliminar la franja horaria');
            }
        }
    };

    const updateTimeSlot = (dayValue, slotId, field, value) => {
        setAvailabilities(prev => ({
            ...prev,
            [dayValue]: prev[dayValue].map(slot =>
                slot.id === slotId ? { ...slot, [field]: value } : slot
            )
        }));
    };

    const copyScheduleToAll = (sourceDayValue) => {
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

    const handleSave = async () => {
        setLoading(true);

        try {
            const allSlots = Object.values(availabilities).flat();

            for (const slot of allSlots) {
                if (slot.isNew) {
                    // Crear nuevo
                    await doctorDashboardService.createAvailability({
                        dayOfWeek: slot.dayOfWeek,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        isAvailable: slot.isAvailable,
                        notes: slot.notes || null
                    });
                } else if (slot.modified) {
                    // Actualizar existente
                    await doctorDashboardService.updateAvailability(slot.id, {
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        isAvailable: slot.isAvailable,
                        notes: slot.notes || null
                    });
                }
            }

            alert('✅ Horarios guardados correctamente');
            navigate('/doctor');

        } catch (error) {
            console.error('Error al guardar:', error);
            alert('❌ Error al guardar los horarios');
        } finally {
            setLoading(false);
        }
    };

    const getDayScheduleSummary = (dayValue) => {
        const slots = availabilities[dayValue] || [];
        if (slots.length === 0) return 'Sin horario';

        const activeSlots = slots.filter(s => s.isAvailable);
        if (activeSlots.length === 0) return 'No disponible';

        return `${activeSlots.length} franja${activeSlots.length > 1 ? 's' : ''}`;
    };

    if (loadingData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Cargando horarios...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate('/doctor')}
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Volver</span>
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Guardar cambios
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Disponibilidad horaria</h1>
                    <p className="text-slate-600">
                        Configura tus horarios de atención para que los pacientes puedan reservar citas
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Days List */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-6">
                            <Calendar className="w-5 h-5 text-purple-600" />
                            <h2 className="text-lg font-bold text-slate-900">Días de la semana</h2>
                        </div>

                        <div className="space-y-2">
                            {DAYS.map((day) => {
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
                                            <div>
                                                <p className="font-semibold text-slate-900">{day.label}</p>
                                                <p className="text-sm text-slate-600">
                                                    {getDayScheduleSummary(day.value)}
                                                </p>
                                            </div>
                                            {hasSchedule && isActive ? (
                                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                                            ) : hasSchedule ? (
                                                <XCircle className="w-5 h-5 text-slate-400" />
                                            ) : null}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Schedule Editor */}
                    <div className="lg:col-span-2">
                        {selectedDay === null ? (
                            <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
                                <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-900 mb-2">
                                    Selecciona un día
                                </h3>
                                <p className="text-slate-600">
                                    Elige un día de la semana para configurar tus horarios
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-purple-600" />
                                        <h2 className="text-lg font-bold text-slate-900">
                                            Horarios - {DAYS.find(d => d.value === selectedDay)?.label}
                                        </h2>
                                    </div>
                                    <div className="flex gap-2">
                                        {availabilities[selectedDay]?.length > 0 && (
                                            <button
                                                onClick={() => copyScheduleToAll(selectedDay)}
                                                className="px-4 py-2 text-sm font-semibold text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1"
                                            >
                                                <Copy className="w-4 h-4" />
                                                Copiar a todos los días
                                            </button>
                                        )}
                                        <button
                                            onClick={() => addTimeSlot(selectedDay)}
                                            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Añadir franja
                                        </button>
                                    </div>
                                </div>

                                {!availabilities[selectedDay] || availabilities[selectedDay].length === 0 ? (
                                    <div className="text-center py-12">
                                        <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-600 mb-4">
                                            No hay franjas horarias configuradas
                                        </p>
                                        <button
                                            onClick={() => addTimeSlot(selectedDay)}
                                            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
                                        >
                                            <Plus className="w-5 h-5" />
                                            Añadir primera franja
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {availabilities[selectedDay].map((slot) => (
                                            <div
                                                key={slot.id}
                                                className="p-4 rounded-xl border-2 border-slate-200 hover:border-purple-200 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                                Hora de inicio
                                                            </label>
                                                            <select
                                                                value={slot.startTime}
                                                                onChange={(e) => updateTimeSlot(selectedDay, slot.id, 'startTime', e.target.value)}
                                                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                            >
                                                                {TIME_SLOTS.map(time => (
                                                                    <option key={time} value={time}>{time}</option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                                Hora de fin
                                                            </label>
                                                            <select
                                                                value={slot.endTime}
                                                                onChange={(e) => updateTimeSlot(selectedDay, slot.id, 'endTime', e.target.value)}
                                                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                            >
                                                                {TIME_SLOTS.map(time => (
                                                                    <option key={time} value={time}>{time}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => updateTimeSlot(selectedDay, slot.id, 'isAvailable', !slot.isAvailable)}
                                                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${slot.isAvailable
                                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                                }`}
                                                        >
                                                            {slot.isAvailable ? 'Activo' : 'Inactivo'}
                                                        </button>

                                                        <button
                                                            onClick={() => removeTimeSlot(selectedDay, slot.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Quick Setup Guide */}
                        <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-6 mt-6 border border-purple-200">
                            <h3 className="font-bold text-slate-900 mb-3">💡 Consejos rápidos</h3>
                            <ul className="space-y-2 text-sm text-slate-700">
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600">•</span>
                                    <span>Puedes añadir múltiples franjas por día (ej: mañana y tarde)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600">•</span>
                                    <span>Marca una franja como "Inactiva" temporalmente sin eliminarla</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600">•</span>
                                    <span>Usa "Copiar a todos los días" para configurar la misma rutina</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AvailabilityPage;