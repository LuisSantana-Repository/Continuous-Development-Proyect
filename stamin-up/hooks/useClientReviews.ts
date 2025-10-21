import { useState, useEffect } from 'react';
import type { ClientReview } from '@/types';

export function useClientReviews() {
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      try {
        setIsLoading(true);
        // Simulamos un pequeño delay para mostrar el skeleton
        await new Promise((resolve) => setTimeout(resolve, 350));
        
        const response = await fetch('/data/client-reviews.json');
        if (!response.ok) {
          throw new Error('Error al cargar las reseñas');
        }
        const data = await response.json();
        setReviews(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReviews();
  }, []);

  return { reviews, isLoading, error };
}
