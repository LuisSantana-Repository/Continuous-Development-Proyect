import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface CreateProviderReviewData {
  userId: string;
  // providerId is now obtained from JWT token on backend (secure)
  serviceRequestId: string;
  rating: number;
  comment: string;
}

export interface ProviderReview {
  reviewId: string;
  providerId: number;
  userId: string;
  serviceRequestId: string;
  service_request_id: string; // Campo del backend
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  username?: string;
  user_photo?: string;
}

export function useProviderReviews() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Crear una review de provider a cliente
   */
  const createProviderReview = async (
    data: CreateProviderReviewData
  ): Promise<{ reviewId: string } | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/provider-reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear la review");
      }

      const result = await response.json();
      return result.data;
    } catch (err: any) {
      const errorMessage = err.message || "Error al crear la review";
      setError(errorMessage);
      console.error("Error creating provider review:", err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verificar si ya existe una review para un service request
   * Usa el providerId del usuario autenticado (del JWT)
   */
  const checkReviewExists = async (
    serviceRequestId: string
  ): Promise<boolean> => {
    try {
      // Obtener las reviews creadas por el provider autenticado
      const response = await fetch(
        `${API_BASE_URL}/provider-reviews/my-reviews`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      const reviews = result.data;

      // Verificar si existe una review para este service request
      return reviews.some(
        (review: ProviderReview) =>
          review.service_request_id === serviceRequestId
      );
    } catch (err) {
      console.error("Error checking review exists:", err);
      return false;
    }
  };

  /**
   * Obtener reviews recibidas por un usuario (cliente)
   */
  const getUserReceivedReviews = async (
    userId: string,
    page = 1,
    pageSize = 10
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/provider-reviews/user/${userId}?page=${page}&pageSize=${pageSize}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al obtener las reviews");
      }

      const result = await response.json();
      return result;
    } catch (err: any) {
      const errorMessage = err.message || "Error al obtener las reviews";
      setError(errorMessage);
      console.error("Error getting user reviews:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Obtener reviews creadas por un provider
   */
  const getProviderCreatedReviews = async (
    providerId: number,
    page = 1,
    pageSize = 10
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/provider-reviews/provider/${providerId}?page=${page}&pageSize=${pageSize}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al obtener las reviews");
      }

      const result = await response.json();
      return result;
    } catch (err: any) {
      const errorMessage = err.message || "Error al obtener las reviews";
      setError(errorMessage);
      console.error("Error getting provider reviews:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Obtener rating promedio de un usuario
   */
  const getUserRating = async (userId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/provider-reviews/user/${userId}/rating`
      );

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      console.error("Error getting user rating:", err);
      return null;
    }
  };

  return {
    createProviderReview,
    checkReviewExists,
    getUserReceivedReviews,
    getProviderCreatedReviews,
    getUserRating,
    isLoading,
    error,
  };
}

