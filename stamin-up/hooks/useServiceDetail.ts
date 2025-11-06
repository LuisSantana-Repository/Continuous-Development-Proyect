import { useState, useEffect } from 'react';
import { Service } from '@/types';
import { apiClient } from '@/lib/apiClient';

/**
 * Hook para obtener el detalle de un servicio por ID desde el backend
 * Incluye rating y conteo de reviews del proveedor
 */
export function useServiceDetail(serviceId: string | undefined) {
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchService() {
      if (!serviceId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Obtener el servicio desde el backend
        const foundService = await apiClient.getServiceById(serviceId);
        
        if (foundService) {
          // Obtener el rating y conteo de reviews del proveedor
          try {
            const ratingData = await apiClient.getProviderRating(serviceId);
            foundService.rating = ratingData.averageRating;
            foundService.reviewCount = ratingData.totalReviews;
          } catch (ratingError) {
            console.error('Error fetching rating:', ratingError);
            // Mantener valores por defecto si falla
          }
        }
        
        setService(foundService || null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error desconocido'));
        setService(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchService();
  }, [serviceId]);

  return { service, isLoading, error };
}
