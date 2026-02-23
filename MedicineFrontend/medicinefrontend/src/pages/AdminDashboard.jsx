import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
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
// PROFESIONALES PENDIENTES
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
                </div>
            )}
        </div>
    );
};

// ════════════════════════════════════════════════════════════════
// TABLA DE PROFESIONALES
// ════════════════════════════════════════════════════════════════

const STATUS_BADGE = {
    Active: 'bg-green-100 text-green-700',
    PendingReview: 'bg-yellow-100 text-yellow-700',
    Rejected: 'bg-red-100 text-red-700',
    Deleted: 'bg-gray-100 text-gray-400',
};
const STATUS_LABEL = {
    Active: 'Activo', PendingReview: 'Pendiente',
    Rejected: 'Rechazado', Deleted: 'Eliminado'
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
// SECCIÓN DE ADMINS (solo para SuperAdmin)
// ════════════════════════════════════════════════════════════════

const AdminsSection = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [confirmReactivate, setConfirmReactivate] = useState(null);
    // DEBUG: Log para verificar el valor de isSuperAdmin
    useEffect(() => {
        console.log('🔍 AdminsSection - user:', user);
        console.log('🔍 AdminsSection - user.isSuperAdmin:', user?.isSuperAdmin);
        console.log('🔍 AdminsSection - typeof isSuperAdmin:', typeof user?.isSuperAdmin);
    }, [user]);

    const isSuperAdmin = user?.role === 'Admin' && user?.isSuperAdmin === true;

    console.log('🔍 AdminsSection - isSuperAdmin calculado:', isSuperAdmin);

    const { data: admins = [], isLoading } = useQuery({
        queryKey: ['admins-list'],
        queryFn: adminService.getAdmins,
        enabled: isSuperAdmin,
    });

    const deactivateMut = useMutation({
        mutationFn: (id) => adminService.deactivateAdmin(id),
        onSuccess: () => {
            qc.invalidateQueries(['admins-list']);
            qc.invalidateQueries(['admin-stats']);
            setConfirmDelete(null);
        },
    });

    const reactivateMut = useMutation({
        mutationFn: (id) => adminService.reactivateAdmin(id),  // ← Necesitas crear este endpoint
        onSuccess: () => {
            qc.invalidateQueries(['admins-list']);
            qc.invalidateQueries(['admin-stats']);
            setConfirmReactivate(null);
        },
    });

    // Si no es SuperAdmin, no renderizar nada
    if (!isSuperAdmin) {
        console.log('❌ AdminsSection - NO se renderiza (no es SuperAdmin)');
        return null;
    }

    console.log('✅ AdminsSection - SÍ se renderiza (es SuperAdmin)');

    return (
        <div className="mt-10 pt-8 border-t-2 border-gray-200">
            {/* Cabecera */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                        <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Gestión de Administradores</h2>
                        <p className="text-sm text-gray-500">
                            {admins.length} administrador{admins.length !== 1 ? 'es' : ''} en el sistema
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/admin/create')}
                    className="flex items-center gap-2 btn-primary px-5 py-2.5"
                >
                    <UserPlus className="w-4 h-4" />
                    Nuevo administrador
                </button>
            </div>

            {/* Tabla de admins */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            {['Nombre', 'Email', 'Departamento', 'Tipo', 'Estado', 'Fecha de alta', 'Acciones'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            <tr><td colSpan={7} className="text-center py-10 text-gray-400">Cargando…</td></tr>
                        ) : admins.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-10 text-gray-400">No hay administradores registrados</td></tr>
                        ) : admins.map(admin => (
                            <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-gray-900">{admin.fullName}</td>
                                <td className="px-4 py-3 text-gray-600">{admin.email}</td>
                                <td className="px-4 py-3 text-gray-500 text-xs">{admin.department || '—'}</td>
                                <td className="px-4 py-3">
                                    {admin.isSuperAdmin ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                                            <Crown className="w-3 h-3" /> SuperAdmin
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                            <ShieldCheck className="w-3 h-3" /> Admin
                                        </span>
                                    )}
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
                                    {!admin.isSuperAdmin && (
                                        <>
                                            {admin.isActive ? (
                                                // Botón DESACTIVAR (admin activo)
                                                <button
                                                    onClick={() => setConfirmDelete(admin)}
                                                    className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Desactivar
                                                </button>
                                            ) : (
                                                // Botón REACTIVAR (admin inactivo)
                                                <button
                                                    onClick={() => setConfirmReactivate(admin)}
                                                    className="flex items-center gap-1 px-3 py-1.5 border border-green-200 text-green-600 hover:bg-green-50 rounded-lg text-xs font-medium transition-colors"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" /> Reactivar
                                                </button>
                                            )}
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de confirmación */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="font-bold text-gray-900">Desactivar administrador</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">
                            ¿Desactivar a <strong>{confirmDelete.fullName}</strong>?<br />
                            Perderá el acceso al panel de administración.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setConfirmDelete(null)} className="btn-secondary text-sm px-4 py-2">
                                Cancelar
                            </button>
                            <button
                                onClick={() => deactivateMut.mutate(confirmDelete.id)}
                                disabled={deactivateMut.isPending}
                                className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                            >
                                {deactivateMut.isPending ? 'Desactivando…' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ═══════════════════════════════════════════════════════ */}
            {/* Modal de REACTIVAR (NUEVO) */}
            {/* ═══════════════════════════════════════════════════════ */}
            {confirmReactivate && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <h3 className="font-bold text-gray-900">Reactivar administrador</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">
                            ¿Reactivar a <strong>{confirmReactivate.fullName}</strong>?<br />
                            Recuperará el acceso al panel de administración.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setConfirmReactivate(null)} className="btn-secondary text-sm px-4 py-2">
                                Cancelar
                            </button>
                            <button
                                onClick={() => reactivateMut.mutate(confirmReactivate.id)}
                                disabled={reactivateMut.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                            >
                                {reactivateMut.isPending ? 'Reactivando…' : 'Confirmar'}
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
    const [modal, setModal] = useState(null);

    // DEBUG: Log del usuario al cargar el dashboard
    useEffect(() => {
        console.log('🔍 AdminDashboard - user completo:', user);
        console.log('🔍 AdminDashboard - user.role:', user?.role);
        console.log('🔍 AdminDashboard - user.isSuperAdmin:', user?.isSuperAdmin);
    }, [user]);

    const invalidate = () => {
        qc.invalidateQueries(['admin-pending']);
        qc.invalidateQueries(['admin-doctors']);
        qc.invalidateQueries(['admin-stats']);
    };

    const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: adminService.getStats });
    const { data: pending = [], isLoading: lPend } = useQuery({
        queryKey: ['admin-pending'],
        queryFn: adminService.getPending,
        enabled: tab === 'pending'
    });
    const { data: doctors = [], isLoading: lAll } = useQuery({
        queryKey: ['admin-doctors', filter],
        queryFn: () => adminService.getAllDoctors(filter),
        enabled: tab === 'all'
    });

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

            {/* Cabecera */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
                    <p className="text-sm text-gray-500">
                        {user?.isSuperAdmin ? 'SuperAdmin · Acceso completo' : 'Administrador'}
                    </p>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard icon={Clock} label="Pendientes de revisión" value={stats?.pendingReview} color="bg-yellow-500" />
                <StatCard icon={CheckCircle} label="Profesionales activos" value={stats?.activeProfessionals} color="bg-green-500" />
                <StatCard icon={Users} label="Pacientes registrados" value={stats?.totalPatients} color="bg-blue-500" />
                <StatCard icon={Stethoscope} label="Citas totales" value={stats?.totalAppointments} color="bg-purple-500" />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
                {[
                    { key: 'pending', label: 'Pendientes', icon: Clock },
                    { key: 'all', label: 'Todos los profesionales', icon: Users },
                ].map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setTab(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
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

            {/* Tab: Pendientes */}
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

            {/* Tab: Todos */}
            {tab === 'all' && (
                <div>
                    <div className="flex gap-2 mb-4 flex-wrap">
                        {['active', 'pending', 'rejected', 'deleted'].map(s => (
                            <button key={s} onClick={() => setFilter(s)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
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
                                {lAll ? (
                                    <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Cargando…</td></tr>
                                ) : doctors.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No hay profesionales en este estado.</td></tr>
                                ) : doctors.map(d => (
                                    <DoctorRow key={d.id} doctor={d}
                                        onDelete={doc => setModal({ type: 'delete', doctor: doc })}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Sección de Admins - Solo SuperAdmin */}
            <AdminsSection />

            {/* Modales */}
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
                    description="El profesional perderá el acceso. Sus datos históricos se conservarán conforme al RGPD."
                    requireReason reasonLabel="Motivo de la eliminación" danger
                    onConfirm={reason => deleteMut.mutate({ id: modal.doctor.id, reason })}
                    onCancel={() => setModal(null)}
                />
            )}
        </div>
    );
};

export default AdminDashboard;