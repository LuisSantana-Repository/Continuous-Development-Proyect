import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import type { ClientUser } from '@/types';

/**
 * Hook para obtener los datos del usuario cliente autenticado desde el backend
 */
export function useClientUser() {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Obtener perfil desde el backend
        const response = await apiClient.getProfile();
        
        if (!response || !response.user) {
          throw new Error('No se pudo obtener el perfil del usuario');
        }

        const backendUser = response.user;
        
        // Helper para validar si es una URL válida
        const isValidUrl = (str: string | null | undefined): boolean => {
          if (!str) return false;
          try {
            new URL(str);
            return true;
          } catch {
            return false;
          }
        };

        // Usar solo URLs válidas para profileImage
        const profileImage = isValidUrl(backendUser.Foto) ? backendUser.Foto : undefined;

        // Usar la dirección provista por el backend (campo `address`).
        // Si no existe o está vacía, mostrar un fallback amigable.
        const address =
          backendUser.address && typeof backendUser.address === 'string' && backendUser.address.trim().length > 0
            ? backendUser.address.trim()
            : 'Dirección no disponible';

        // Usar created_at del backend o fecha actual como fallback
        const memberSince = backendUser.created_at || new Date().toISOString();

        // Transformar al formato ClientUser
        const clientUser: ClientUser = {
          id: backendUser.user_id,
          name: backendUser.username,
          email: backendUser.email,
          address,
          memberSince,
          profileImage,
        };

        setUser(clientUser);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Error al cargar datos del usuario';
        setError(errorMessage);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, []);

  return { user, isLoading, error };
}
