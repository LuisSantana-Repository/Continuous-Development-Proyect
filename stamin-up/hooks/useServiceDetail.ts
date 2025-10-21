import { useState, useEffect } from 'react';
import { Service } from '@/types';

/**
 * Hook para obtener el detalle de un servicio por ID
 * Usa datos mock de /data/services.json
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

        // Simular delay de red
        await new Promise((resolve) => setTimeout(resolve, 600));

        // Cargar datos mock
        const response = await fetch('/data/services.json');
        if (!response.ok) {
          throw new Error('Error al cargar los servicios');
        }

        const services: Service[] = await response.json();
        const foundService = services.find((s) => s.id === serviceId);
        
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
