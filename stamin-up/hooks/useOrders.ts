import { useState, useEffect } from 'react';
import type { Order } from '@/types';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setIsLoading(true);
        // Simulamos un pequeño delay para mostrar el skeleton
        await new Promise((resolve) => setTimeout(resolve, 400));
        
        const response = await fetch('/data/orders.json');
        if (!response.ok) {
          throw new Error('Error al cargar el historial de servicios');
        }
        const data = await response.json();
        setOrders(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, []);

  return { orders, isLoading, error };
}
