import { useState, useEffect } from 'react';
import { Review } from '@/types';

/**
 * Hook para obtener las reseñas de un servicio
 * Usa datos mock de /data/reviews.json
 */
export function useReviews(serviceId: string | undefined) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      if (!serviceId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Simular delay de red
        await new Promise((resolve) => setTimeout(resolve, 400));

        // Cargar datos mock
        const response = await fetch('/data/reviews.json');
        if (!response.ok) {
          throw new Error('Error al cargar las reseñas');
        }

        const allReviews: Review[] = await response.json();
        const serviceReviews = allReviews.filter((r) => r.serviceId === serviceId);
        
        setReviews(serviceReviews);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error desconocido'));
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReviews();
  }, [serviceId]);

  return { reviews, isLoading, error };
}
