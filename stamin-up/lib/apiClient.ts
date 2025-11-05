import { Service, Category, SearchFilters, ServiceRequest, ServiceRequestResponse } from '@/types';

// URL base del API (desde variables de entorno)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * API Client centralizado para manejo de datos
 * Implementa comunicación con el backend real
 */

// Helper para manejar errores de API
const handleApiError = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      
      // Priorizar el mensaje de error específico del backend
      if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (parseError) {
      // Si no se puede parsear el JSON, usar el mensaje por defecto
      console.error("Error parsing error response:", parseError);
    }
    
    throw new Error(errorMessage);
  }
  return response;
};

export const apiClient = {
  /**
   * Obtiene todos los servicios de proveedores desde la base de datos
   * @param page - Número de página (default: 1)
   * @param pageSize - Cantidad de items por página (default: 10)
   * @returns Promise con array de servicios
   */
  async getServices(page: number = 1, pageSize: number = 10): Promise<Service[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/services/providers?page=${page}&pageSize=${pageSize}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      await handleApiError(response);
      const result = await response.json();
      
      // Mapear los datos del backend al formato esperado por el frontend
      const services: Service[] = result.data.map((item: any) => {
        // Construir URL de imagen: si viene de S3, construir URL que use el proxy del API
        let imageUrl = '/images/placeholder-service.jpg';
        if (item.IMAGE) {
          // Si la imagen viene como base64, usarla directamente
          if (item.IMAGE.startsWith('data:image/')) {
            imageUrl = item.IMAGE;
          } else {
            // Si es una key de S3, usar ruta relativa que será proxeada por Next.js
            // El proxy de Next.js la enviará al API correcto según el contexto (cliente o servidor)
            imageUrl = `/api/images/${item.IMAGE}`;
          }
        }
        
        // Construir URL del avatar del proveedor
        let avatarUrl = undefined;
        if (item.user_photo) {
          if (item.user_photo.startsWith('data:image/')) {
            avatarUrl = item.user_photo;
          } else {
            // Usar ruta relativa proxeada
            avatarUrl = `/api/images/${item.user_photo}`;
          }
        }
        
        return {
          id: item.provider_id.toString(),
          title: item.workname,
          description: item.description,
          price: parseFloat(item.base_price),
          priceType: 'fixed' as const,
          imageUrl,
          rating: 0, // TODO: Implementar sistema de calificaciones
          reviewCount: 0, // TODO: Implementar conteo de reseñas
          featured: false, // TODO: Implementar servicios destacados
          tags: [item.service_type],
          availability: [], // TODO: Parsear Time_Available
          createdAt: item.created_at,
          provider: {
            id: item.provider_id.toString(),
            name: item.username,
            email: item.email,
            phone: '', // TODO: Agregar teléfono
            avatarUrl,
            bio: item.description,
            rating: 0,
            completedJobs: 0,
            verified: false,
            joinedDate: item.created_at,
          },
          category: {
            id: item.provider_id.toString(),
            name: item.service_type,
            slug: item.service_type.toLowerCase().replace(/\s+/g, '-'),
            description: item.service_type,
          },
        };
      });
      
      return services;
    } catch (error) {
      console.error('Error fetching provider services:', error);
      throw error;
    }
  },

  /**
   * Obtiene un servicio por ID
   * @param id - ID del servicio
   * @returns Promise con el servicio encontrado
   */
  async getServiceById(id: string): Promise<Service | null> {
    try {
      const services = await this.getServices(1, 100);
      const service = services.find(s => s.id === id);
      return service || null;
    } catch (error) {
      console.error('Error fetching service by id:', error);
      return null;
    }
  },

  /**
   * Busca servicios con filtros
   * @param filters - Filtros de búsqueda
   * @returns Promise con servicios filtrados
   */
  async searchServices(filters: SearchFilters): Promise<Service[]> {
    try {
      // Obtener todos los servicios (en el futuro, esto debería ser un endpoint de búsqueda)
      let results = await this.getServices(1, 100);
      
      // Aplicar filtros en el frontend
      if (filters.query) {
        const query = filters.query.toLowerCase();
        results = results.filter(s => 
          s.title.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      if (filters.category) {
        results = results.filter(s => 
          s.category.slug === filters.category || s.category.id === filters.category
        );
      }
      
      if (filters.minRating) {
        results = results.filter(s => s.rating >= filters.minRating!);
      }
      
      if (filters.minPrice !== undefined) {
        results = results.filter(s => s.price >= filters.minPrice!);
      }
      
      if (filters.maxPrice !== undefined) {
        results = results.filter(s => s.price <= filters.maxPrice!);
      }
      
      return results;
    } catch (error) {
      console.error('Error searching services:', error);
      return [];
    }
  },

  /**
   * Obtiene servicios destacados
   * @returns Promise con servicios destacados
   */
  async getFeaturedServices(): Promise<Service[]> {
    try {
      // Por ahora retorna los primeros 6 servicios
      // En el futuro, esto debería basarse en un campo 'featured' en la BD
      const services = await this.getServices(1, 6);
      return services;
    } catch (error) {
      console.error('Error fetching featured services:', error);
      return [];
    }
  },

  /**
   * Obtiene todas las categorías desde la base de datos
   * @returns Promise con array de categorías
   */
  async getCategories(): Promise<Category[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/services?pageSize=100`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      await handleApiError(response);
      const result = await response.json();
      
      // Mapear los datos del backend al formato esperado por el frontend
      const categories = result.data.map((item: any) => ({
        id: item.id.toString(),
        name: item.type_name,
        slug: item.type_name.toLowerCase().replace(/\s+/g, '-'),
        description: item.type_name,
      }));
      
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  /**
   * Obtiene una categoría por slug
   * @param slug - Slug de la categoría
   * @returns Promise con la categoría encontrada
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const categories = await this.getCategories();
      const category = categories.find(c => c.slug === slug);
      return category || null;
    } catch (error) {
      console.error('Error fetching category by slug:', error);
      return null;
    }
  },

  /**
   * Crea una nueva solicitud de servicio (Service Request / Booking)
   * @param payload - Datos de la solicitud sin requestId, createdAt, status
   * @returns Promise con la respuesta del servidor
   * @deprecated Por ahora lanza error hasta que se implemente el endpoint
   */
  async postServiceRequest(
    payload: Omit<ServiceRequest, 'requestId' | 'createdAt' | 'status'>
  ): Promise<ServiceRequestResponse> {
    // TODO: Implementar cuando exista endpoint en el backend
    throw new Error('Endpoint de solicitudes de servicio no implementado aún');
  },

  /**
   * AUTENTICACIÓN
   */

  /**
   * Registra un nuevo usuario
   * @param data - Datos del registro (todos los campos son requeridos excepto Foto)
   * @returns Promise con el resultado del registro
   */
  async register(data: {
    email: string;
    password: string;
    username: string;
    provider: boolean;
    INE: string;           // Base64 de la imagen de la INE
    Foto?: string;         // Base64 de la foto de perfil (opcional)
    Latitude: number;      // Coordenadas requeridas
    Longitude: number;     // Coordenadas requeridas
    work?: {               // Solo si provider = true
      workname: string;
      description: string;
      base_price: number;
      Service_Type: string;
      Job_Permit: {
        data: string;      // Base64 del permiso de trabajo
        contentType: string;
      };
      Latitude: number;
      Longitude: number;
      Time_Available: string;
      Images: string[];    // Array de imágenes en base64
    };
  }): Promise<{ message: string; userId?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Importante para cookies
        body: JSON.stringify(data),
      });

      await handleApiError(response);
      return response.json();
    } catch (err) {
      // Re-lanzar con mensaje más descriptivo si es error de red
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new Error('Error de conexión. Verifica que el servidor esté disponible.');
      }
      throw err;
    }
  },

  /**
   * Inicia sesión
   * @param email - Email del usuario
   * @param password - Contraseña
   * @returns Promise con el resultado del login
   */
  async login(email: string, password: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Importante para recibir cookies
      body: JSON.stringify({ email, password }),
    });

    await handleApiError(response);
    return response.json();
  },

  /**
   * Obtiene el perfil del usuario autenticado
   * @returns Promise con los datos del usuario
   */
  async getProfile(): Promise<{
    user: {
      user_id: string;
      email: string;
      username: string;
      provider: boolean;
      Foto?: string;
      Latitude?: number;
      Longitude?: number;
      work?: any;
    }
  }> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'GET',
      credentials: 'include', // Envía las cookies con el token
    });

    await handleApiError(response);
    return response.json();
  },

  /**
   * Cierra sesión del usuario
   * @returns Promise con el resultado del logout
   */
  async logout(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include', // Importante para enviar y limpiar cookies
    });

    await handleApiError(response);
    return response.json();
  },
};

export default apiClient;
