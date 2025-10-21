"use client";

import { useState, useEffect } from "react";
import type { ProviderRequest } from "@/types";

export function useProviderRequests() {
  const [requests, setRequests] = useState<ProviderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simular latencia de red
        await new Promise((resolve) => setTimeout(resolve, 200));

        const response = await fetch("/data/requests.json");
        if (!response.ok) {
          throw new Error("No se pudo cargar las solicitudes");
        }

        const data = await response.json();
        setRequests(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Error desconocido al cargar las solicitudes"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const acceptRequest = async (requestId: string) => {
    // Simular latencia de red
    await new Promise((resolve) => setTimeout(resolve, 200));

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
  };

  const rejectRequest = async (requestId: string, reason: string) => {
    // Simular latencia de red
    await new Promise((resolve) => setTimeout(resolve, 200));

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
  };

  const proposeDate = async (
    requestId: string,
    newDate: string,
    note?: string
  ) => {
    // Simular latencia de red
    await new Promise((resolve) => setTimeout(resolve, 200));

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
    // Simular latencia de red
    await new Promise((resolve) => setTimeout(resolve, 200));

    setRequests((prev) =>
      prev.map((req) => (req.requestId === requestId ? { ...req, ...updates } : req))
    );
  };

  const deleteRequest = async (requestId: string) => {
    // Simular latencia de red
    await new Promise((resolve) => setTimeout(resolve, 200));

    setRequests((prev) => prev.filter((req) => req.requestId !== requestId));
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
  };
}
