import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import type { PaymentFormData } from '@/lib/paymentValidation';

interface UsePaymentReturn {
  processPayment: (orderId: string, paymentData: PaymentFormData) => Promise<void>;
  isProcessing: boolean;
  error: string | null;
}

/**
 * Hook para manejar el proceso de pago simulado
 */
export function usePayment(): UsePaymentReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = async (orderId: string, paymentData: PaymentFormData) => {
    try {
      setIsProcessing(true);
      setError(null);

      // Simular un delay de procesamiento (como si fuera un pago real)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Actualizar el estado de pago en el backend
      await apiClient.processOrderPayment(orderId);

      // El backend automáticamente cambiará:
      // - payment_status: 'pending' -> 'paid'
      // - status: 'accepted' -> 'in_progress'

    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error al procesar el pago';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processPayment,
    isProcessing,
    error,
  };
}
