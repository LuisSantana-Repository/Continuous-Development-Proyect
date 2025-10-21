"use client";

import { useState, useEffect } from "react";
import type { ProviderUser } from "@/types";

export function useProviderUser() {
  const [provider, setProvider] = useState<ProviderUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simular latencia de red
        await new Promise((resolve) => setTimeout(resolve, 200));

        const response = await fetch("/data/provider.json");
        if (!response.ok) {
          throw new Error("No se pudo cargar la información del proveedor");
        }

        const data = await response.json();
        setProvider(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Error desconocido al cargar el proveedor"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProvider();
  }, []);

  const updateProvider = (updates: Partial<ProviderUser>) => {
    if (provider) {
      setProvider({ ...provider, ...updates });
    }
  };

  return { provider, loading, error, updateProvider };
}
