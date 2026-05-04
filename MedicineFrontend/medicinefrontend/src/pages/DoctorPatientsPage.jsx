// ═══════════════════════════════════════════════════════════════
// DoctorPatientsPage.jsx
// Lista de pacientes del doctor con acceso directo al historial
// Route: /doctor/patients
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Users, Search, FileText, ArrowLeft,
    Calendar, ChevronRight, UserCircle
} from 'lucide-react';
import clinicalNoteService from '../services/clinicalNoteService';

const DoctorPatientsPage = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

    const { data: patients = [], isLoading } = useQuery({
        queryKey: ['doctor-patients', search],
        queryFn: () => clinicalNoteService.getMyPatients(search),
        staleTime: 30_000,
    });

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('es-ES', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/doctor/dashboard')}
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Dashboard</span>
                        </button>
                        <span className="text-slate-300">/</span>
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-emerald-600" />
                            <h1 className="text-lg font-bold text-slate-900">Mis Pacientes</h1>
                        </div>
                    </div>
                    <span className="text-sm text-slate-500">
                        {patients.length} paciente{patients.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Buscador */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o email…"
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                    />
                </div>

                {/* Lista */}
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : patients.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 text-center">
                        <UserCircle className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                        <p className="font-semibold text-slate-500">
                            {search ? 'No se encontraron pacientes con esa búsqueda.' : 'Aún no tienes pacientes con citas registradas.'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <ul className="divide-y divide-slate-50">
                            {patients.map((patient) => (
                                <li key={patient.patientId}>
                                    <button
                                        onClick={() => navigate(`/doctor/patients/${patient.patientId}/clinical-history`)}
                                        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-emerald-50 transition-colors text-left group"
                                    >
                                        {/* Avatar */}
                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                                            {patient.fullName
                                                .split(' ')
                                                .map(w => w[0])
                                                .slice(0, 2)
                                                .join('')
                                                .toUpperCase() || '?'}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-900 truncate">
                                                {patient.displayName}
                                            </p>
                                            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    Última cita: {formatDate(patient.lastAppointment)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <FileText className="w-3.5 h-3.5" />
                                                    {patient.totalAppointments} cita{patient.totalAppointments !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Acción */}
                                        <div className="flex items-center gap-2 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                            <span className="text-xs font-medium">Ver historial</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorPatientsPage;
