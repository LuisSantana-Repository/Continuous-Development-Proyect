import { MessageSquare } from "lucide-react";
import ReviewListItem from "./ReviewListItem";
import type { ClientReview } from "@/types";

interface ClientReviewsListProps {
  reviews: ClientReview[];
  isLoading: boolean;
}

export default function ClientReviewsList({
  reviews,
  isLoading,
}: ClientReviewsListProps) {
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
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewListItem key={review.id} review={review} />
      ))}
    </div>
  );
}
