'use client';

import { useState, useEffect } from 'react';
import { Service } from '@/types';
import apiClient from '@/lib/apiClient';

/**
 * Hook para manejar servicios
 * Encapsula la lógica de fetching y estado
 */
export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getServices();
        setServices(data);
        setError(null);
      } catch (err) {
        setError('Error al cargar los servicios');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return { services, loading, error };
}

/**
 * Hook para obtener servicios destacados
 */
export function useFeaturedServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedServices = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getFeaturedServices();
        setServices(data);
        setError(null);
      } catch (err) {
        setError('Error al cargar los servicios destacados');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedServices();
  }, []);

  return { services, loading, error };
}
