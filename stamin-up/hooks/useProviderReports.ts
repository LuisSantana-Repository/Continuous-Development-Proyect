import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface CreateProviderReportData {
  serviceRequestId: string;
  reportMessage: string;
}

export interface ProviderReport {
  reportId: string;
  providerId: number;
  serviceRequestId: string;
  reportMessage: string;
  status: "pending" | "reviewing" | "resolved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export function useProviderReports() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Crear un reporte de proveedor a cliente
   */
  const createProviderReport = async (
    data: CreateProviderReportData
  ): Promise<ProviderReport | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/provider-reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el reporte");
      }

      const result = await response.json();
      return result.data;
    } catch (err: any) {
      const errorMessage = err.message || "Error al crear el reporte";
      setError(errorMessage);
      console.error("Error creating provider report:", err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verificar si ya existe un reporte para un service request
   */
  const checkReportExists = async (
    serviceRequestId: string
  ): Promise<boolean> => {
    try {
      // Obtener todos los reportes del proveedor
      const response = await fetch(`${API_BASE_URL}/api/provider-reports/my-reports`, {
        credentials: "include",
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      const reports = result.data;

      // Verificar si existe un reporte para este service request
      // El backend devuelve service_request_id en snake_case
      return reports.some(
        (report: any) =>
          report.service_request_id === serviceRequestId
      );
    } catch (err) {
      console.error("Error checking report exists:", err);
      return false;
    }
  };

  /**
   * Obtener reportes creados por el proveedor autenticado
   */
  const getMyReports = async (page = 1, pageSize = 10) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/provider-reports/my-reports?page=${page}&pageSize=${pageSize}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al obtener los reportes");
      }

      const result = await response.json();
      return result;
    } catch (err: any) {
      const errorMessage = err.message || "Error al obtener los reportes";
      setError(errorMessage);
      console.error("Error getting my reports:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createProviderReport,
    checkReportExists,
    getMyReports,
    isLoading,
    error,
  };
}
