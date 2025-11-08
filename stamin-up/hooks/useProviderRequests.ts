"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";
import type { ProviderRequest } from "@/types";

export function useProviderRequests() {
  const [requests, setRequests] = useState<ProviderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener el perfil del provider para saber su providerId
      const profile = await apiClient.getProfile();
      if (!profile?.user?.user_id) {
        throw new Error("No se pudo obtener el ID del usuario");
      }

      // Obtener el providerId desde la tabla providers
      const providersResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/providers/user/${profile.user.user_id}`,
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

      const providerId = providerData.providers[0].provider_id;

      // Obtener las solicitudes del proveedor
      const response = await apiClient.getProviderServiceRequests(providerId);

      // Transformar los datos del backend al formato ProviderRequest
      const transformedRequests: ProviderRequest[] = response.data.map((req: any) => {
        // Mapear status del backend
        let status: ProviderRequest['status'] = 'pending';
        switch (req.status) {
          case 'accepted':
            status = 'accepted';
            break;
          case 'rejected':
            status = 'rejected';
            break;
          case 'in_progress':
            status = 'in_progress';
            break;
          case 'completed':
            status = 'completed';
            break;
          case 'cancelled':
            status = 'cancelled';
            break;
          default:
            status = 'pending';
        }

        return {
          requestId: req.request_id,
          serviceId: req.provider_id.toString(),
          serviceName: req.service_type || 'Servicio',
          userId: req.user_id,
          userName: req.client_username || req.client_email || 'Cliente',
          userAvatar: req.client_photo || undefined,
          preferredDate: req.preferred_date,
          address: req.address || '',
          contactPhone: req.contact_phone || '',
          description: req.description || '',
          amount: parseFloat(req.amount || '0'),
          status,
          createdAt: req.created_at,
          rejectionReason: undefined, // TODO: Agregar campo en backend
          history: [
            {
              action: 'created',
              timestamp: req.created_at,
              note: 'Solicitud creada',
            },
          ],
        };
      });

      setRequests(transformedRequests);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error desconocido al cargar las solicitudes"
      );
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const acceptRequest = async (requestId: string) => {
    try {
      await apiClient.updateServiceRequestStatus(requestId, {
        status: 'accepted',
      });

      // Actualizar estado local
      setRequests((prev) =>
        prev.map((req) =>
          req.requestId === requestId
            ? {
                ...req,
                status: "accepted",
                history: [
                  ...req.history,
                  {
                    action: "accepted",
                    timestamp: new Date().toISOString(),
                    note: "Solicitud aceptada por el proveedor",
                  },
                ],
              }
            : req
        )
      );
    } catch (err) {
      console.error("Error accepting request:", err);
      throw err;
    }
  };

  const rejectRequest = async (requestId: string, reason: string) => {
    try {
      await apiClient.updateServiceRequestStatus(requestId, {
        status: 'rejected',
      });

      // Actualizar estado local
      setRequests((prev) =>
        prev.map((req) =>
          req.requestId === requestId
            ? {
                ...req,
                status: "rejected",
                rejectionReason: reason,
                history: [
                  ...req.history,
                  {
                    action: "rejected",
                    timestamp: new Date().toISOString(),
                    note: "Solicitud rechazada",
                    reason,
                  },
                ],
              }
            : req
        )
      );
    } catch (err) {
      console.error("Error rejecting request:", err);
      throw err;
    }
  };

  const proposeDate = async (
    requestId: string,
    newDate: string,
    note?: string
  ) => {
    // TODO: Implementar endpoint en backend para proponer nueva fecha
    console.log("Proposing date:", { requestId, newDate, note });
    
    setRequests((prev) =>
      prev.map((req) =>
        req.requestId === requestId
          ? {
              ...req,
              preferredDate: newDate,
              history: [
                ...req.history,
                {
                  action: "date_proposed",
                  timestamp: new Date().toISOString(),
                  note: note || "Proveedor propuso nueva fecha",
                  proposedDate: newDate,
                },
              ],
            }
          : req
      )
    );
  };

  const updateRequest = async (
    requestId: string,
    updates: Partial<ProviderRequest>
  ) => {
    try {
      // Preparar updates para el backend
      const backendUpdates: any = {};
      
      if (updates.amount !== undefined) {
        backendUpdates.amount = updates.amount;
      }
      
      if (updates.status !== undefined) {
        backendUpdates.status = updates.status;
      }

      await apiClient.updateServiceRequestStatus(requestId, backendUpdates);

      // Actualizar estado local
      setRequests((prev) =>
        prev.map((req) => (req.requestId === requestId ? { ...req, ...updates } : req))
      );
    } catch (err) {
      console.error("Error updating request:", err);
      throw err;
    }
  };

  const deleteRequest = async (requestId: string) => {
    try {
      // Cancelar la solicitud en lugar de eliminarla
      await apiClient.updateServiceRequestStatus(requestId, {
        status: 'cancelled',
      });

      // Actualizar estado local
      setRequests((prev) =>
        prev.map((req) =>
          req.requestId === requestId
            ? { ...req, status: 'cancelled' }
            : req
        )
      );
    } catch (err) {
      console.error("Error deleting request:", err);
      throw err;
    }
  };

  const startWork = async (requestId: string) => {
    try {
      await apiClient.updateServiceRequestStatus(requestId, {
        status: 'in_progress',
      });

      // Actualizar estado local
      setRequests((prev) =>
        prev.map((req) =>
          req.requestId === requestId
            ? {
                ...req,
                status: "in_progress",
                history: [
                  ...req.history,
                  {
                    action: "in_progress",
                    timestamp: new Date().toISOString(),
                    note: "Trabajo iniciado",
                  },
                ],
              }
            : req
        )
      );
    } catch (err) {
      console.error("Error starting work:", err);
      throw err;
    }
  };

  const completeWork = async (requestId: string) => {
    try {
      await apiClient.updateServiceRequestStatus(requestId, {
        status: 'completed',
      });

      // Actualizar estado local
      setRequests((prev) =>
        prev.map((req) =>
          req.requestId === requestId
            ? {
                ...req,
                status: "completed",
                history: [
                  ...req.history,
                  {
                    action: "completed",
                    timestamp: new Date().toISOString(),
                    note: "Trabajo completado",
                  },
                ],
              }
            : req
        )
      );
    } catch (err) {
      console.error("Error completing work:", err);
      throw err;
    }
  };

  return {
    requests,
    loading,
    error,
    acceptRequest,
    rejectRequest,
    proposeDate,
    updateRequest,
    deleteRequest,
    startWork,
    completeWork,
    refetch: fetchRequests,
  };
}
