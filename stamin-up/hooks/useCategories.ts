'use client';

import { useState, useEffect } from 'react';
import { Category } from '@/types';
import apiClient from '@/lib/apiClient';

/**
 * Hook para manejar categorías
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getCategories();
        setCategories(data);
        setError(null);
      } catch (err) {
        setError('Error al cargar las categorías');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}
