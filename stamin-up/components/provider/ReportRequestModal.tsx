"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProviderReports } from "@/hooks/useProviderReports";
import type { ProviderRequest } from "@/types";

interface ReportRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ProviderRequest;
  onSuccess?: () => void;
}

export default function ReportRequestModal({
  open,
  onOpenChange,
  request,
  onSuccess,
}: ReportRequestModalProps) {
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { createProviderReport, isLoading } = useProviderReports();

  const handleClose = () => {
    if (!isLoading) {
      setDescription("");
      setError(null);
      onOpenChange(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedDescription = description.trim();

    if (trimmedDescription.length < 20) {
      setError("La descripción debe tener al menos 20 caracteres");
      return;
    }

    if (trimmedDescription.length > 2000) {
      setError("La descripción no puede exceder 2000 caracteres");
      return;
    }

    try {
      await createProviderReport({
        serviceRequestId: request.requestId,
        reportMessage: trimmedDescription,
      });

      // Mostrar mensaje de éxito
      alert(
        "Tu reporte ha sido enviado exitosamente. Gracias por documentar tu experiencia."
      );

      if (onSuccess) {
        onSuccess();
      }

      handleClose();
    } catch (err: any) {
      setError(err.message || "Error al enviar el reporte");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="heading-lg text-primary pr-8 flex items-center gap-2">
            Reportar Servicio
          </DialogTitle>
          <DialogDescription className="body-base text-secondary">
            Documenta tu experiencia con este cliente después de completar el
            servicio. Esto ayuda a mantener la calidad de la plataforma.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Contenido scrolleable */}
          <div className="overflow-y-auto px-6 space-y-6 pt-4">
            {/* Información de la Solicitud */}
            <div className="rounded-lg bg-[var(--color-background-secondary)] p-4 border-l-4 border-[var(--color-primary)]">
              <h3 className="body-base font-semibold text-primary mb-2">
                {request.serviceName}
              </h3>
              <p className="body-sm text-secondary">
                Cliente: <span className="font-medium">{request.userName}</span>
              </p>
              <p className="body-sm text-secondary">
                Fecha del servicio:{" "}
                {new Date(request.preferredDate).toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="body-sm text-secondary">
                Precio:{" "}
                <span className="font-medium">
                  ${request.amount.toFixed(2)} MXN
                </span>
              </p>
            </div>

            {/* Descripción del Reporte */}
            <div className="space-y-3">
              <label
                htmlFor="description"
                className="body-base font-medium text-primary"
              >
                Describe tu experiencia con este cliente{" "}
                <span className="text-[var(--color-error)]">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe cómo fue la experiencia, si hubo algún problema o destaca algo positivo sobre el cliente..."
                maxLength={2000}
                rows={8}
                className="w-full rounded-lg border border-gray-300 p-3 body-base text-primary placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                required
              />
              <div className="flex justify-between items-center">
                <p className="body-sm text-secondary">
                  Mínimo 20 caracteres, máximo 2000
                </p>
                <p className="body-sm text-secondary">
                  {description.length}/2000 caracteres
                </p>
              </div>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="body-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          {/* Botones fijos al fondo */}
          <div className="px-6 pb-6 pt-4 border-t bg-white">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={description.trim().length < 20 || isLoading}
                className="w-full sm:w-auto gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar Reporte
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
