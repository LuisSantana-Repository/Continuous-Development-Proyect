import { useState } from "react";
import { API_BASE_URL } from "../lib/config";


export interface CreateUserReportData {
  serviceRequestId: string;
  reportMessage: string;
}

export interface UserReport {
  reportId: string;
  userId: string;
  serviceRequestId: string;
  reportMessage: string;
  status: "pending" | "under_review" | "resolved" | "dismissed";
  createdAt: string;
  updatedAt: string;
}

export function useUserReports() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Crear un reporte de usuario a proveedor
   */
  const createUserReport = async (
    data: CreateUserReportData
  ): Promise<UserReport | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/user-reports`, {
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
      console.error("Error creating user report:", err);
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
      // Obtener todos los reportes del usuario
      const response = await fetch(`${API_BASE_URL}/user-reports/my-reports`, {
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
   * Obtener reportes creados por el usuario autenticado
   */
  const getMyReports = async (page = 1, pageSize = 10) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/user-reports/my-reports?page=${page}&pageSize=${pageSize}`,
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
    createUserReport,
    checkReportExists,
    getMyReports,
    isLoading,
    error,
  };
}
