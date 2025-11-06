import { Review } from "@/types";
import { Star, MessageSquare } from "lucide-react";
import { ReviewCard } from "@/components/ReviewCard";
import { Button } from "@/components/ui/button";

interface ReviewsSectionProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  isLoading: boolean;
}

/**
 * Componente que muestra las reseñas y calificaciones del servicio
 * Incluye resumen estadístico y lista de reseñas
 * Maneja correctamente el caso cuando no hay reviews (muestra 0 sin errores)
 */
export function ReviewsSection({
  reviews,
  averageRating,
  totalReviews,
  isLoading,
}: ReviewsSectionProps) {
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
  const safeReviews = reviews || [];

  return (
    <div className="space-y-8">
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
      <div className="space-y-4">
        {safeReviews.length > 0 ? (
          <>
            {safeReviews.slice(0, 5).map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}

            {safeReviews.length > 5 && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  className="rounded-lg border-2 border-primary text-primary hover:bg-primary hover:text-white"
                >
                  Ver todas las reseñas ({safeReviews.length})
                </Button>
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
