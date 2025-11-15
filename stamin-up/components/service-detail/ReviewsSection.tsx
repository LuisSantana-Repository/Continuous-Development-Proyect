"use client";

import { useState } from "react";
import { Review } from "@/types";
import { Star, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { ReviewCard } from "@/components/ReviewCard";
import { Button } from "@/components/ui/button";

interface ReviewsSectionProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  isLoading: boolean;
}

const ITEMS_PER_PAGE = 5;

/**
 * Componente que muestra las reseñas y calificaciones del servicio
 * Incluye resumen estadístico y lista de reseñas con paginación
 * Maneja correctamente el caso cuando no hay reviews (muestra 0 sin errores)
 */
export function ReviewsSection({
  reviews,
  averageRating,
  totalReviews,
  isLoading,
}: ReviewsSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Calcular paginación
  const safeReviews = reviews || [];
  const totalPages = Math.ceil(safeReviews.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedReviews = safeReviews.slice(startIndex, endIndex);

  // Navegación de páginas
  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll suave al inicio de la sección de reviews
    const reviewsSection = document.getElementById("reviews-section");
    if (reviewsSection) {
      reviewsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse" />
        <div className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  // Asegurar valores por defecto si no hay datos
  const safeAverageRating = averageRating || 0;
  const safeTotalReviews = totalReviews || 0;

  return (
    <div id="reviews-section" className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <MessageSquare className="w-8 h-8 text-primary" />
        <div>
          <h2 className="heading-md text-primary">Reseñas y Calificación</h2>
          <p className="body-base text-secondary">
            Conoce lo que opinan nuestros clientes
          </p>
        </div>
      </div>

      {/* Resumen de calificaciones */}
      <div className="flex justify-center p-8 bg-secondary rounded-2xl shadow-md">
        {/* Promedio general */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-6xl font-bold text-primary">
              {safeAverageRating.toFixed(1)}
            </span>
            <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
          </div>
          <div className="flex items-center justify-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className={`w-5 h-5 ${
                  index < Math.round(safeAverageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-300 text-gray-300"
                }`}
              />
            ))}
          </div>
          <p className="body-base text-secondary">
            {safeTotalReviews === 0
              ? "Sin reseñas aún"
              : `Basado en ${safeTotalReviews} ${
                  safeTotalReviews === 1 ? "reseña" : "reseñas"
                }`}
          </p>
        </div>
      </div>

      {/* Lista de reseñas */}
      <div className="space-y-6">
        {safeReviews.length > 0 ? (
          <>
            <div className="space-y-4">
              {paginatedReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[var(--color-border-light)] pt-4">
                <p className="body-sm text-secondary">
                  Mostrando {startIndex + 1} -{" "}
                  {Math.min(endIndex, safeReviews.length)} de{" "}
                  {safeReviews.length} reseñas
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => {
                        // Mostrar solo 3 páginas: anterior, actual, y siguiente
                        if (
                          page >= currentPage - 1 &&
                          page <= currentPage + 1
                        ) {
                          return (
                            <Button
                              key={page}
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => goToPage(page)}
                              className={
                                currentPage === page
                                  ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] min-w-[2.5rem]"
                                  : "min-w-[2.5rem]"
                              }
                            >
                              {page}
                            </Button>
                          );
                        }
                        return null;
                      }
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="gap-1"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-secondary rounded-2xl">
            <MessageSquare className="w-12 h-12 text-muted mx-auto mb-3" />
            <p className="body-lg text-muted">
              Este servicio aún no tiene reseñas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
