import { Review } from "@/types";
import { Star } from "lucide-react";
import { Card } from "./ui/card";

interface ReviewCardProps {
  review: Review;
}

/**
 * Componente para mostrar una reseña individual
 * Presentacional puro - recibe datos por props
 */
export function ReviewCard({ review }: ReviewCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card className="p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <img
            src={review.userAvatar || "https://i.pravatar.cc/150?img=0"}
            alt={review.userName}
            className="w-12 h-12 rounded-full object-cover"
          />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Header: nombre y fecha */}
          <div className="flex items-start justify-between mb-2 gap-4">
            <div>
              <h4 className="body-base font-semibold text-primary">
                {review.userName}
              </h4>
              <p className="body-sm text-muted">
                {formatDate(review.createdAt)}
              </p>
            </div>

            {/* Estrellas */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={`w-4 h-4 ${
                    index < review.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Comentario */}
          <p className="body-base text-secondary leading-relaxed">
            {review.comment}
          </p>
        </div>
      </div>
    </Card>
  );
}
