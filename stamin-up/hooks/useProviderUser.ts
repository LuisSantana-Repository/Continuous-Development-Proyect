"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";
import type { ProviderUser } from "@/types";

export function useProviderUser() {
  const [provider, setProvider] = useState<ProviderUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProvider = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener el perfil del usuario autenticado
      const profile = await apiClient.getProfile();
      if (!profile?.user?.user_id) {
        throw new Error("No se pudo obtener el ID del usuario");
      }

      // Obtener información del proveedor
      const providersResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/providers/user/${profile.user.user_id}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );

      if (!providersResponse.ok) {
        throw new Error("No se pudo obtener la información del proveedor");
      }

      const providerData = await providersResponse.json();
      if (!providerData.providers || providerData.providers.length === 0) {
        throw new Error("Este usuario no es un proveedor");
      }

      const providerInfo = providerData.providers[0];

      // Obtener estadísticas del proveedor (reviews y trabajos completados)
      let averageRating = 0;
      let totalReviews = 0;
      
      try {
        // Usar método centralizado del apiClient para evitar inconsistencias en las rutas
        const ratingData = await apiClient.getProviderRating(
          providerInfo.provider_id.toString()
        );
        averageRating = ratingData.averageRating || 0;
        totalReviews = ratingData.totalReviews || 0;
      } catch (err) {
        console.warn("No se pudo obtener el rating del proveedor:", err);
      }

      // Contar trabajos completados
      let completedJobs = 0;
      try {
        const requestsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/service-requests/provider/${providerInfo.provider_id}?status=completed`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          }
        );
        
        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json();
          completedJobs = requestsData.pagination?.total || 0;
        }
      } catch (err) {
        console.warn("No se pudo obtener trabajos completados:", err);
      }

      // Formatear fecha de creación
      const joinedDate = new Date(providerInfo.created_at).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const memberSince = new Date(providerInfo.created_at).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
      });

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
      const profileImage = isValidUrl(profile.user.Foto) 
        ? profile.user.Foto 
        : isValidUrl(providerInfo.IMAGE) 
          ? providerInfo.IMAGE 
          : undefined;

      // Construir objeto ProviderUser
      const providerUser: ProviderUser = {
        id: providerInfo.provider_id.toString(),
        name: providerInfo.workname || profile.user.username,
        email: profile.user.email,
        phone: '', // TODO: Agregar campo phone a la tabla users o providers si se necesita
        address: '', // TODO: Agregar dirección si se necesita
        profileImage,
        bio: providerInfo.description || '',
        rating: averageRating,
        completedJobs,
        verified: profile.user.provider || false,
        joinedDate,
        memberSince,
      };

      setProvider(providerUser);
    } catch (err) {
      console.error("Error fetching provider:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error desconocido al cargar el proveedor"
      );
      setProvider(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProvider();
  }, [fetchProvider]);

  const updateProvider = (updates: Partial<ProviderUser>) => {
    if (provider) {
      setProvider({ ...provider, ...updates });
    }
  };

  return { 
    provider, 
    loading, 
    error, 
    updateProvider,
    refetch: fetchProvider,
  };
}
