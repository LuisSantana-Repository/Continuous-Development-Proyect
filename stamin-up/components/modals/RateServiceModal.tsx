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
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/apiClient";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(0);
      setHoveredRating(0);
      setComment("");
      setError(null);
      onOpenChange(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError("Por favor selecciona una calificación");
      return;
    }

    setIsSubmitting(true);

    try {
      // Validar que tengamos el providerId
      if (!order.providerId) {
        throw new Error("No se pudo identificar el proveedor del servicio");
      }

      // Crear review en el backend
      await apiClient.createReview({
        providerId: order.providerId,
        serviceRequestId: order.id,
        rating,
        comment: comment.trim() || undefined,
      });

      // Mostrar mensaje de éxito
      alert("¡Gracias por tu calificación! Tu opinión es muy valiosa.");

      // Llamar callback de éxito con el valor del rating
      if (onSuccess) {
        onSuccess(rating);
      }

      handleClose();
    } catch (err) {
      console.error("Error al enviar calificación:", err);

      // Si el error es porque ya se calificó, actualizar el estado local
      const errorMessage = err instanceof Error ? err.message : "";
      if (errorMessage.includes("already reviewed")) {
        alert("Ya has calificado este servicio anteriormente.");
        // Simular que tiene rating para ocultar el botón
        if (onSuccess) {
          onSuccess(rating);
        }
        handleClose();
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Error al enviar la calificación. Por favor intenta de nuevo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="heading-lg text-primary pr-8">
            Calificar Servicio
          </DialogTitle>
          <DialogDescription className="body-base text-secondary">
            Tu opinión nos ayuda a mejorar y ayuda a otros usuarios a tomar
            mejores decisiones
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 px-6 py-4">
            <div className="space-y-6">
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

              {/* Campo de Comentario (Opcional) */}
              <div className="space-y-3">
                <label className="body-base font-medium text-primary">
                  Comentario (Opcional)
                </label>
                <Textarea
                  placeholder="Cuéntanos sobre tu experiencia con este servicio..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="resize-none"
                />
                <p className="body-sm text-secondary text-right">
                  {comment.length}/500 caracteres
                </p>
              </div>

              {/* Mensaje de Error */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="body-sm text-red-800">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Botones - Footer fijo */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end px-6 py-4 border-t flex-shrink-0">
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
