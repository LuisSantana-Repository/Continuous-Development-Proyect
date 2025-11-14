import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import type { Order } from '@/types';

/**
 * Hook para obtener el historial de solicitudes de servicio del usuario autenticado
 * @param autoRefresh - Intervalo en ms para recargar automáticamente (opcional)
 */
export function useOrders(autoRefresh?: number) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Primero obtener el perfil del usuario para saber su ID
      const profileResponse = await apiClient.getProfile();
      
      if (!profileResponse || !profileResponse.user) {
        setOrders([]);
        return;
      }

      const userId = profileResponse.user.user_id;

      // Obtener las solicitudes de servicio del usuario
      const response = await apiClient.getUserServiceRequests(userId);
      
      // Transformar los datos del backend al formato Order
      const transformedOrders: Order[] = response.data.map((request: any) => {
        // Mapear el status del backend al formato esperado
        let status: Order['status'] = 'Pendiente';
        
        switch (request.status) {
          case 'completed':
            status = 'Completado';
            break;
          case 'in_progress':
            status = 'En curso';
            break;
          case 'accepted':
            status = 'Aceptado'; // ✅ Mostrar como "Aceptado" cuando el proveedor acepta
            break;
          case 'pending':
            status = 'Pendiente';
            break;
          case 'rejected':
            status = 'Rechazado';
            break;
        }

        // Usar los datos del JOIN con providers y users
        const serviceName = request.service_type 
          ? request.service_type 
          : 'Servicio solicitado';
        
        const providerName = request.provider_workname 
          ? request.provider_workname 
          : (request.provider_username || 'Proveedor');

        // Mapear rating si existe
        const rating = request.review_id && request.review_rating 
          ? {
              value: request.review_rating,
              createdAt: request.created_at, // Podríamos agregar ur.created_at al query si queremos la fecha exacta de la review
            }
          : undefined;

        return {
          id: request.request_id,
          serviceName,
          providerName,
          date: request.created_at,
          status,
          price: parseFloat(request.amount || '0'),
          rating, // ✅ Agregar rating del backend
          chatId: request.chat_id, // ✅ Agregar chatId del backend
          // Información adicional del service request
          description: request.description,
          preferredDate: request.preferred_date,
          address: request.address,
          contactPhone: request.contact_phone,
          providerId: request.provider_id,
          userId: request.user_id,
          paymentStatus: request.payment_status,
          completedAt: request.completed_at,
        };
      });

      setOrders(transformedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error al cargar el historial de servicios';
      setError(errorMessage);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    // Si se especifica autoRefresh, configurar polling
    if (autoRefresh && autoRefresh > 0) {
      const interval = setInterval(() => {
        fetchOrders();
      }, autoRefresh);

      return () => clearInterval(interval);
    }
  }, [fetchOrders, autoRefresh]);

  return { 
    orders, 
    isLoading, 
    error,
    refetch: fetchOrders, // Exponer función para refrescar manualmente
  };
}
