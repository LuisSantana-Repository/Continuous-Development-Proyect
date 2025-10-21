import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import type { ServiceRequest, ServiceRequestResponse } from '@/types';

interface UseCreateServiceRequestReturn {
  createRequest: (payload: Omit<ServiceRequest, 'requestId' | 'createdAt' | 'status'>) => Promise<ServiceRequestResponse>;
  isSubmitting: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook personalizado para manejar la creación de solicitudes de servicio
 * Maneja el estado de carga, errores y la llamada a la API
 */
export function useCreateServiceRequest(): UseCreateServiceRequestReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRequest = useCallback(async (
    payload: Omit<ServiceRequest, 'requestId' | 'createdAt' | 'status'>
  ): Promise<ServiceRequestResponse> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.postServiceRequest(payload);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error inesperado al crear la solicitud. Por favor, intenta nuevamente.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    createRequest,
    isSubmitting,
    error,
    clearError,
  };
}
