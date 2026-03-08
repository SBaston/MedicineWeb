// ═══════════════════════════════════════════════════════════════
// Frontend/src/pages/AdminSpecialtiesPage.jsx - ACTUALIZADO
// Campo "Nombre" deshabilitado al editar (solo descripción editable)
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Edit2, Archive, RotateCcw, Power, PowerOff, Stethoscope,
    AlertCircle, CheckCircle, Loader, X, ArrowLeft, Trash2
} from 'lucide-react';
import specialtyService from '../services/specialtyService';

const AdminSpecialtiesPage = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [errors, setErrors] = useState({});
    const [showDeleted, setShowDeleted] = useState(false); // Toggle ver eliminadas

    // ═══════════════════════════════════════════════════════════
    // Query: Especialidades (con o sin eliminadas)
    // ═══════════════════════════════════════════════════════════
    const { data: specialties = [], isLoading } = useQuery({
        queryKey: ['admin-specialties', showDeleted],
        queryFn: () => showDeleted
            ? specialtyService.getAllIncludingDeleted()
            : specialtyService.getAll()
    });

    const createMut = useMutation({
        mutationFn: (data) => specialtyService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-specialties']);
            queryClient.invalidateQueries(['specialties']);
            setShowModal(false);
            setFormData({ name: '', description: '' });
            setErrors({});
        },
        onError: (error) => {
            setErrors({ submit: error.response?.data?.message || 'Error al crear' });
        }
    });

    const updateMut = useMutation({
        mutationFn: ({ id, data }) => specialtyService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-specialties']);
            queryClient.invalidateQueries(['specialties']);
            setShowModal(false);
            setEditing(null);
            setFormData({ name: '', description: '' });
            setErrors({});
        },
        onError: (error) => {
            setErrors({ submit: error.response?.data?.message || 'Error al actualizar' });
        }
    });

    // ═══════════════════════════════════════════════════════════
    // Mutation: Soft Delete (Archivar)
    // ═══════════════════════════════════════════════════════════
    const softDeleteMut = useMutation({
        mutationFn: (id) => specialtyService.softDelete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-specialties']);
            queryClient.invalidateQueries(['specialties']);
        },
        onError: (error) => {
            alert(error.response?.data?.message || 'Error al archivar');
        }
    });

    // ═══════════════════════════════════════════════════════════
    // Mutation: Restaurar
    // ═══════════════════════════════════════════════════════════
    const restoreMut = useMutation({
        mutationFn: (id) => specialtyService.restore(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-specialties']);
            queryClient.invalidateQueries(['specialties']);
        },
        onError: (error) => {
            alert(error.response?.data?.message || 'Error al restaurar');
        }
    });

    //const deleteMut = useMutation({
    //    mutationFn: (id) => specialtyService.delete(id),
    //    onSuccess: () => {
    //        queryClient.invalidateQueries(['admin-specialties']);
    //        queryClient.invalidateQueries(['specialties']);
    //    },
    //    onError: (error) => {
    //        alert(error.response?.data?.message || 'Error al eliminar');
    //    }
    //});

    const toggleMut = useMutation({
        mutationFn: (id) => specialtyService.toggleActive(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-specialties']);
            queryClient.invalidateQueries(['specialties']);
        }
    });

    // Handlers
    const handleSubmit = (e) => {
        e.preventDefault();

        const newErrors = {};

        if (!editing && !formData.name.trim()) {
            newErrors.name = 'El nombre es obligatorio';
        }
        if (!editing && formData.name.length < 3) {
            newErrors.name = 'Mínimo 3 caracteres';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (editing) {
            // Al editar, solo enviar descripción
            updateMut.mutate({
                id: editing.id,
                data: { description: formData.description }
            });
        } else {
            // Al crear, enviar nombre y descripción
            createMut.mutate(formData);
        }
    };

    const handleEdit = (spec) => {
        setEditing(spec);
        setFormData({ name: spec.name, description: spec.description || '' });
        setShowModal(true);
    };

    const handleSoftDelete = (id, name) => {
        if (confirm(`¿Archivar "${name}"?\n\nLa especialidad se ocultará pero se mantendrá en el historial.`)) {
            softDeleteMut.mutate(id);
        }
    };

    const handleRestore = (id, name) => {
        if (confirm(`¿Restaurar "${name}"?\n\nVolverá a estar disponible.`)) {
            restoreMut.mutate(id);
        }
    };

    //const handleDelete = (id, name) => {
    //    if (confirm(`¿Eliminar "${name}"?\n\nEsta acción no se puede deshacer.`)) {
    //        deleteMut.mutate(id);
    //    }
    //};

    const handleCloseModal = () => {
        setShowModal(false);
        setEditing(null);
        setFormData({ name: '', description: '' });
        setErrors({});
    };

    return (
        <div className="container-custom py-8">
            {/* Cabecera */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Stethoscope className="w-8 h-8 text-primary-600" />
                            Especialidades Médicas
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Gestiona las especialidades disponibles en la plataforma
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Especialidad
                </button>
            </div>

            {/* Toggle: Ver eliminadas */}
            <div className="flex items-center gap-2 mb-4">
                <button
                    onClick={() => setShowDeleted(!showDeleted)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${showDeleted
                            ? 'bg-gray-200 text-gray-700'
                            : 'bg-primary-100 text-primary-700'
                        }`}
                >
                    {showDeleted ? 'Ocultar archivadas' : 'Ver archivadas'}
                </button>
                {showDeleted && (
                    <span className="text-sm text-gray-500">
                        Mostrando todas ({specialties.length})
                    </span>
                )}
            </div>

            {/* Estadísticas */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-primary-500">
                    <p className="text-gray-600 text-sm">Total</p>
                    <p className="text-2xl font-bold">{specialties.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
                    <p className="text-gray-600 text-sm">Activas</p>
                    <p className="text-2xl font-bold">{specialties.filter(s => s.isActive).length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-gray-500">
                    <p className="text-gray-600 text-sm">Inactivas</p>
                    <p className="text-2xl font-bold">{specialties.filter(s => !s.isActive).length}</p>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center">
                        <Loader className="w-8 h-8 animate-spin mx-auto text-primary-600" />
                    </div>
                ) : specialties.length === 0 ? (
                    <div className="p-12 text-center">
                        <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-600 font-medium">No hay especialidades registradas</p>
                        <p className="text-gray-500 text-sm mt-1">Crea la primera especialidad médica</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Especialidad</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Doctores</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {specialties.map((spec) => (
                                <tr key={spec.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-gray-900">{spec.name}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            {spec.description || <span className="italic text-gray-400">Sin descripción</span>}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex w-8 h-8 items-center justify-center bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                                            {spec.doctorCount || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {spec.deletedAt ? (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                                <Archive className="w-3 h-3" />
                                                Archivada
                                            </span>
                                        ) : spec.isActive ? (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                <CheckCircle className="w-3 h-3" />
                                                Activa
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                                <AlertCircle className="w-3 h-3" />
                                                Inactiva
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            {spec.deletedAt ? (
                                                // Especialidad ELIMINADA: Solo restaurar
                                                <button
                                                    onClick={() => handleRestore(spec.id, spec.name)}
                                                    className="p-2 hover:bg-green-50 text-green-600 rounded-lg"
                                                    title="Restaurar"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                // Especialidad ACTIVA: Acciones completas
                                                <>
                                                    <button
                                                        onClick={() => toggleMut.mutate(spec.id)}
                                                        className={`p-2 rounded-lg ${spec.isActive
                                                                ? 'hover:bg-red-50 text-red-600'
                                                                : 'hover:bg-green-50 text-green-600'
                                                            }`}
                                                        title={spec.isActive ? 'Desactivar' : 'Activar'}
                                                    >
                                                        {spec.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(spec)}
                                                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"
                                                        title="Editar descripción"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleSoftDelete(spec.id, spec.name)}
                                                        className="p-2 hover:bg-orange-50 text-orange-600 rounded-lg"
                                                        title="Archivar (soft delete)"
                                                    >
                                                        <Archive className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal crear/editar */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl w-full max-w-md">
                        {/* Header */}
                        <div className="p-6 border-b flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editing ? 'Editar Especialidad' : 'Nueva Especialidad'}
                            </h3>
                            <button onClick={handleCloseModal}>
                                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Nombre */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre de la especialidad *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData({ ...formData, name: e.target.value });
                                        setErrors({ ...errors, name: '' });
                                    }}
                                    disabled={editing} // ← DESHABILITADO al editar
                                    className={`input-field ${editing ? 'bg-gray-100 cursor-not-allowed' : ''} ${errors.name ? 'border-red-300' : ''}`}
                                    placeholder="Ej: Cardiología"
                                    maxLength={100}
                                />
                                {editing && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        ℹ️ El nombre no se puede editar para mantener la integridad de los datos
                                    </p>
                                )}
                                {errors.name && (
                                    <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                                )}
                            </div>

                            {/* Descripción */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Descripción {!editing && '(opcional)'}
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="input-field resize-none"
                                    placeholder="Breve descripción de la especialidad..."
                                    maxLength={500}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {formData.description.length}/500 caracteres
                                </p>
                            </div>

                            {/* Error general */}
                            {errors.submit && (
                                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                                    {errors.submit}
                                </div>
                            )}

                            {/* Botones */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 btn-secondary"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMut.isPending || updateMut.isPending}
                                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                                >
                                    {(createMut.isPending || updateMut.isPending) ? (
                                        <>
                                            <Loader className="w-4 h-4 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            {editing ? 'Actualizar' : 'Crear'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSpecialtiesPage;