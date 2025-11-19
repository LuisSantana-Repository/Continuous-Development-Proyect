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
        const mappedReviews: Review[] = (result.reviews || []).map((item: any) => {
          // Construir URL de imagen si existe
          let userAvatar = undefined;
          if (item.user_photo) {
            const src = item.user_photo;
            const apiBaseRaw = process.env.NEXT_PUBLIC_API_URL || '';
            const apiBase = apiBaseRaw.replace(/\/api\/?$/, '').replace(/\/$/, '');
            
            // Si la ruta empieza con /api/, agregarle el base
            // Si es una ruta S3 (profile/... o profile_images/...), convertirla a /api/images/...
            if (src.startsWith('/api/')) {
              userAvatar = apiBase ? `${apiBase}${src}` : src;
            } else if (src.startsWith('profile/') || src.startsWith('profile_images/') || src.startsWith('service_images/')) {
              userAvatar = apiBase ? `${apiBase}/api/images/${src}` : `/api/images/${src}`;
            } else if (src.startsWith('http://') || src.startsWith('https://')) {
              userAvatar = src; // URL completa
            } else {
              // Cualquier otra ruta S3, asumir que va en /api/images/
              userAvatar = apiBase ? `${apiBase}/api/images/${src}` : `/api/images/${src}`;
            }
          }

          return {
            id: item.review_id,
            serviceId: item.provider_id.toString(),
            userId: item.user_id,
            userName: item.username || 'Usuario',
            userAvatar,
            rating: item.rating,
            comment: item.comment || '',
            createdAt: item.created_at,
            verified: false,
          };
        });
        
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
