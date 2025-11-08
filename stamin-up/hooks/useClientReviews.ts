import { useState, useEffect, useCallback } from 'react';
import { ClientReview } from '@/types';
import { apiClient } from '@/lib/apiClient';

export function useClientReviews() {
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Obtener el userId del perfil autenticado
      const profile = await apiClient.getProfile();
      if (!profile?.user?.user_id) {
        throw new Error('No se pudo obtener el ID del usuario');
      }

      // Obtener las reviews del backend
      const { reviews: backendReviews } = await apiClient.getUserReviews(
        profile.user.user_id,
        1,
        50
      );

      // Transformar las reviews al formato del frontend
      const transformedReviews: ClientReview[] = backendReviews.map((review: any) => {
        // Obtener el nombre del servicio y proveedor desde el JOIN
        const serviceName = review.service_type || 'Servicio';
        const providerName = review.provider_workname || review.provider_username || 'Proveedor';

        return {
          id: review.review_id.toString(),
          orderId: review.service_request_id?.toString() || '',
          serviceName,
          providerName,
          rating: review.rating,
          comment: review.comment || '',
          date: review.created_at, // Pasar la fecha ISO directamente
          tags: [], // Opcional, backend no devuelve tags actualmente
        };
      });

      setReviews(transformedReviews);
    } catch (err) {
      console.error('Error loading user reviews:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  return {
    reviews,
    isLoading,
    error,
    refetch: loadReviews,
  };
}
