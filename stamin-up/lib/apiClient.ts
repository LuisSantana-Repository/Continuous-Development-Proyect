import { Service, Category, SearchFilters, ServiceRequest, ServiceRequestResponse } from '@/types';
import servicesData from '@/public/data/services.json';
import categoriesData from '@/public/data/categories.json';

// Modo de desarrollo: usar datos mock locales
const USE_MOCK_DATA = true;

/**
 * API Client centralizado para manejo de datos
 * Implementa el patrón Adapter para facilitar el cambio entre mock y backend real
 */

// Helper para simular delay de red
const simulateNetworkDelay = (ms: number = 300) => 
  new Promise(resolve => setTimeout(resolve, ms));

export const apiClient = {
  /**
   * Obtiene todos los servicios
   * @returns Promise con array de servicios
   */
  async getServices(): Promise<Service[]> {
    if (USE_MOCK_DATA) {
      await simulateNetworkDelay();
      return servicesData as Service[];
    }
    
    // Cuando tengas backend real:
    // const response = await fetch(endpoints.services.getAll);
    // if (!response.ok) throw new Error('Failed to fetch services');
    // return response.json();
    
    return [];
  },

  /**
   * Obtiene un servicio por ID
   * @param id - ID del servicio
   * @returns Promise con el servicio encontrado
   */
  async getServiceById(id: string): Promise<Service | null> {
    if (USE_MOCK_DATA) {
      await simulateNetworkDelay();
      const service = servicesData.find(s => s.id === id);
      return service as Service || null;
    }
    
    return null;
  },

  /**
   * Busca servicios con filtros
   * @param filters - Filtros de búsqueda
   * @returns Promise con servicios filtrados
   */
  async searchServices(filters: SearchFilters): Promise<Service[]> {
    if (USE_MOCK_DATA) {
      await simulateNetworkDelay();
      let results = servicesData as Service[];
      
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
    }
    
    return [];
  },

  /**
   * Obtiene servicios destacados
   * @returns Promise con servicios destacados
   */
  async getFeaturedServices(): Promise<Service[]> {
    if (USE_MOCK_DATA) {
      await simulateNetworkDelay(300);
      return (servicesData as Service[]).filter(s => s.featured);
    }
    
    return [];
  },

  /**
   * Obtiene todas las categorías
   * @returns Promise con array de categorías
   */
  async getCategories(): Promise<Category[]> {
    if (USE_MOCK_DATA) {
      await simulateNetworkDelay(200);
      return categoriesData as Category[];
    }
    
    return [];
  },

  /**
   * Obtiene una categoría por slug
   * @param slug - Slug de la categoría
   * @returns Promise con la categoría encontrada
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    if (USE_MOCK_DATA) {
      await simulateNetworkDelay(200);
      const category = categoriesData.find(c => c.slug === slug);
      return category as Category || null;
    }
    
    return null;
  },

  /**
   * Crea una nueva solicitud de servicio (Service Request / Booking)
   * @param payload - Datos de la solicitud sin requestId, createdAt, status
   * @returns Promise con la respuesta del servidor
   */
  async postServiceRequest(
    payload: Omit<ServiceRequest, 'requestId' | 'createdAt' | 'status'>
  ): Promise<ServiceRequestResponse> {
    if (USE_MOCK_DATA) {
      // Simular latencia de red de 400ms
      await simulateNetworkDelay(400);
      
      // Simular posible error (5% de probabilidad para testing)
      if (Math.random() < 0.05) {
        throw new Error('Error al procesar la solicitud. Por favor, intenta nuevamente.');
      }
      
      // Generar respuesta mock exitosa
      const requestId = `req_${Math.random().toString(36).substr(2, 9)}`;
      const createdAt = new Date().toISOString();
      
      const response: ServiceRequestResponse = {
        requestId,
        status: 'pending',
        createdAt,
        serviceRequest: {
          ...payload,
          requestId,
          status: 'pending',
          createdAt,
        },
      };
      
      return response;
    }
    
    // Backend real:
    // const response = await fetch('/api/service-requests', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload),
    // });
    // if (!response.ok) throw new Error('Failed to create service request');
    // return response.json();
    
    throw new Error('Backend not implemented');
  },
};

export default apiClient;
