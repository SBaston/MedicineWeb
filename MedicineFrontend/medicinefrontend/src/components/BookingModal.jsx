// ═══════════════════════════════════════════════════════════════
// BookingModal.jsx - Modal de reserva de cita médica
// Flujo: Tipo (presencial/online) → Fecha → Hora → Motivo → Pago → Confirmación
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X, ChevronLeft, ChevronRight, Calendar, Clock,
    Video, MapPin, CreditCard, CheckCircle, AlertCircle,
    Loader2, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import appointmentService from '../services/appointmentService';
import professionalsService from '../services/professionalsService';
import api from '../services/api';

// ─────────────────────────────────────────────────────────────
// HELPERS de fecha
// ─────────────────────────────────────────────────────────────
const DAY_NAMES    = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_NAMES  = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const formatDate = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const isSameDay = (a, b) =>
    a && b && a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Devuelve los días del mes como array (con nulls para rellenar la primera semana)
const buildMonthGrid = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay(); // 0=Dom
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid = [];
    for (let i = 0; i < firstDay; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(new Date(year, month, d));
    return grid;
};

// ─────────────────────────────────────────────────────────────
// PASO 1: Seleccionar tipo de cita
// ─────────────────────────────────────────────────────────────
const StepType = ({ onSelect, selected }) => (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">¿Cómo quieres la consulta?</h3>
        <div className="grid grid-cols-2 gap-4">
            <button
                onClick={() => onSelect('presencial')}
                className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                    selected === 'presencial'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
            >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    selected === 'presencial' ? 'bg-primary-100' : 'bg-gray-100'
                }`}>
                    <MapPin className="w-7 h-7" />
                </div>
                <div className="text-center">
                    <p className="font-semibold text-base">Presencial</p>
                    <p className="text-xs mt-1 opacity-70">En consulta física</p>
                </div>
                {selected === 'presencial' && (
                    <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                )}
            </button>

            <button
                onClick={() => onSelect('online')}
                className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                    selected === 'online'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
            >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    selected === 'online' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                    <Video className="w-7 h-7" />
                </div>
                <div className="text-center">
                    <p className="font-semibold text-base">Online</p>
                    <p className="text-xs mt-1 opacity-70">Por videollamada</p>
                </div>
                {selected === 'online' && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                )}
            </button>
        </div>

        {selected === 'online' && (
            <p className="text-sm text-blue-600 bg-blue-50 rounded-lg p-3 mt-2">
                📹 El profesional te enviará el enlace de videollamada por email antes de la cita.
            </p>
        )}
        {selected === 'presencial' && (
            <p className="text-sm text-green-700 bg-green-50 rounded-lg p-3 mt-2">
                📍 El profesional te contactará con los detalles de ubicación de la consulta.
            </p>
        )}
    </div>
);

// ─────────────────────────────────────────────────────────────
// PASO 2: Calendario mensual + selector de hora
// ─────────────────────────────────────────────────────────────
const StepDateTime = ({ doctorId, availability, selectedDate, selectedSlot, onDateChange, onSlotChange }) => {
    const today = new Date();
    const [viewYear,  setViewYear]  = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [slots,        setSlots]        = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [slotError,    setSlotError]    = useState('');

    // Días de la semana en los que el doctor trabaja (0=Dom..6=Sáb)
    const workingDays = new Set(
        (availability || [])
            .filter(a => a.isAvailable)
            .map(a => a.dayOfWeek)
    );

    const grid = buildMonthGrid(viewYear, viewMonth);

    const isDayDisabled = (d) => {
        if (!d) return true;
        const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const noWork = workingDays.size > 0 && !workingDays.has(d.getDay());
        return isPast || noWork;
    };

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    // No permitir ir a meses anteriores al actual
    const canGoPrev = viewYear > today.getFullYear() ||
        (viewYear === today.getFullYear() && viewMonth > today.getMonth());

    // Cargar slots al seleccionar fecha
    useEffect(() => {
        if (!selectedDate) return;
        const fetchSlots = async () => {
            setLoadingSlots(true);
            setSlotError('');
            onSlotChange(null);
            try {
                const data = await appointmentService.getAvailableSlots(doctorId, formatDate(selectedDate));
                setSlots(data);
                if (data.length === 0) setSlotError('No hay horas disponibles para este día');
            } catch {
                setSlotError('Error al cargar horarios disponibles');
            } finally {
                setLoadingSlots(false);
            }
        };
        fetchSlots();
    }, [selectedDate, doctorId]);

    const handleDayClick = (d) => {
        if (isDayDisabled(d)) return;
        setSlots([]);
        setSlotError('');
        onDateChange(d);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Elige fecha y hora</h3>

            {/* Cabecera del mes */}
            <div className="flex items-center justify-between">
                <button
                    onClick={prevMonth}
                    disabled={!canGoPrev}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="font-semibold text-gray-900">
                    {MONTH_NAMES[viewMonth]} {viewYear}
                </span>
                <button
                    onClick={nextMonth}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            {/* Grid del calendario */}
            <div className="grid grid-cols-7 gap-1">
                {/* Cabecera días */}
                {DAY_NAMES.map(d => (
                    <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
                ))}

                {/* Días del mes */}
                {grid.map((d, i) => {
                    if (!d) return <div key={`empty-${i}`} />;
                    const disabled = isDayDisabled(d);
                    const selected = isSameDay(d, selectedDate);
                    const isToday  = isSameDay(d, today);

                    return (
                        <button
                            key={formatDate(d)}
                            onClick={() => handleDayClick(d)}
                            disabled={disabled}
                            className={`
                                aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center
                                ${selected
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : disabled
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : isToday
                                            ? 'border-2 border-primary-400 text-primary-700 hover:bg-primary-50'
                                            : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700'
                                }
                            `}
                        >
                            {d.getDate()}
                        </button>
                    );
                })}
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded border-2 border-primary-400 inline-block" /> Hoy
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-gray-200 inline-block" /> No disponible
                </span>
            </div>

            {/* Slots de hora */}
            {selectedDate && (
                <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                        Horas disponibles — {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    {loadingSlots ? (
                        <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Cargando horarios...</span>
                        </div>
                    ) : slotError ? (
                        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg p-3">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm">{slotError}</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            {slots.map((slot) => {
                                const isSelected = selectedSlot?.start === slot.start;
                                const startTime  = new Date(slot.start);
                                return (
                                    <button
                                        key={slot.start}
                                        onClick={() => onSlotChange(slot)}
                                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                                            isSelected
                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                : 'border-gray-200 hover:border-primary-300 text-gray-600'
                                        }`}
                                    >
                                        <Clock className="w-3.5 h-3.5" />
                                        {startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {!selectedDate && (
                <p className="text-sm text-gray-400 italic text-center py-2">
                    Selecciona un día disponible para ver los horarios
                </p>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// PASO 3: Motivo de consulta
// ─────────────────────────────────────────────────────────────
const StepReason = ({ reason, onChange }) => (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Motivo de la consulta</h3>
        <p className="text-sm text-gray-500">Describe brevemente el motivo de tu consulta (opcional).</p>
        <textarea
            value={reason}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Ej: Revisión general, dolor de cabeza frecuente, consulta sobre medicación..."
            rows={4}
            className="w-full border border-gray-200 rounded-xl p-4 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-400">{reason.length}/500 caracteres</p>
    </div>
);

// ─────────────────────────────────────────────────────────────
// PASO 4: Resumen y pago
// ─────────────────────────────────────────────────────────────
const StepPayment = ({ professional, appointmentType, selectedDate, selectedSlot, reason, price }) => {
    const slotDate = selectedSlot ? new Date(selectedSlot.start) : null;
    const typeLabel = appointmentType === 'online' ? 'Online (videollamada)' : 'Presencial';
    const typeColor = appointmentType === 'online' ? 'text-blue-600' : 'text-green-600';
    const TypeIcon = appointmentType === 'online' ? Video : MapPin;

    return (
        <div className="space-y-5">
            <h3 className="text-lg font-semibold text-gray-900">Resumen de tu cita</h3>

            {/* Info del profesional */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <img
                    src={professional.profilePictureUrl || `https://ui-avatars.com/api/?name=${professional.firstName}+${professional.lastName}&background=3b82f6&color=fff`}
                    alt={`${professional.firstName} ${professional.lastName}`}
                    className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                    <p className="font-semibold text-gray-900">Dr/Dra. {professional.firstName} {professional.lastName}</p>
                    <div className="flex items-center gap-1 text-sm text-yellow-500">
                        <Star className="w-3.5 h-3.5 fill-yellow-400" />
                        <span className="text-gray-600">{professional.averageRating?.toFixed(1) ?? '—'}</span>
                    </div>
                </div>
            </div>

            {/* Detalles de la cita */}
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-gray-500 flex items-center gap-1.5">
                        <TypeIcon className="w-4 h-4" /> Modalidad
                    </span>
                    <span className={`text-sm font-semibold ${typeColor}`}>{typeLabel}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-gray-500 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" /> Fecha
                    </span>
                    <span className="text-sm font-semibold text-gray-800">
                        {slotDate ? slotDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : '—'}
                    </span>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-gray-500 flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> Hora
                    </span>
                    <span className="text-sm font-semibold text-gray-800">
                        {slotDate ? slotDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
                </div>
                {reason && (
                    <div className="px-4 py-3">
                        <span className="text-sm text-gray-500">Motivo</span>
                        <p className="text-sm text-gray-700 mt-1">{reason}</p>
                    </div>
                )}
            </div>

            {/* Total */}
            <div className="bg-primary-50 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary-700">
                    <CreditCard className="w-5 h-5" />
                    <span className="font-semibold">Total a pagar</span>
                </div>
                <span className="text-2xl font-bold text-primary-700">{price?.toFixed(2)} €</span>
            </div>

            {price > 0 ? (
                <p className="text-xs text-gray-400 text-center">
                    Al hacer clic en "Pagar con Stripe" serás redirigido de forma segura a Stripe.
                    Acepta los términos y condiciones de NexusSalud.
                </p>
            ) : (
                <p className="text-xs text-gray-400 text-center">
                    Al confirmar, aceptas los términos y condiciones de NexusSalud.
                </p>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// PASO 5: Confirmación final
// ─────────────────────────────────────────────────────────────
const StepConfirmation = ({ appointmentType, selectedSlot }) => {
    const slotDate = selectedSlot ? new Date(selectedSlot.start) : null;
    const isOnline = appointmentType === 'online';

    return (
        <div className="text-center py-4 space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">¡Cita confirmada!</h3>
                <p className="text-gray-600">
                    Tu cita ha sido reservada para el{' '}
                    <strong>
                        {slotDate?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </strong>{' '}
                    a las{' '}
                    <strong>
                        {slotDate?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </strong>.
                </p>
            </div>

            <div className={`rounded-xl p-4 text-sm ${isOnline ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                {isOnline
                    ? '📹 Recibirás el enlace de videollamada por email antes de la cita. Revisa también tu carpeta de spam.'
                    : '📍 Recibirás los detalles de ubicación de la consulta. El profesional se pondrá en contacto contigo.'}
            </div>

            <p className="text-sm text-gray-500">Se ha enviado un email de confirmación con todos los detalles.</p>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL: BookingModal
// ─────────────────────────────────────────────────────────────

const STEPS = ['Tipo', 'Fecha y hora', 'Motivo', 'Pago', 'Confirmación'];

const BookingModal = ({ professional, onClose }) => {
    const { isAuthenticated, isPatient } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(0);
    const [appointmentType, setAppointmentType] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [availability, setAvailability] = useState([]);

    // Si no está autenticado, redirigir al login
    useEffect(() => {
        if (!isAuthenticated) {
            onClose();
            navigate('/login', { state: { from: '/professionals' } });
        }
    }, [isAuthenticated]);

    // Cargar disponibilidad del doctor para saber qué días pintar en el calendario
    useEffect(() => {
        professionalsService.getAvailability(professional.id)
            .then(setAvailability)
            .catch(() => {}); // Si falla, el calendario simplemente no bloquea días
    }, [professional.id]);

    const canGoNext = () => {
        if (step === 0) return !!appointmentType;
        if (step === 1) return !!selectedDate && !!selectedSlot;
        if (step === 2) return true; // Motivo es opcional
        if (step === 3) return true;
        return false;
    };

    const handleConfirm = async () => {
        setLoading(true);
        setError('');
        try {
            // 1. Crear la cita (queda en "PendientePago" si tiene precio, o "Confirmada" si es gratuita)
            const appointment = await appointmentService.book({
                doctorId: professional.id,
                appointmentDate: selectedSlot.start,
                appointmentType,
                reason: reason.trim() || null,
            });

            const price = professional.pricePerSession ?? 0;

            // 2. Si tiene precio → redirigir a Stripe Checkout
            if (price > 0) {
                const { data } = await api.post('/payments/appointment-checkout', {
                    appointmentId: appointment.id,
                });
                window.location.href = data.url; // Redirigir a Stripe
            } else {
                // Cita gratuita → ir directamente a la pantalla de confirmación
                setStep(4);
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Error al reservar la cita. Inténtalo de nuevo.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (step === 3) {
            handleConfirm();
        } else {
            setStep(s => s + 1);
        }
    };

    const handleBack = () => {
        setError('');
        setStep(s => s - 1);
    };

    // Si el usuario no es paciente, mostrar aviso
    if (isAuthenticated && !isPatient) {
        return (
            <ModalShell onClose={onClose} step={null}>
                <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Acción no disponible</h3>
                    <p className="text-gray-600">Solo los pacientes pueden reservar citas.</p>
                    <button onClick={onClose} className="mt-6 btn-primary">Cerrar</button>
                </div>
            </ModalShell>
        );
    }

    return (
        <ModalShell onClose={step < 4 ? onClose : null} step={step}>
            {/* Header de pasos */}
            {step < 4 && (
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Paso {step + 1} de 4
                        </span>
                        <span className="text-xs text-gray-400">{STEPS[step]}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary-500 rounded-full transition-all duration-300"
                            style={{ width: `${((step + 1) / 4) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Contenido del paso */}
            <div className="min-h-[280px]">
                {step === 0 && (
                    <StepType onSelect={setAppointmentType} selected={appointmentType} />
                )}
                {step === 1 && (
                    <StepDateTime
                        doctorId={professional.id}
                        selectedDate={selectedDate}
                        selectedSlot={selectedSlot}
                        onDateChange={setSelectedDate}
                        onSlotChange={setSelectedSlot}
                    />
                )}
                {step === 2 && (
                    <StepReason reason={reason} onChange={setReason} />
                )}
                {step === 3 && (
                    <StepPayment
                        professional={professional}
                        appointmentType={appointmentType}
                        selectedDate={selectedDate}
                        selectedSlot={selectedSlot}
                        reason={reason}
                        price={professional.pricePerSession}
                    />
                )}
                {step === 4 && (
                    <StepConfirmation appointmentType={appointmentType} selectedSlot={selectedSlot} />
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Botones de navegación */}
            <div className="mt-6 flex gap-3">
                {step < 4 ? (
                    <>
                        {step > 0 && (
                            <button
                                onClick={handleBack}
                                disabled={loading}
                                className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Atrás
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            disabled={!canGoNext() || loading}
                            className="flex-1 flex items-center justify-center gap-2 btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Procesando...
                                </>
                            ) : step === 3 ? (
                                <>
                                    <CreditCard className="w-4 h-4" />
                                    {(professional?.pricePerSession ?? 0) > 0
                                        ? 'Pagar con Stripe'
                                        : 'Confirmar cita'}
                                </>
                            ) : (
                                <>
                                    Continuar
                                    <ChevronRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </>
                ) : (
                    <button onClick={onClose} className="flex-1 btn-primary py-2.5">
                        ¡Perfecto!
                    </button>
                )}
            </div>
        </ModalShell>
    );
};

// ─────────────────────────────────────────────────────────────
// WRAPPER: Overlay + Contenedor del modal
// ─────────────────────────────────────────────────────────────
const ModalShell = ({ children, onClose, step }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-primary-600" />
                    </div>
                    <h2 className="font-bold text-gray-900">Reservar cita</h2>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
            <div className="p-5">{children}</div>
        </div>
    </div>
);

export default BookingModal;
