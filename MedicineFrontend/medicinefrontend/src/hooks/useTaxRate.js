// ═══════════════════════════════════════════════════════════════
// hooks/useTaxRate.js
// Hook para obtener el tipo de IVA actual desde la API
// ═══════════════════════════════════════════════════════════════

import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const fetchTaxRate = async () => {
    const { data } = await api.get('/settings/tax-rate');
    return data.ivaRate; // decimal, ej: 0.21
};

/**
 * Devuelve el tipo de IVA actual como decimal (ej: 0.21).
 * Se cachea 10 minutos — rara vez cambia.
 * Fallback a 0.21 si la petición falla.
 */
export const useTaxRate = () => {
    const { data: ivaRate = 0.21 } = useQuery({
        queryKey: ['platform-tax-rate'],
        queryFn: fetchTaxRate,
        staleTime: 10 * 60 * 1000, // 10 min
        gcTime:    15 * 60 * 1000,
        retry: 1,
        throwOnError: false,
    });
    return ivaRate;
};
