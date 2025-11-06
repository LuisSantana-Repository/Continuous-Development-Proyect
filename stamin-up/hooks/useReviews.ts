import { useState, useEffect } from 'react';
import { Review } from '@/types';
import { apiClient } from '@/lib/apiClient';

/**
 * Hook para obtener las reseñas de un proveedor desde el backend
 * El serviceId en este contexto es el providerId
 */
export function useReviews(providerId: string | undefined) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      if (!providerId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const result = await apiClient.getProviderReviews(providerId, 1, 50);
        
        // Mapear los datos del backend al formato del frontend
        const mappedReviews: Review[] = (result.reviews || []).map((item: any) => ({
          id: item.review_id,
          serviceId: item.provider_id.toString(),
          userId: item.user_id,
          userName: item.username || 'Usuario', // Usar username del backend
          userAvatar: item.user_photo || undefined, // Usar foto del backend o undefined
          rating: item.rating,
          comment: item.comment || '',
          createdAt: item.created_at,
          verified: false, // El backend no tiene este campo
        }));
        
        setReviews(mappedReviews);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError(err instanceof Error ? err : new Error('Error desconocido'));
        // En caso de error, dejar array vacío en lugar de fallar
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReviews();
  }, [providerId]);

  return { reviews, isLoading, error };
}
