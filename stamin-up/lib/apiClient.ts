import { Service, Category, SearchFilters, ServiceRequest, ServiceRequestResponse } from '@/types';

// URL base del API (desde variables de entorno)
// Using /api for relative URLs - load balancer will route to backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

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
  const response = await fetch(`${API_BASE_URL}/api/services/providers?page=${page}&pageSize=${pageSize}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      await handleApiError(response);
      const result = await response.json();
      
      // Obtener ratings de todos los proveedores en paralelo
      const servicesWithRatings = await Promise.all(result.data.map(async (item: any) => {
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
        
        // Obtener rating y reviewCount del proveedor
        let rating = 0;
        let reviewCount = 0;
        try {
          // Usar el método centralizado que ya hace la petición a /api/reviews/provider/:id/rating
          const ratingData = await (apiClient as any).getProviderRating(
            item.provider_id.toString()
          );
          rating = ratingData.averageRating || 0;
          reviewCount = ratingData.totalReviews || 0;
        } catch (error) {
          console.error(`Error fetching rating for provider ${item.provider_id}:`, error);
        }
        
        return {
          id: item.provider_id.toString(),
          title: item.workname,
          description: item.description,
          price: parseFloat(item.base_price),
          priceType: 'fixed' as const,
          imageUrl,
          rating,
          reviewCount,
          featured: false, // TODO: Implementar servicios destacados en el backend
          availability: [], // TODO: Parsear Time_Available
          createdAt: item.created_at,
          provider: {
            id: item.provider_id.toString(),
            name: item.username,
            email: item.email,
            phone: '', // TODO: Agregar teléfono al backend
            avatarUrl,
            bio: item.description,
            rating,
            completedJobs: 0, // TODO: Implementar en el backend
            verified: false, // TODO: Implementar verificación en el backend
            joinedDate: item.created_at,
          },
          category: {
            id: item.provider_id.toString(),
            name: item.service_type,
            slug: item.service_type.toLowerCase().replace(/\s+/g, '-'),
            description: item.service_type,
          },
        };
      }));
      
      return servicesWithRatings;
    } catch (error) {
      console.error('Error fetching provider services:', error);
      throw error;
    }
  },

  /**
   * Obtiene un servicio por ID directamente desde el backend
   * @param id - ID del servicio
   * @returns Promise con el servicio encontrado
   */
  async getServiceById(id: string): Promise<Service | null> {
    try {
  const response = await fetch(`${API_BASE_URL}/api/services/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Error fetching service: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        return null;
      }

      const item = result.data;

      // Construir URLs de imágenes (usar ruta /api/images en el backend)
      const imageUrl = item.IMAGE 
        ? `${API_BASE_URL}/api/images/${item.IMAGE}`
        : '/images/placeholder-service.jpg';
      
      const avatarUrl = item.user_photo 
        ? `${API_BASE_URL}/api/images/${item.user_photo}`
        : '/images/placeholder-avatar.jpg';

      // Obtener rating del proveedor
      let rating = 0;
      let reviewCount = 0;
      try {
        const ratingData = await this.getProviderRating(item.provider_id.toString());
        rating = ratingData.averageRating;
        reviewCount = ratingData.totalReviews;
      } catch (error) {
        console.error('Error fetching rating:', error);
      }

      // Parsear y formatear Time_Available
      let providerAvailability: any = {
        monday: null,
        tuesday: null,
        wednesday: null,
        thursday: null,
        friday: null,
        saturday: null,
        sunday: null,
      };

      if (item.Time_Available) {
        try {
          // Si es string, parsearlo
          const parsed = typeof item.Time_Available === 'string' 
            ? JSON.parse(item.Time_Available) 
            : item.Time_Available;
          
          providerAvailability = parsed;
        } catch (error) {
          console.error('Error parsing Time_Available:', error);
        }
      }

      const service: Service = {
        id: item.provider_id.toString(),
        title: item.workname,
        description: item.description,
        price: parseFloat(item.base_price),
        priceType: 'fixed',
        imageUrl,
        rating,
        reviewCount,
        featured: false,
        providerAvailability,
        createdAt: item.created_at,
        provider: {
          id: item.provider_id.toString(),
          name: item.username,
          email: item.email,
          phone: '',
          avatarUrl,
          bio: item.description,
          rating,
          completedJobs: 0,
          verified: false,
          joinedDate: item.created_at,
        },
        category: {
          id: item.service_type_id?.toString() || item.provider_id.toString(),
          name: item.service_type,
          slug: item.service_type.toLowerCase().replace(/\s+/g, '-'),
          description: item.service_type,
        },
      };

      return service;
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
          s.category.name.toLowerCase().includes(query)
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
      const services = await this.getServices(1, 4);
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
  const response = await fetch(`${API_BASE_URL}/api/services?pageSize=100`, {
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
   */
  async postServiceRequest(
    payload: Omit<ServiceRequest, 'requestId' | 'createdAt' | 'status'>
  ): Promise<ServiceRequestResponse> {
    try {
  const response = await fetch(`${API_BASE_URL}/api/service-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Importante para enviar el token en cookies
        body: JSON.stringify({
          providerId: parseInt(payload.serviceId), // El backend espera providerId como número
          description: payload.description,
          preferredDate: payload.preferredDate, // Formato ISO string
          address: payload.address,
          contactPhone: payload.contactPhone,
          amount: payload.amount, // Opcional
        }),
      });

      await handleApiError(response);
      const result = await response.json();

      return {
        requestId: result.requestId,
        chatId: result.chatId, // ✅ Incluir chatId de la respuesta del backend
        message: result.message || 'Solicitud creada exitosamente',
      };
    } catch (err) {
      // Re-lanzar con mensaje más descriptivo
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new Error('Error de conexión. Verifica que el servidor esté disponible.');
      }
      throw err;
    }
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
    address: string;      // Dirección en texto (obligatoria)
    work?: {               // Solo si provider = true
      workname: string;
      description: string;
      base_price: number;
      Service_Type: string;
      Job_Permit: {
        data: string;      // Base64 del permiso de trabajo
        contentType: string;
      };
      address: string;    // Dirección del negocio
      Time_Available: {    // Objeto con disponibilidad por día
        monday: { start: string; end: string } | null;
        tuesday: { start: string; end: string } | null;
        wednesday: { start: string; end: string } | null;
        thursday: { start: string; end: string } | null;
        friday: { start: string; end: string } | null;
        saturday: { start: string; end: string } | null;
        sunday: { start: string; end: string } | null;
      };
      Images: string[];    // Array de imágenes en base64
    };
  }): Promise<{ message: string; userId?: string }> {
    try {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
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
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
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
      address?: string;
      created_at?: string;
      work?: any;
    }
  }> {
  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
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
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include', // Importante para enviar y limpiar cookies
    });

    await handleApiError(response);
    return response.json();
  },

  /**
   * Actualiza el perfil del usuario autenticado
   * @param updates - Campos a actualizar
   * @returns Promise con los datos actualizados del usuario
   */
  async updateProfile(updates: {
    username?: string;
    email?: string;
    address?: string;
    Foto?: string;
  }): Promise<{
    user: {
      user_id: string;
      email: string;
      username: string;
      provider: boolean;
      Foto?: string;
      address?: string;
      created_at?: string;
      work?: any;
    }
  }> {
  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    await handleApiError(response);
    return response.json();
  },

  /**
   * REVIEWS
   */

  /**
   * Obtiene las reviews de un proveedor
   * @param providerId - ID del proveedor
   * @param page - Número de página
   * @param pageSize - Cantidad por página
   * @returns Promise con las reviews
   */
  async getProviderReviews(
    providerId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<{
    reviews: any[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    try {
      const response = await fetch(
  `${API_BASE_URL}/api/reviews/provider/${providerId}?page=${page}&pageSize=${pageSize}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      await handleApiError(response);
      const result = await response.json();

      return {
        reviews: result.data || [],
        pagination: result.pagination || {
          page: 1,
          pageSize: pageSize,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    } catch (error) {
      console.error('Error fetching provider reviews:', error);
      // Retornar estructura vacía en caso de error
      return {
        reviews: [],
        pagination: {
          page: 1,
          pageSize: pageSize,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
  },

  /**
   * Obtiene las reviews escritas por un usuario
   * @param userId - ID del usuario
   * @param page - Número de página
   * @param pageSize - Cantidad por página
   * @returns Promise con las reviews del usuario
   */
  async getUserReviews(
    userId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<{
    reviews: any[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    try {
      const response = await fetch(
  `${API_BASE_URL}/api/reviews/user/${userId}?page=${page}&pageSize=${pageSize}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Enviar token en cookies
        }
      );

      await handleApiError(response);
      const result = await response.json();

      return {
        reviews: result.data || [],
        pagination: result.pagination || {
          page: 1,
          pageSize: pageSize,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      // Retornar estructura vacía en caso de error
      return {
        reviews: [],
        pagination: {
          page: 1,
          pageSize: pageSize,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
  },

  /**
   * Obtiene el rating promedio de un proveedor
   * @param providerId - ID del proveedor
   * @returns Promise con el rating promedio y total de reviews
   */
  async getProviderRating(providerId: string): Promise<{
    providerId: number;
    averageRating: number;
    totalReviews: number;
  }> {
    try {
      const response = await fetch(
  `${API_BASE_URL}/api/reviews/provider/${providerId}/rating`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      await handleApiError(response);
      const result = await response.json();

      return result.data || { providerId: parseInt(providerId), averageRating: 0, totalReviews: 0 };
    } catch (error) {
      console.error('Error fetching provider rating:', error);
      return { providerId: parseInt(providerId), averageRating: 0, totalReviews: 0 };
    }
  },

  /**
   * SERVICE REQUESTS (ORDERS)
   */

  /**
   * Obtiene las solicitudes de servicio de un usuario (historial de órdenes)
   * @param userId - ID del usuario
   * @param page - Número de página
   * @param pageSize - Cantidad por página
   * @param status - Filtro opcional de estado
   * @returns Promise con las solicitudes del usuario
   */
  async getUserServiceRequests(
    userId: string,
    page: number = 1,
    pageSize: number = 50,
    status?: string
  ): Promise<{
    data: any[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    try {
  let url = `${API_BASE_URL}/api/service-requests/user/${userId}?page=${page}&pageSize=${pageSize}`;
      if (status) {
        url += `&status=${status}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Enviar token en cookies
      });

      await handleApiError(response);
      const result = await response.json();

      return {
        data: result.data || [],
        pagination: result.pagination || {
          page: 1,
          pageSize: pageSize,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    } catch (error) {
      console.error('Error fetching user service requests:', error);
      // Retornar estructura vacía en caso de error
      return {
        data: [],
        pagination: {
          page: 1,
          pageSize: pageSize,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
  },

  /**
   * PROVIDER ENDPOINTS
   */

  /**
   * Obtiene las solicitudes de servicio para un proveedor
   */
  async getProviderServiceRequests(
    providerId: number,
    page: number = 1,
    pageSize: number = 50,
    status?: string
  ): Promise<{
    data: any[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    try {
  let url = `${API_BASE_URL}/api/service-requests/provider/${providerId}?page=${page}&pageSize=${pageSize}`;
      if (status) {
        url += `&status=${status}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      await handleApiError(response);
      const result = await response.json();

      return {
        data: result.data || [],
        pagination: result.pagination || {
          page: 1,
          pageSize: pageSize,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    } catch (error) {
      console.error('Error fetching provider service requests:', error);
      return {
        data: [],
        pagination: {
          page: 1,
          pageSize: pageSize,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
  },

  /**
   * Actualiza el estado de una solicitud de servicio (aceptar/rechazar/etc)
   */
  async updateServiceRequestStatus(
    requestId: string,
    updates: {
      status?: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
      payment_status?: 'pending' | 'paid';
      amount?: number;
      completed_at?: string;
    }
  ): Promise<any> {
    try {
  const response = await fetch(`${API_BASE_URL}/api/service-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      await handleApiError(response);
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating service request:', error);
      throw error;
    }
  },

  /**
   * Obtiene una solicitud de servicio específica por ID
   */
  async getServiceRequestById(requestId: string): Promise<any> {
    try {
  const response = await fetch(`${API_BASE_URL}/api/service-requests/${requestId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      await handleApiError(response);
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching service request:', error);
      throw error;
    }
  },

  /**
   * Crea una nueva reseña para un servicio completado
   */
  async createReview(reviewData: {
    providerId: number;
    serviceRequestId: string;
    rating: number;
    comment?: string;
  }): Promise<any> {
    try {
  const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          providerId: reviewData.providerId,
          serviceRequestId: reviewData.serviceRequestId,
          rating: reviewData.rating,
          comment: reviewData.comment,
        }),
      });

      await handleApiError(response);
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  },

  /**
   * Obtiene el calendario de un proveedor con sus service requests
   * @param providerId - ID del proveedor
   * @param month - Mes en formato YYYY-MM
   */
  async getProviderCalendar(providerId: number, month: string): Promise<any> {
    try {
      const response = await fetch(
  `${API_BASE_URL}/api/providers/${providerId}/calendar?month=${month}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      await handleApiError(response);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching provider calendar:', error);
      throw error;
    }
  },

  /**
   * Actualiza el perfil del proveedor
   * @param providerId - ID del proveedor
   * @param updates - Campos a actualizar (workname, email, Foto)
   * @returns Promise con los datos actualizados del proveedor
   */
  async updateProviderProfile(
    providerId: number,
    updates: {
      workname?: string;
      email?: string;
      Foto?: string;
    }
  ): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/providers/${providerId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    await handleApiError(response);
    return response.json();
  },

  /**
   * PAYMENT
   */

  /**
   * Procesa el pago de una orden (simulado)
   * Actualiza payment_status a 'paid' y status a 'in_progress'
   * @param orderId - ID de la orden/service request
   */
  async processOrderPayment(orderId: string): Promise<any> {
    try {
  const response = await fetch(`${API_BASE_URL}/api/service-requests/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          payment_status: 'paid',
        }),
      });

      await handleApiError(response);
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  },
};

export default apiClient;
