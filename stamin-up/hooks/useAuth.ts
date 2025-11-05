import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';

interface User {
  user_id: string;
  email: string;
  username: string;
  provider: boolean;
  Foto?: string;
  Latitude?: number;
  Longitude?: number;
  work?: any;
}

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

/**
 * Hook personalizado para manejar autenticación
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, login, logout } = useAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <LoginButton onClick={() => login(email, pass)} />;
 *   }
 *   
 *   return <div>Welcome {user?.username}!</div>;
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar usuario al montar el componente
  useEffect(() => {
    refreshUser();
  }, []);

  /**
   * Refresca los datos del usuario desde el servidor
   */
  const refreshUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getProfile();
      setUser(response.user);
    } catch (err) {
      // Si falla, probablemente no está autenticado
      setUser(null);
      console.log('No authenticated user');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Inicia sesión con email y contraseña
   */
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await apiClient.login(email, password);
      
      // Después del login, obtener el perfil del usuario
      await refreshUser();
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error al iniciar sesión';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cierra la sesión del usuario
   */
  const logout = async () => {
    try {
      setLoading(true);
      await apiClient.logout();
      setUser(null);
      
      // Opcional: Recargar la página para limpiar todo el estado
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
      // Limpiar estado local aunque falle
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!user,
  };
}
