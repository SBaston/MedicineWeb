// ═══════════════════════════════════════════════════════════════
// AdminSettingsPage.jsx
// Configuración de plataforma — solo SuperAdmin
// Route: /admin/settings
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Percent, Building2, Hash, MapPin, ChevronLeft,
    Loader2, CheckCircle, AlertCircle, Edit2, X, Check,
    DollarSign, Zap, Settings, RefreshCw
} from 'lucide-react';
import adminService from '../services/adminService';

// ─────────────────────────────────────────────────────────────
// Descripción visual de cada clave de configuración
// ─────────────────────────────────────────────────────────────
const SETTING_META = {
    IvaRate: {
        label: 'Tipo de IVA general',
        icon: Percent,
        description: 'Se aplica a citas y suscripciones de chat pagadas por pacientes (art. 90 LIVA).',
        badge: 'Art. 90 LIVA',
        badgeColor: 'bg-emerald-100 text-emerald-700',
        iconBg: 'bg-emerald-600',
        type: 'percent',        // 0–1 en BD, se muestra como %
        min: 0, max: 100, step: 1,
        placeholder: '21',
        hint: 'Introduce el porcentaje (ej: 21 para un 21%). Se almacena automáticamente como decimal.',
        validate: (v) => {
            const n = parseFloat(v);
            if (isNaN(n) || n < 0 || n > 100) return 'Debe ser un número entre 0 y 100.';
        },
        toDbValue: (display) => (parseFloat(display) / 100).toFixed(4),
        toDisplayValue: (db) => (parseFloat(db) * 100).toFixed(0),
        displaySuffix: '%',
    },
    PlatformCommission: {
        label: 'Comisión de la plataforma',
        icon: DollarSign,
        description: 'Porcentaje que retiene NexusSalud de cada pago. El profesional recibe el resto.',
        badge: 'Comisión',
        badgeColor: 'bg-blue-100 text-blue-700',
        iconBg: 'bg-blue-600',
        type: 'percent_direct', // ya es % en BD
        min: 0, max: 100, step: 0.5,
        placeholder: '15',
        hint: 'Porcentaje que cobra la plataforma. El profesional recibe el complemento.',
        validate: (v) => {
            const n = parseFloat(v);
            if (isNaN(n) || n < 0 || n > 100) return 'Debe ser un número entre 0 y 100.';
        },
        toDbValue: (display) => display,
        toDisplayValue: (db) => db,
        displaySuffix: '%',
    },
    IssuerName: {
        label: 'Nombre del emisor de facturas',
        icon: Building2,
        description: 'Razón social que aparecerá en todas las facturas emitidas.',
        badge: 'Facturación',
        badgeColor: 'bg-violet-100 text-violet-700',
        iconBg: 'bg-violet-600',
        type: 'text',
        placeholder: 'NexusSalud S.L.',
        hint: 'Razón social o nombre comercial del emisor.',
        validate: (v) => { if (!v.trim()) return 'El nombre no puede estar vacío.'; },
        toDbValue: (v) => v,
        toDisplayValue: (v) => v,
    },
    IssuerNif: {
        label: 'NIF del emisor',
        icon: Hash,
        description: 'Número de Identificación Fiscal del emisor que aparece en las facturas.',
        badge: 'Facturación',
        badgeColor: 'bg-violet-100 text-violet-700',
        iconBg: 'bg-violet-500',
        type: 'text',
        placeholder: 'B00000000',
        hint: 'NIF, CIF o equivalente del titular fiscal de la plataforma.',
        validate: (v) => { if (!v.trim()) return 'El NIF no puede estar vacío.'; },
        toDbValue: (v) => v,
        toDisplayValue: (v) => v,
    },
    IssuerAddress: {
        label: 'Dirección fiscal del emisor',
        icon: MapPin,
        description: 'Dirección que se imprimirá en el pie de cada factura emitida.',
        badge: 'Facturación',
        badgeColor: 'bg-violet-100 text-violet-700',
        iconBg: 'bg-violet-400',
        type: 'text',
        placeholder: 'Calle Ejemplo 1, 28001 Madrid',
        hint: 'Incluye calle, número, código postal y ciudad.',
        validate: (v) => { if (!v.trim()) return 'La dirección no puede estar vacía.'; },
        toDbValue: (v) => v,
        toDisplayValue: (v) => v,
    },
};

