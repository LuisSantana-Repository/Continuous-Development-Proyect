import { Card, CardContent } from "@/components/ui/card";
import { Star, Calendar, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClientReview } from "@/types";

interface ReviewListItemProps {
  review: ClientReview;
}

export default function ReviewListItem({ review }: ReviewListItemProps) {
  const reviewDate = new Date(review.date).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Card className="shadow-md transition-all hover:shadow-lg">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <h3 className="heading-sm text-primary">{review.serviceName}</h3>
              <p className="body-sm text-secondary">
                Proveedor: {review.providerName}
              </p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < review.rating
                        ? "fill-[var(--color-warning)] text-[var(--color-warning)]"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="body-base font-semibold text-primary">
                {review.rating}.0
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="rounded-lg bg-[var(--color-background-secondary)] p-4">
            <p className="body-base text-secondary leading-relaxed">
              {review.comment}
            </p>
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
            <div className="flex items-center gap-2 text-muted">
              <Calendar className="h-4 w-4" />
              <span className="body-sm">{reviewDate}</span>
            </div>

            {/* <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  // TODO: Implementar edición de reseña
                  alert("Función de edición disponible próximamente");
                }}
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                onClick={() => {
                  // TODO: Implementar eliminación de reseña
                  if (
                    confirm("¿Estás seguro de que deseas eliminar esta reseña?")
                  ) {
                    alert("Función de eliminación disponible próximamente");
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
            </div> */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
