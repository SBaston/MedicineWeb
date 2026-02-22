import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/adminService';
import {
    ShieldCheck, Clock, CheckCircle, XCircle, Trash2, Users,
    Stethoscope, Mail, AlertTriangle, ChevronDown, ChevronUp,
    Star, Crown, UserPlus
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════
// COMPONENTES DE APOYO
// ════════════════════════════════════════════════════════════════

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-900">{value ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        </div>
    </div>
);

// Modal reutilizable de confirmación (con o sin campo de motivo)
const ConfirmModal = ({ title, description, requireReason, reasonLabel, danger, onConfirm, onCancel }) => {
    const [reason, setReason] = useState('');
    const valid = !requireReason || reason.trim().length >= 10;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${danger ? 'bg-red-100' : 'bg-green-100'}`}>
                        <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-600' : 'text-green-600'}`} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">{description}</p>
                {requireReason && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {reasonLabel} <span className="text-red-500">*</span>
                        </label>
                        <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
                            placeholder="Mínimo 10 caracteres…"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        <p className="text-xs text-gray-400 mt-1">{reason.length} / 10 mínimos</p>
                    </div>
                )}
                <div className="flex gap-3 justify-end">
                    <button onClick={onCancel} className="btn-secondary text-sm px-4 py-2">Cancelar</button>
                    <button onClick={() => onConfirm(reason)} disabled={!valid}
                        className={`text-sm px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                            ${danger ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

// ════════════════════════════════════════════════════════════════
// SECCIÓN: PROFESIONALES PENDIENTES
// ════════════════════════════════════════════════════════════════

const PendingDoctorRow = ({ doctor, onApprove, onReject }) => {
    const [expanded, setExpanded] = useState(false);
    const avatar = doctor.profilePictureUrl
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.fullName)}&background=3b82f6&color=fff&size=200&bold=true`;

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-4 p-4">
                <img src={avatar} alt={doctor.fullName}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-gray-100" />
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{doctor.fullName}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" /> {doctor.email}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                        {doctor.specialties.map(s => (
                            <span key={s} className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full">{s}</span>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setExpanded(!expanded)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => onReject(doctor)}
                        className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors">
                        <XCircle className="w-4 h-4" /> Rechazar
                    </button>
                    <button onClick={() => onApprove(doctor)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                        <CheckCircle className="w-4 h-4" /> Aprobar
                    </button>
                </div>
            </div>
            {expanded && (
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Nº Colegiado</p>
                        <p className="font-medium text-gray-800">{doctor.professionalLicense}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Experiencia</p>
                        <p className="font-medium text-gray-800">{doctor.yearsOfExperience ?? '—'} años</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Precio / sesión</p>
                        <p className="font-medium text-gray-800">{doctor.pricePerSession} €</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Teléfono</p>
                        <p className="font-medium text-gray-800">{doctor.phoneNumber || '—'}</p>
                    </div>
                    {doctor.description && (
                        <div className="col-span-full">
                            <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Descripción</p>
                            <p className="text-gray-700">{doctor.description}</p>
                        </div>
                    )}
                    <div className="col-span-full text-xs text-gray-400">
                        Registrado: {new Date(doctor.registeredAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                </div>
            )}
        </div>
    );
};

// ════════════════════════════════════════════════════════════════
// SECCIÓN: TODOS LOS PROFESIONALES (tabla)
// ════════════════════════════════════════════════════════════════

const STATUS_BADGE = {
    Active: 'bg-green-100 text-green-700',
    PendingReview: 'bg-yellow-100 text-yellow-700',
    Rejected: 'bg-red-100 text-red-700',
    Suspended: 'bg-orange-100 text-orange-700',
    Deleted: 'bg-gray-100 text-gray-400',
};
const STATUS_LABEL = {
    Active: 'Activo', PendingReview: 'Pendiente',
    Rejected: 'Rechazado', Suspended: 'Suspendido', Deleted: 'Eliminado'
};

const DoctorRow = ({ doctor, onDelete }) => {
    const avatar = doctor.profilePictureUrl
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.fullName)}&background=10b981&color=fff&size=200&bold=true`;
    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <img src={avatar} alt={doctor.fullName} className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                    <div>
                        <p className="font-medium text-gray-900 text-sm">{doctor.fullName}</p>
                        <p className="text-xs text-gray-400">{doctor.email}</p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">{doctor.specialties.slice(0, 2).join(', ') || '—'}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{doctor.pricePerSession} €</td>
            <td className="px-4 py-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[doctor.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABEL[doctor.status] ?? doctor.status}
                </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    {doctor.averageRating?.toFixed(1) ?? '—'}
                    <span className="text-xs text-gray-400">({doctor.totalReviews})</span>
                </span>
            </td>
            <td className="px-4 py-3">
                {doctor.status !== 'Deleted' && (
                    <button onClick={() => onDelete(doctor)}
                        className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                )}
            </td>
        </tr>
    );
};

// ════════════════════════════════════════════════════════════════
// SECCIÓN: GESTIÓN DE ADMINS (solo SuperAdmin)
// ════════════════════════════════════════════════════════════════

const AdminsSection = ({ isSuperAdmin }) => {
    const qc = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [confirmDeactivate, setConfirmDeactivate] = useState(null);
    const [form, setForm] = useState({ fullName: '', email: '', password: '', department: '' });
    const [formError, setFormError] = useState('');

    const { data: admins = [], isLoading } = useQuery({
        queryKey: ['admins-list'],
        queryFn: adminService.getAdmins,
        enabled: isSuperAdmin,
    });

    const createMut = useMutation({
        mutationFn: () => adminService.createAdmin(form),
        onSuccess: () => { qc.invalidateQueries(['admins-list']); setShowForm(false); setForm({ fullName: '', email: '', password: '', department: '' }); },
        onError: (err) => setFormError(err.response?.data?.message || 'Error al crear el admin'),
    });

    const deactivateMut = useMutation({
        mutationFn: (id) => adminService.deactivateAdmin(id),
        onSuccess: () => { qc.invalidateQueries(['admins-list']); setConfirmDeactivate(null); },
    });

    if (!isSuperAdmin) return null;

    return (
        <div className="mt-10 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    <h2 className="text-lg font-bold text-gray-900">Gestión de administradores</h2>
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">Solo SuperAdmin</span>
                </div>
                <button onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 btn-primary text-sm px-4 py-2">
                    <UserPlus className="w-4 h-4" /> Nuevo admin
                </button>
            </div>

            {/* Formulario de creación */}
            {showForm && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-5">
                    <h4 className="font-semibold text-gray-900 mb-4">Nuevo administrador</h4>
                    {formError && <p className="text-sm text-red-600 mb-3 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { name: 'fullName', label: 'Nombre completo *', placeholder: 'María García López', type: 'text' },
                            { name: 'email', label: 'Email *', placeholder: 'admin@medicare.com', type: 'email' },
                            { name: 'password', label: 'Contraseña temporal *', placeholder: 'Mínimo 8 caracteres', type: 'password' },
                            { name: 'department', label: 'Departamento', placeholder: 'Ej: Atención usuario', type: 'text' },
                        ].map(f => (
                            <div key={f.name}>
                                <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                                <input type={f.type} placeholder={f.placeholder} value={form[f.name]}
                                    onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                                    className="input-field text-sm w-full" />
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3 justify-end mt-4">
                        <button onClick={() => setShowForm(false)} className="btn-secondary text-sm px-4 py-2">Cancelar</button>
                        <button onClick={() => createMut.mutate()}
                            disabled={createMut.isPending || !form.fullName || !form.email || form.password.length < 8}
                            className="btn-primary text-sm px-4 py-2 disabled:opacity-50">
                            {createMut.isPending ? 'Creando…' : 'Crear administrador'}
                        </button>
                    </div>
                </div>
            )}

            {/* Tabla de admins */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            {['Nombre', 'Email', 'Departamento', 'Tipo', 'Estado', 'Alta', 'Acciones'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading
                            ? <tr><td colSpan={7} className="text-center py-10 text-gray-400">Cargando…</td></tr>
                            : admins.map(admin => (
                                <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900">{admin.fullName}</td>
                                    <td className="px-4 py-3 text-gray-500">{admin.email}</td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">{admin.department || '—'}</td>
                                    <td className="px-4 py-3">
                                        {admin.isSuperAdmin
                                            ? <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold"><Crown className="w-3 h-3" /> SuperAdmin</span>
                                            : <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold"><ShieldCheck className="w-3 h-3" /> Admin</span>
                                        }
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${admin.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                            {admin.isActive ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                        {new Date(admin.createdAt).toLocaleDateString('es-ES')}
                                    </td>
                                    <td className="px-4 py-3">
                                        {!admin.isSuperAdmin && admin.isActive && (
                                            <button onClick={() => setConfirmDeactivate(admin)}
                                                className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" /> Desactivar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>

            {confirmDeactivate && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="font-bold text-gray-900">Desactivar administrador</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">
                            ¿Desactivar a <strong>{confirmDeactivate.fullName}</strong>? Perderá el acceso al panel. Sus acciones anteriores quedan registradas.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setConfirmDeactivate(null)} className="btn-secondary text-sm px-4 py-2">Cancelar</button>
                            <button onClick={() => deactivateMut.mutate(confirmDeactivate.id)}
                                disabled={deactivateMut.isPending}
                                className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50">
                                {deactivateMut.isPending ? 'Desactivando…' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ════════════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL
// ════════════════════════════════════════════════════════════════

const AdminDashboard = () => {
    const { user } = useAuth();
    const qc = useQueryClient();
    const [tab, setTab] = useState('pending');
    const [filter, setFilter] = useState('active');
    const [modal, setModal] = useState(null); // { type: 'approve'|'reject'|'delete', doctor }

    const isSuperAdmin = user?.isSuperAdmin ?? false;

    const invalidate = () => {
        qc.invalidateQueries(['admin-pending']);
        qc.invalidateQueries(['admin-doctors']);
        qc.invalidateQueries(['admin-stats']);
    };

    // ── Queries ──────────────────────────────────────────────────────────────
    const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: adminService.getStats });
    const { data: pending = [], isLoading: lPend } = useQuery({ queryKey: ['admin-pending'], queryFn: adminService.getPending, enabled: tab === 'pending' });
    const { data: doctors = [], isLoading: lAll } = useQuery({ queryKey: ['admin-doctors', filter], queryFn: () => adminService.getAllDoctors(filter), enabled: tab === 'all' });

    // ── Mutaciones ────────────────────────────────────────────────────────────
    const approveMut = useMutation({
        mutationFn: ({ id }) => adminService.approve(id),
        onSuccess: () => { invalidate(); setModal(null); },
    });
    const rejectMut = useMutation({
        mutationFn: ({ id, reason }) => adminService.reject(id, reason),
        onSuccess: () => { invalidate(); setModal(null); },
    });
    const deleteMut = useMutation({
        mutationFn: ({ id, reason }) => adminService.removeDoctor(id, reason),
        onSuccess: () => { invalidate(); setModal(null); },
    });

    return (
        <div className="container-custom py-8">

            {/* ── Cabecera ── */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
                    <p className="text-sm text-gray-500">
                        {isSuperAdmin ? 'SuperAdmin · Acceso completo' : 'Gestiona profesionales y la plataforma'}
                    </p>
                </div>
            </div>

            {/* ── Estadísticas ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard icon={Clock} label="Pendientes de revisión" value={stats?.pendingReview} color="bg-yellow-500" />
                <StatCard icon={CheckCircle} label="Profesionales activos" value={stats?.activeProfessionals} color="bg-green-500" />
                <StatCard icon={Users} label="Pacientes registrados" value={stats?.totalPatients} color="bg-blue-500" />
                <StatCard icon={Stethoscope} label="Citas totales" value={stats?.totalAppointments} color="bg-purple-500" />
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
                {[
                    { key: 'pending', label: 'Pendientes', icon: Clock },
                    { key: 'all', label: 'Todos los profesionales', icon: Users },
                ].map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setTab(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}>
                        <Icon className="w-4 h-4" />
                        {label}
                        {key === 'pending' && stats?.pendingReview > 0 && (
                            <span className="w-5 h-5 bg-yellow-500 text-white rounded-full text-xs flex items-center justify-center">
                                {stats.pendingReview}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Tab: Pendientes ── */}
            {tab === 'pending' && (
                <div className="space-y-3">
                    {lPend ? (
                        <p className="text-sm text-gray-400 text-center py-10">Cargando…</p>
                    ) : pending.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
                            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                            <p className="font-medium text-gray-500">Sin solicitudes pendientes</p>
                            <p className="text-sm text-gray-400 mt-1">Todos los profesionales han sido revisados.</p>
                        </div>
                    ) : pending.map(d => (
                        <PendingDoctorRow key={d.id} doctor={d}
                            onApprove={doc => setModal({ type: 'approve', doctor: doc })}
                            onReject={doc => setModal({ type: 'reject', doctor: doc })}
                        />
                    ))}
                </div>
            )}

            {/* ── Tab: Todos ── */}
            {tab === 'all' && (
                <div>
                    <div className="flex gap-2 mb-4 flex-wrap">
                        {['active', 'pending', 'rejected', 'deleted'].map(s => (
                            <button key={s} onClick={() => setFilter(s)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}>
                                {{ active: 'Activos', pending: 'Pendientes', rejected: 'Rechazados', deleted: 'Eliminados' }[s]}
                            </button>
                        ))}
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    {['Profesional', 'Especialidades', 'Precio', 'Estado', 'Valoración', 'Acciones'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {lAll
                                    ? <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Cargando…</td></tr>
                                    : doctors.length === 0
                                        ? <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No hay profesionales en este estado.</td></tr>
                                        : doctors.map(d => (
                                            <DoctorRow key={d.id} doctor={d}
                                                onDelete={doc => setModal({ type: 'delete', doctor: doc })}
                                            />
                                        ))
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Sección de admins (solo SuperAdmin) ── */}
            <AdminsSection isSuperAdmin={isSuperAdmin} />

            {/* ── Modales ── */}
            {modal?.type === 'approve' && (
                <ConfirmModal
                    title={`Aprobar a ${modal.doctor.fullName}`}
                    description="El profesional recibirá acceso completo y podrá recibir pacientes."
                    requireReason={false}
                    onConfirm={() => approveMut.mutate({ id: modal.doctor.id })}
                    onCancel={() => setModal(null)}
                />
            )}
            {modal?.type === 'reject' && (
                <ConfirmModal
                    title={`Rechazar a ${modal.doctor.fullName}`}
                    description="El profesional no podrá acceder a la plataforma. Recibirá un email con el motivo."
                    requireReason reasonLabel="Motivo del rechazo" danger
                    onConfirm={reason => rejectMut.mutate({ id: modal.doctor.id, reason })}
                    onCancel={() => setModal(null)}
                />
            )}
            {modal?.type === 'delete' && (
                <ConfirmModal
                    title={`Eliminar a ${modal.doctor.fullName}`}
                    description="El profesional perderá el acceso. Sus datos históricos (citas, pagos) se conservarán conforme al RGPD."
                    requireReason reasonLabel="Motivo de la eliminación" danger
                    onConfirm={reason => deleteMut.mutate({ id: modal.doctor.id, reason })}
                    onCancel={() => setModal(null)}
                />
            )}
        </div>
    );
};

export default AdminDashboard;