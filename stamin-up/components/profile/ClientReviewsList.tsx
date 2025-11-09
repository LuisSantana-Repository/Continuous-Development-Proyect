"use client";

import { useState } from "react";
import { MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReviewListItem from "./ReviewListItem";
import type { ClientReview } from "@/types";

interface ClientReviewsListProps {
  reviews: ClientReview[];
  isLoading: boolean;
}

const ITEMS_PER_PAGE = 5;

export default function ClientReviewsList({
  reviews,
  isLoading,
}: ClientReviewsListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Calcular paginación
  const totalPages = Math.ceil(reviews.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedReviews = reviews.slice(startIndex, endIndex);

  // Navegación de páginas
  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll suave al inicio de la lista
    const reviewsSection = document.getElementById("reviews-section");
    if (reviewsSection) {
      reviewsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-56 animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-[var(--color-background-secondary)] p-12 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md">
          <MessageSquare className="h-10 w-10 text-muted" />
        </div>
        <h3 className="heading-sm text-primary mb-2">
          No has escrito reseñas aún
        </h3>
        <p className="body-base text-secondary max-w-md">
          Comparte tu experiencia con otros usuarios. Tus opiniones ayudan a la
          comunidad a tomar mejores decisiones.
        </p>
      </div>
    );
  }

  return (
    <div id="reviews-section" className="space-y-6">
      {/* Lista de reseñas */}
      <div className="space-y-4">
        {paginatedReviews.map((review) => (
          <ReviewListItem key={review.id} review={review} />
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--color-border-light)] pt-4">
          <p className="body-sm text-secondary">
            Mostrando {startIndex + 1} - {Math.min(endIndex, reviews.length)} de{" "}
            {reviews.length} reseñas
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
                  if (page >= currentPage - 1 && page <= currentPage + 1) {
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
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
    </div>
  );
}
