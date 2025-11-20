"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useProviderReviews } from "@/hooks/useProviderReviews";
import type { ProviderRequest } from "@/types";

interface RateClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ProviderRequest;
  // providerId is no longer needed - obtained from JWT on backend
  onSuccess: () => void;
}

export default function RateClientModal({
  open,
  onOpenChange,
  request,
  onSuccess,
}: RateClientModalProps) {
  const { createProviderReview, isLoading } = useProviderReviews();

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    // Validaciones
    if (rating === 0) {
      setError("Por favor selecciona una calificación");
      return;
    }

    if (comment.trim().length < 10) {
      setError("El comentario debe tener al menos 10 caracteres");
      return;
    }

    if (comment.trim().length > 500) {
      setError("El comentario no puede exceder los 500 caracteres");
      return;
    }

    try {
      await createProviderReview({
        userId: request.userId,
        // providerId is now obtained from JWT token on backend (secure)
        serviceRequestId: request.requestId,
        rating,
        comment: comment.trim(),
      });

      // Limpiar formulario
      setRating(0);
      setComment("");
      setError("");

      // Notificar éxito y cerrar
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Error al crear la calificación");
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setRating(0);
      setComment("");
      setError("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Calificar al Cliente</DialogTitle>
          <DialogDescription>
            Comparte tu experiencia con {request.userName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Información del Servicio */}
          <div className="bg-[var(--color-background-secondary)] rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Cliente:
              </span>
              <span className="font-medium">{request.userName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Servicio:
              </span>
              <span className="font-medium">{request.serviceName}</span>
            </div>
          </div>

          {/* Rating con Estrellas */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Calificación</label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  disabled={isLoading}
                  className="transition-transform hover:scale-110 disabled:opacity-50"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-[var(--color-text-secondary)]">
                {rating === 1 && "Muy mala experiencia"}
                {rating === 2 && "Mala experiencia"}
                {rating === 3 && "Experiencia regular"}
                {rating === 4 && "Buena experiencia"}
                {rating === 5 && "Excelente experiencia"}
              </p>
            )}
          </div>

          {/* Comentario */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Comentario (10-500 caracteres)
            </label>
            <Textarea
              placeholder="Describe tu experiencia con este cliente: ¿Fue puntual? ¿Tenía claro lo que necesitaba? ¿Lo recomendarías?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isLoading}
              rows={5}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
              <span>{comment.length}/500 caracteres</span>
              <span>
                {comment.length < 10
                  ? `Mínimo ${10 - comment.length} caracteres más`
                  : "✓"}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || rating === 0 || comment.length < 10}
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Enviando...
              </>
            ) : (
              "Enviar Calificación"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
