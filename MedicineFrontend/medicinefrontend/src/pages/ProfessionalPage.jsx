import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import professionalsService from '../services/professionalsService';
import {
    Search, Star, Clock, Stethoscope,
    SlidersHorizontal, X, ChevronDown
} from 'lucide-react';

// ─── Opciones estáticas de filtros ───────────────────────────────────────────
const SORT_OPTIONS = [
    { value: 'rating', label: 'Mejor valorados' },
    { value: 'price_asc', label: 'Precio: menor a mayor' },
    { value: 'price_desc', label: 'Precio: mayor a menor' },
    { value: 'experience', label: 'Más experiencia' },
];

const RATING_OPTIONS = [
    { value: '', label: 'Cualquier valoración' },
    { value: '4', label: '4★ o más' },
    { value: '3', label: '3★ o más' },
];

const MAX_PRICE_OPTIONS = [
    { value: '', label: 'Cualquier precio' },
    { value: '30', label: 'Hasta 30 €' },
    { value: '60', label: 'Hasta 60 €' },
    { value: '100', label: 'Hasta 100 €' },
];

// ─── Tarjeta de profesional ───────────────────────────────────────────────────
const ProfessionalCard = ({ professional }) => {
    const fullName = `${professional.firstName} ${professional.lastName}`;
    const avatarUrl = professional.profilePictureUrl
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=3b82f6&color=fff&size=200&bold=true`;

    return (
        <Link
            to={`/professionals/${professional.id}`}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex gap-5 hover:shadow-md hover:border-primary-200 transition-all group"
        >
            {/* Avatar */}
            <img
                src={avatarUrl}
                alt={fullName}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-100 flex-shrink-0 group-hover:border-primary-300 transition-colors"
                onError={(e) => {
                    const initials = `${professional.firstName?.charAt(0)}${professional.lastName?.charAt(0)}`;
                    e.target.src = `https://ui-avatars.com/api/?name=${initials}&background=3b82f6&color=fff&size=200&bold=true`;
                }}
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        {/* Nombre */}
                        <h3 className="font-semibold text-gray-900 text-lg group-hover:text-primary-600 transition-colors truncate">
                            {fullName}
                        </h3>

                        {/* Especialidades como chips */}
                        <div className="flex flex-wrap gap-1 mt-1">
                            {professional.specialties?.slice(0, 3).map((s) => (
                                <span
                                    key={s.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full"
                                >
                                    <Stethoscope className="w-3 h-3" />
                                    {s.name}
                                </span>
                            ))}
                            {professional.specialties?.length > 3 && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                                    +{professional.specialties.length - 3} más
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Precio */}
                    <div className="text-right flex-shrink-0">
                        <p className="font-bold text-primary-600 text-xl">
                            {professional.pricePerSession}€
                        </p>
                        <p className="text-xs text-gray-400">por sesión</p>
                    </div>
                </div>

                {/* Descripción breve */}
                {professional.description && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                        {professional.description}
                    </p>
                )}

                {/* Metadatos */}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                    <span className="flex items-center gap-1 text-gray-600">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-semibold text-gray-800">
                            {professional.averageRating?.toFixed(1) ?? '—'}
                        </span>
                        <span className="text-gray-400">
                            ({professional.totalReviews ?? 0})
                        </span>
                    </span>
                    {professional.yearsOfExperience > 0 && (
                        <span className="flex items-center gap-1 text-gray-500">
                            <Clock className="w-4 h-4" />
                            {professional.yearsOfExperience} años exp.
                        </span>
                    )}
                    {professional.isAcceptingPatients && (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                            Acepta pacientes
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
};

// ─── Skeleton de carga ────────────────────────────────────────────────────────
const SkeletonCard = () => (
    <div className="bg-white rounded-xl border border-gray-100 p-6 flex gap-5 animate-pulse">
        <div className="w-20 h-20 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-3 pt-1">
            <div className="h-5 bg-gray-200 rounded w-48" />
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
    </div>
);

// ─── Select reutilizable con chevron ─────────────────────────────────────────
const FilterSelect = ({ label, value, onChange, options }) => (
    <div className="relative">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="appearance-none w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 pr-9 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
);

// ─── Página principal ─────────────────────────────────────────────────────────
const ProfessionalsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [showFilters, setShowFilters] = useState(false);

    // Estado de filtros sincronizado con la URL
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        specialty: searchParams.get('specialty') || '',
        minRating: searchParams.get('minRating') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        sortBy: searchParams.get('sortBy') || 'rating',
    });

    // Texto del buscador (lo que escribe el usuario en tiempo real)
    const [searchInput, setSearchInput] = useState(filters.search);

    // Actualizar un filtro y sincronizar URL
    const updateFilter = useCallback((key, value) => {
        const next = { ...filters, [key]: value };
        setFilters(next);

        // Reflejar en la URL para que sea compartible
        const params = {};
        Object.entries(next).forEach(([k, v]) => { if (v) params[k] = v; });
        setSearchParams(params, { replace: true });
    }, [filters, setSearchParams]);

    // Limpiar todos los filtros
    const clearFilters = () => {
        const reset = { search: '', specialty: '', minRating: '', maxPrice: '', sortBy: 'rating' };
        setFilters(reset);
        setSearchInput('');
        setSearchParams({}, { replace: true });
    };

    // Hay algún filtro activo (aparte del orden por defecto)
    const hasActiveFilters = filters.search || filters.specialty || filters.minRating || filters.maxPrice;

    // Query de especialidades (para el select de filtro)
    const { data: specialties = [] } = useQuery({
        queryKey: ['specialties'],
        queryFn: professionalsService.getSpecialties,
        staleTime: 10 * 60 * 1000, // 10 min – raramente cambian
    });

    // Query de profesionales (se re-ejecuta al cambiar filtros)
    const { data: professionals = [], isLoading, isError } = useQuery({
        queryKey: ['professionals', filters],
        queryFn: () => professionalsService.search(filters),
        keepPreviousData: true,
    });

    // Opciones de especialidades para el select
    const specialtyOptions = [
        { value: '', label: 'Todas las especialidades' },
        ...specialties.map((s) => ({ value: s.name, label: s.name })),
    ];

    return (
        <div className="container-custom py-8">

            {/* ── Cabecera ── */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Profesionales</h1>
                <p className="text-gray-500">
                    Encuentra al profesional de salud que mejor se adapte a tus necesidades.
                </p>
            </div>

            {/* ── Barra de búsqueda principal ── */}
            <div className="flex gap-3 mb-4">
                {/* Input de texto */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, especialidad o descripción…"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') updateFilter('search', searchInput.trim());
                        }}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
                    />
                    {searchInput && (
                        <button
                            onClick={() => { setSearchInput(''); updateFilter('search', ''); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Botón Buscar */}
                <button
                    onClick={() => updateFilter('search', searchInput.trim())}
                    className="btn-primary px-6 rounded-xl"
                >
                    Buscar
                </button>

                {/* Toggle de filtros avanzados */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-3 border rounded-xl text-sm font-medium transition-colors ${showFilters || hasActiveFilters
                            ? 'border-primary-500 text-primary-600 bg-primary-50'
                            : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                        }`}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filtros
                    {hasActiveFilters && (
                        <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center">
                            {[filters.specialty, filters.minRating, filters.maxPrice].filter(Boolean).length}
                        </span>
                    )}
                </button>
            </div>

            {/* ── Panel de filtros avanzados ── */}
            {showFilters && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                        {/* Filtro: Especialidad */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Especialidad
                            </label>
                            <FilterSelect
                                value={filters.specialty}
                                onChange={(v) => updateFilter('specialty', v)}
                                options={specialtyOptions}
                            />
                        </div>

                        {/* Filtro: Valoración mínima */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Valoración mínima
                            </label>
                            <FilterSelect
                                value={filters.minRating}
                                onChange={(v) => updateFilter('minRating', v)}
                                options={RATING_OPTIONS}
                            />
                        </div>

                        {/* Filtro: Precio máximo */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Precio máximo
                            </label>
                            <FilterSelect
                                value={filters.maxPrice}
                                onChange={(v) => updateFilter('maxPrice', v)}
                                options={MAX_PRICE_OPTIONS}
                            />
                        </div>

                        {/* Filtro: Ordenar por */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Ordenar por
                            </label>
                            <FilterSelect
                                value={filters.sortBy}
                                onChange={(v) => updateFilter('sortBy', v)}
                                options={SORT_OPTIONS}
                            />
                        </div>
                    </div>

                    {/* Botón limpiar filtros */}
                    {hasActiveFilters && (
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                            >
                                <X className="w-4 h-4" />
                                Limpiar filtros
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Filtros activos como chips (resumen rápido) ── */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mb-5">
                    {filters.search && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full border border-primary-200">
                            "{filters.search}"
                            <button onClick={() => { setSearchInput(''); updateFilter('search', ''); }}>
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}
                    {filters.specialty && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full border border-primary-200">
                            <Stethoscope className="w-3.5 h-3.5" />
                            {filters.specialty}
                            <button onClick={() => updateFilter('specialty', '')}>
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}
                    {filters.minRating && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full border border-primary-200">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            {filters.minRating}★ o más
                            <button onClick={() => updateFilter('minRating', '')}>
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}
                    {filters.maxPrice && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full border border-primary-200">
                            Hasta {filters.maxPrice}€
                            <button onClick={() => updateFilter('maxPrice', '')}>
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}
                </div>
            )}

            {/* ── Resultado y listado ── */}
            {isError ? (
                <div className="text-center py-16">
                    <p className="text-red-500 font-medium">Error al cargar los profesionales.</p>
                    <p className="text-gray-400 text-sm mt-1">Inténtalo de nuevo más tarde.</p>
                </div>
            ) : (
                <>
                    {/* Contador de resultados */}
                    {!isLoading && (
                        <p className="text-sm text-gray-500 mb-4">
                            {professionals.length === 0
                                ? 'No se encontraron profesionales con esos criterios.'
                                : `${professionals.length} profesional${professionals.length !== 1 ? 'es' : ''} encontrado${professionals.length !== 1 ? 's' : ''}`
                            }
                        </p>
                    )}

                    {/* Lista */}
                    <div className="space-y-4">
                        {isLoading
                            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                            : professionals.length === 0
                                ? (
                                    <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                                        <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <p className="font-medium text-gray-500">No hay profesionales que coincidan</p>
                                        <p className="text-sm text-gray-400 mt-1 mb-4">
                                            Prueba con otros filtros o amplía tu búsqueda.
                                        </p>
                                        <button
                                            onClick={clearFilters}
                                            className="btn-outline text-sm"
                                        >
                                            Ver todos los profesionales
                                        </button>
                                    </div>
                                )
                                : professionals.map((p) => (
                                    <ProfessionalCard key={p.id} professional={p} />
                                ))
                        }
                    </div>
                </>
            )}
        </div>
    );
};

export default ProfessionalsPage;