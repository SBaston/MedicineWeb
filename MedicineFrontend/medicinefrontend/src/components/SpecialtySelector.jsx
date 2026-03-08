// ═══════════════════════════════════════════════════════════════
// Frontend/src/components/SpecialtySelector.jsx
// Selector multi-select de especialidades con buscador
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, X, Stethoscope, Loader } from 'lucide-react';
import specialtyService from '../services/specialtyService';

const SpecialtySelector = ({ selectedSpecialties = [], onChange, error }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // ═══════════════════════════════════════════════════════════
    // Query para obtener especialidades activas
    // IMPORTANTE: queryFn es obligatorio
    // ═══════════════════════════════════════════════════════════
    const { data: specialties = [], isLoading } = useQuery({
        queryKey: ['specialties'],
        queryFn: specialtyService.getActive, // ← queryFn obligatorio
        staleTime: 5 * 60 * 1000, // Cache 5 minutos
    });

    // Filtrar por búsqueda
    const filteredSpecialties = specialties.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedSpecialties.some(selected => selected.id === s.id)
    );

    const handleSelect = (specialty) => {
        onChange([...selectedSpecialties, specialty]);
        setSearchTerm('');
    };

    const handleRemove = (specialtyId) => {
        onChange(selectedSpecialties.filter(s => s.id !== specialtyId));
    };

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.specialty-selector')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="specialty-selector">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                <Stethoscope className="w-4 h-4 inline mr-1" />
                Especialidades *
            </label>

            {/* Especialidades seleccionadas */}
            {selectedSpecialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {selectedSpecialties.map(specialty => (
                        <div
                            key={specialty.id}
                            className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium"
                        >
                            <span>{specialty.name}</span>
                            <button
                                type="button"
                                onClick={() => handleRemove(specialty.id)}
                                className="hover:bg-primary-200 rounded-full p-0.5 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Selector */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full text-left px-4 py-2 border rounded-lg flex items-center justify-between ${error ? 'border-red-300' : 'border-gray-300'
                        } ${isOpen ? 'ring-2 ring-primary-500 border-primary-500' : ''}`}
                >
                    <span className="text-gray-500">
                        {selectedSpecialties.length === 0
                            ? 'Selecciona una o más especialidades'
                            : `${selectedSpecialties.length} seleccionada${selectedSpecialties.length > 1 ? 's' : ''}`
                        }
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
                        {/* Buscador */}
                        <div className="p-2 border-b sticky top-0 bg-white">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar especialidad..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>

                        {/* Lista */}
                        <div className="overflow-y-auto max-h-48">
                            {isLoading ? (
                                <div className="p-4 text-center text-gray-500">
                                    <Loader className="w-5 h-5 animate-spin mx-auto mb-1" />
                                    <p className="text-sm">Cargando...</p>
                                </div>
                            ) : filteredSpecialties.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    {searchTerm ? 'No se encontraron especialidades' : 'No hay más especialidades disponibles'}
                                </div>
                            ) : (
                                filteredSpecialties.map(specialty => (
                                    <button
                                        key={specialty.id}
                                        type="button"
                                        onClick={() => handleSelect(specialty)}
                                        className="w-full text-left px-4 py-2 hover:bg-primary-50 transition-colors flex items-start gap-2"
                                    >
                                        <Stethoscope className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{specialty.name}</p>
                                            {specialty.description && (
                                                <p className="text-xs text-gray-500 line-clamp-1">{specialty.description}</p>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <p className="text-red-600 text-sm mt-1">{error}</p>
            )}

            {selectedSpecialties.length === 0 && !error && (
                <p className="text-gray-500 text-xs mt-1">
                    Selecciona al menos una especialidad médica
                </p>
            )}
        </div>
    );
};

export default SpecialtySelector;