// Orden de aparición en la UI
const SETTING_ORDER = ['IvaRate', 'PlatformCommission', 'IssuerName', 'IssuerNif', 'IssuerAddress'];

// ─────────────────────────────────────────────────────────────
// Fila de una configuración
// ─────────────────────────────────────────────────────────────
const SettingRow = ({ setting, onSave, saving }) => {
    const meta = SETTING_META[setting.key] ?? {
        label: setting.key,
        icon: Settings,
        iconBg: 'bg-gray-500',
        description: setting.description ?? '',
        type: 'text',
        toDisplayValue: (v) => v,
        toDbValue: (v) => v,
        validate: () => undefined,
    };

    const Icon = meta.icon;
    const displayDefault = meta.toDisplayValue(setting.value);

    const [editing, setEditing]     = useState(false);
    const [input,   setInput]       = useState('');
    const [error,   setError]       = useState('');

    const openEdit = () => {
        setInput(displayDefault);
        setError('');
        setEditing(true);
    };

    const cancelEdit = () => {
        setEditing(false);
        setError('');
    };

    const handleSave = () => {
        const validationErr = meta.validate?.(input);
        if (validationErr) { setError(validationErr); return; }
        const dbValue = meta.toDbValue(input);
        onSave(setting.key, dbValue, () => setEditing(false));
    };

    return (
        <div className="px-6 py-5">
            <div className="flex items-start gap-4">
                {/* Icono */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.iconBg}`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-semibold text-gray-900">{meta.label}</p>
                        {meta.badge && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.badgeColor}`}>
                                {meta.badge}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500">{meta.description}</p>

                    {/* Modo edición */}
                    {editing && (
                        <div className="mt-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                {meta.type === 'text' ? (
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={e => { setInput(e.target.value); setError(''); }}
                                        placeholder={meta.placeholder}
                                        autoFocus
                                        className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min={meta.min} max={meta.max} step={meta.step}
                                            value={input}
                                            onChange={e => { setInput(e.target.value); setError(''); }}
                                            placeholder={meta.placeholder}
                                            autoFocus
                                            className="w-28 border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                            {meta.displaySuffix}
                                        </span>
                                    </div>
                                )}

                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
                                >
                                    {saving
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <Check className="w-4 h-4" />}
                                    {saving ? 'Guardando…' : 'Guardar'}
                                </button>

                                <button
                                    onClick={cancelEdit}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {meta.hint && !error && (
                                <p className="text-xs text-gray-400 mt-1.5">{meta.hint}</p>
                            )}
                            {error && (
                                <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" /> {error}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Valor actual + botón editar (solo cuando NO está editando) */}
                {!editing && (
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-lg font-bold text-gray-800">
                            {displayDefault}{meta.displaySuffix ?? ''}
                        </span>
                        <button
                            onClick={openEdit}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                            Editar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────────────────────
const AdminSettingsPage = () => {
    const qc = useQueryClient();
    const [toasts, setToasts] = useState([]);   // { id, key, ok, message }
    const [savingKey, setSavingKey] = useState(null);

    const { data: settings = [], isLoading, isError, refetch } = useQuery({
        queryKey: ['admin-platform-settings'],
        queryFn: adminService.getSettings,
    });

    const updateMut = useMutation({
        mutationFn: ({ key, value }) => adminService.updateSetting(key, value),
        onSuccess: (_, variables) => {
            qc.invalidateQueries({ queryKey: ['admin-platform-settings'] });
            qc.invalidateQueries({ queryKey: ['platform-tax-rate'] });
            setSavingKey(null);
            addToast(variables.key, true, 'Guardado correctamente');
        },
        onError: (err, variables) => {
            setSavingKey(null);
            const msg = err.response?.data?.message || 'Error al guardar';
            addToast(variables.key, false, msg);
        },
    });

    const seedMut = useMutation({
        mutationFn: () => adminService.seedSettings?.() ?? Promise.reject('No implementado'),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-platform-settings'] });
            addToast('seed', true, 'Valores por defecto inicializados');
        },
    });

    const addToast = (key, ok, message) => {
        const id = Date.now();
        setToasts(t => [...t, { id, key, ok, message }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
    };

    const handleSave = (key, value, onDone) => {
        setSavingKey(key);
        updateMut.mutate({ key, value }, { onSuccess: onDone, onError: onDone });
    };

    // Ordenar settings según SETTING_ORDER, el resto al final
    const ordered = [
        ...SETTING_ORDER.map(k => settings.find(s => s.key === k)).filter(Boolean),
        ...settings.filter(s => !SETTING_ORDER.includes(s.key)),
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto px-4 py-8">

                {/* Cabecera */}
                <div className="mb-8">
                    <Link
                        to="/admin"
                        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Volver al panel
                    </Link>

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center">
                                <Settings className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Configuración de plataforma</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Parámetros fiscales y de facturación</p>
                            </div>
                        </div>

                        <button
                            onClick={() => refetch()}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Recargar"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Estado de carga / error */}
                {isLoading && (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                )}

                {isError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                        <p className="text-red-700 font-medium">Error al cargar la configuración</p>
                        <p className="text-sm text-red-500 mt-1">
                            Asegúrate de que la BD tenga datos (usa "Inicializar valores" si es la primera vez).
                        </p>
                        <button
                            onClick={() => seedMut.mutate()}
                            disabled={seedMut.isPending}
                            className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                            {seedMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            Inicializar valores por defecto
                        </button>
                    </div>
                )}

                {/* Sin datos */}
                {!isLoading && !isError && settings.length === 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                        <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                        <p className="text-amber-800 font-medium">No hay configuración inicializada</p>
                        <p className="text-sm text-amber-600 mt-1">
                            Haz clic en el botón para crear los valores por defecto.
                        </p>
                        <button
                            onClick={() => seedMut.mutate()}
                            disabled={seedMut.isPending}
                            className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                            {seedMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            Inicializar valores por defecto
                        </button>
                    </div>
                )}

                {/* Lista de ajustes */}
                {!isLoading && ordered.length > 0 && (
                    <>
                        {/* Grupo: Fiscalidad */}
                        <section className="mb-6">
                            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                Fiscalidad y comisiones
                            </h2>
                            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 shadow-sm">
                                {ordered
                                    .filter(s => ['IvaRate', 'PlatformCommission'].includes(s.key))
                                    .map(s => (
                                        <SettingRow
                                            key={s.key}
                                            setting={s}
                                            onSave={handleSave}
                                            saving={savingKey === s.key}
                                        />
                                    ))
                                }
                            </div>
                        </section>

                        {/* Grupo: Datos del emisor */}
                        <section className="mb-6">
                            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                Datos del emisor de facturas
                            </h2>
                            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 shadow-sm">
                                {ordered
                                    .filter(s => ['IssuerName', 'IssuerNif', 'IssuerAddress'].includes(s.key))
                                    .map(s => (
                                        <SettingRow
                                            key={s.key}
                                            setting={s}
                                            onSave={handleSave}
                                            saving={savingKey === s.key}
                                        />
                                    ))
                                }
                            </div>
                        </section>

                        {/* Otros ajustes no reconocidos */}
                        {ordered.filter(s => !SETTING_ORDER.includes(s.key)).length > 0 && (
                            <section className="mb-6">
                                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                    Otros ajustes
                                </h2>
                                <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 shadow-sm">
                                    {ordered
                                        .filter(s => !SETTING_ORDER.includes(s.key))
                                        .map(s => (
                                            <SettingRow
                                                key={s.key}
                                                setting={s}
                                                onSave={handleSave}
                                                saving={savingKey === s.key}
                                            />
                                        ))
                                    }
                                </div>
                            </section>
                        )}

                        {/* Nota legal */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                            <strong>Nota:</strong> Los cambios son efectivos de forma inmediata en toda la plataforma.
                            El tipo de IVA afecta a los precios mostrados a los usuarios y a las facturas emitidas conforme al RD 1619/2012.
                        </div>
                    </>
                )}
            </div>

            {/* Toasts */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
                            ${t.ok
                                ? 'bg-emerald-600 text-white'
                                : 'bg-red-600 text-white'}`}
                    >
                        {t.ok
                            ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                            : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                        {t.message}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminSettingsPage;
