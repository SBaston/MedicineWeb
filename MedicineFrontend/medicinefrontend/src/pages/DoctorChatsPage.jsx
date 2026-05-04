// ═══════════════════════════════════════════════════════════════
// DoctorChatsPage.jsx
// Listado de chats premium activos del doctor
// Route: /doctor/chats
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft, MessageCircle, Search, Crown,
    ArrowRight, UserCircle, Clock
} from 'lucide-react';
import chatService from '../services/chatService';

const DoctorChatsPage = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

    const { data: chatSubs = [], isLoading } = useQuery({
        queryKey: ['doctor-chat-subscriptions'],
        queryFn: chatService.getDoctorSubscriptions,
        refetchInterval: 30_000,
    });

    const filtered = chatSubs.filter(sub =>
        !search || (sub.patientName ?? '').toLowerCase().includes(search.toLowerCase())
    );

    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        return new Date(dateStr).toLocaleDateString('es-ES', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
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
                            <MessageCircle className="w-5 h-5 text-violet-600" />
                            <h1 className="text-lg font-bold text-slate-900">Mis chats</h1>
                        </div>
                    </div>
                    {chatSubs.length > 0 && (
                        <span className="px-2.5 py-1 bg-violet-100 text-violet-700 text-sm font-bold rounded-full">
                            {chatSubs.length} activo{chatSubs.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Buscador */}
                {chatSubs.length > 0 && (
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar paciente por nombre…"
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
                        />
                    </div>
                )}

                {/* Contenido */}
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : chatSubs.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 text-center">
                        <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
                            <MessageCircle className="w-8 h-8 text-violet-400" />
                        </div>
                        <h3 className="font-semibold text-slate-700 mb-2">No tienes chats activos</h3>
                        <p className="text-sm text-slate-400">
                            Los pacientes que contraten tu servicio de chat aparecerán aquí.
                        </p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-12 text-center">
                        <UserCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">No hay chats que coincidan con "{search}"</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <ul className="divide-y divide-slate-50">
                            {filtered.map(sub => (
                                <li key={sub.id}>
                                    <Link
                                        to={`/chat/${sub.id}`}
                                        className="flex items-center gap-4 px-6 py-4 hover:bg-violet-50 transition-colors group"
                                    >
                                        {/* Avatar */}
                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                                            {(sub.patientName ?? '?')
                                                .split(' ')
                                                .map(w => w[0])
                                                .slice(0, 2)
                                                .join('')
                                                .toUpperCase()}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-900 truncate">
                                                {sub.patientName}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Crown className="w-3 h-3 text-violet-500" />
                                                <span className="text-xs text-violet-600">{sub.name}</span>
                                                {sub.expiresAt && (
                                                    <>
                                                        <span className="text-slate-300">·</span>
                                                        <Clock className="w-3 h-3 text-slate-400" />
                                                        <span className="text-xs text-slate-400">
                                                            Vence {formatDate(sub.expiresAt)}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Acción */}
                                        <div className="flex items-center gap-2 text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                            <span className="text-xs font-medium">Abrir chat</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Pie de página */}
                {chatSubs.length > 0 && (
                    <p className="text-xs text-slate-400 text-center mt-4 flex items-center justify-center gap-1">
                        <Crown className="w-3 h-3" />
                        Los mensajes se almacenan de forma segura conforme a la LOPD
                    </p>
                )}
            </div>
        </div>
    );
};

export default DoctorChatsPage;
