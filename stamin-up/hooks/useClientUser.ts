import { useState, useEffect } from 'react';
import type { ClientUser } from '@/types';

export function useClientUser() {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        setIsLoading(true);
        // Simulamos un pequeño delay para mostrar el skeleton
        await new Promise((resolve) => setTimeout(resolve, 300));
        
        const response = await fetch('/data/user.json');
        if (!response.ok) {
          throw new Error('Error al cargar datos del usuario');
        }
        const data = await response.json();
        setUser(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, []);

  return { user, isLoading, error };
}
