"use client";

import { useState } from "react";
import { AlertTriangle, Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUserReports } from "@/hooks/useUserReports";
import type { Order } from "@/types";

interface ReportServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onSuccess?: () => void;
}

export default function ReportServiceModal({
  open,
  onOpenChange,
  order,
  onSuccess,
}: ReportServiceModalProps) {
  const { createUserReport, isLoading } = useUserReports();

  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleClose = () => {
    if (!isLoading) {
      setDescription("");
      setError("");
      onOpenChange(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (description.trim().length < 20) {
      setError("La descripción debe tener al menos 20 caracteres");
      return;
    }

    if (description.length > 2000) {
      setError("La descripción no puede exceder los 2000 caracteres");
      return;
    }

    try {
      await createUserReport({
        serviceRequestId: order.id,
        reportMessage: description.trim(),
      });

      // Notificar éxito
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-scroll scrollbar-hide">
        <DialogHeader>
          <DialogTitle className="heading-lg text-primary pr-8 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-[var(--color-error)]" />
            Reportar Problema
          </DialogTitle>
          <DialogDescription className="body-base text-secondary">
            Cuéntanos qué sucedió. Tu reporte será revisado por nuestro equipo
            de soporte.
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
            <p className="body-sm text-secondary">
              Estado: <span className="font-medium">{order.status}</span>
            </p>
          </div>

          {/* Descripción del Problema */}
          <div className="space-y-3">
            <label
              htmlFor="description"
              className="body-base font-medium text-primary"
            >
              Describe el problema{" "}
              <span className="text-[var(--color-error)]">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Por favor describe el problema con el mayor detalle posible. Incluye fechas, horarios y cualquier otra información relevante..."
              maxLength={2000}
              rows={8}
              className="w-full rounded-lg border border-gray-300 p-3 body-base text-primary placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              required
            />
            <div className="flex justify-between items-center">
              <p className="body-sm text-secondary">Mínimo 20 caracteres</p>
              <p className="body-sm text-secondary">
                {description.length}/2000 caracteres
              </p>
            </div>
          </div>

          {/* Mostrar error si existe */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="body-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-4 border-t">
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
              className="w-full sm:w-auto gap-2 bg-[var(--color-error)] hover:bg-[var(--color-error)]/90"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Enviando...
                </>
              ) : (
                <>
                  <Flag className="h-4 w-4" />
                  Enviar Reporte
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
