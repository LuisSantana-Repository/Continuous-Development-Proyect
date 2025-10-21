"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Order } from "@/types";

interface RateServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onSuccess?: (ratingValue: number) => void;
}

const RATING_TAGS = [
  { id: "punctual", label: "Puntual" },
  { id: "professional", label: "Profesional" },
  { id: "quality", label: "Buena Calidad" },
  { id: "friendly", label: "Amable" },
  { id: "clean", label: "Limpio" },
  { id: "recommend", label: "Lo Recomendaría" },
];

export default function RateServiceModal({
  open,
  onOpenChange,
  order,
  onSuccess,
}: RateServiceModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(0);
      setHoveredRating(0);
      setComment("");
      setSelectedTags([]);
      onOpenChange(false);
    }
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      alert("Por favor selecciona una calificación");
      return;
    }

    setIsSubmitting(true);

    // Simular envío de datos
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log("Calificación enviada:", {
      orderId: order.id,
      rating,
      comment,
      tags: selectedTags,
      timestamp: new Date().toISOString(),
    });

    setIsSubmitting(false);

    // Mostrar mensaje de éxito
    alert("¡Gracias por tu calificación! Tu opinión es muy valiosa.");

    // Llamar callback de éxito con el valor del rating
    if (onSuccess) {
      onSuccess(rating);
    }

    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-scroll scrollbar-hide">
        <DialogHeader>
          <DialogTitle className="heading-lg text-primary pr-8">
            Calificar Servicio
          </DialogTitle>
          <DialogDescription className="body-base text-secondary">
            Tu opinión nos ayuda a mejorar y ayuda a otros usuarios a tomar
            mejores decisiones
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Información del Servicio */}
          <div className="rounded-lg bg-[var(--color-background-secondary)] p-4">
            <h3 className="body-base font-semibold text-primary mb-2">
              {order.serviceName}
            </h3>
            <p className="body-sm text-secondary">
              Proveedor: {order.providerName}
            </p>
            <p className="body-sm text-secondary">
              Fecha:{" "}
              {new Date(order.date).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Selector de Estrellas */}
          <div className="space-y-3">
            <label className="body-base font-medium text-primary">
              Calificación General{" "}
              <span className="text-[var(--color-error)]">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoveredRating || rating)
                        ? "fill-[var(--color-warning)] text-[var(--color-warning)]"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 body-lg font-semibold text-primary">
                  {rating}.0
                </span>
              )}
            </div>
            {rating > 0 && (
              <p className="body-sm text-secondary">
                {rating === 1 && "Muy insatisfecho"}
                {rating === 2 && "Insatisfecho"}
                {rating === 3 && "Regular"}
                {rating === 4 && "Satisfecho"}
                {rating === 5 && "Muy satisfecho"}
              </p>
            )}
          </div>

          {/* Botones */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={rating === 0 || isSubmitting}
              className="w-full sm:w-auto gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Enviando...
                </>
              ) : (
                <>
                  <Star className="h-4 w-4" />
                  Enviar Calificación
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
