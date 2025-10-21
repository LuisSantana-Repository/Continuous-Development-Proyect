"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RejectRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  serviceName: string;
  onConfirm: (requestId: string, reason: string) => void;
}

export default function RejectRequestModal({
  open,
  onOpenChange,
  requestId,
  serviceName,
  onConfirm,
}: RejectRequestModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (!isSubmitting) {
      setReason("");
      onOpenChange(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (reason.trim().length < 10) {
      alert(
        "Por favor proporciona una razón más detallada (mínimo 10 caracteres)"
      );
      return;
    }

    setIsSubmitting(true);

    // Simular latencia
    await new Promise((resolve) => setTimeout(resolve, 200));

    await onConfirm(requestId, reason.trim());

    setIsSubmitting(false);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="heading-lg text-primary pr-8 flex items-center gap-2">
            <X className="h-5 w-5 text-red-600" />
            Rechazar Solicitud
          </DialogTitle>
          <DialogDescription className="body-base text-secondary">
            Por favor proporciona una razón para rechazar esta solicitud. Esto
            ayudará al cliente a entender tu decisión.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Nombre del Servicio */}
          <div className="rounded-lg bg-[var(--color-background-secondary)] p-3">
            <p className="body-sm font-medium text-primary">{serviceName}</p>
          </div>

          {/* Razón del Rechazo */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="body-base font-medium">
              Razón del rechazo <span className="text-red-600">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ejemplo: No cuento con disponibilidad en esa fecha..."
              rows={4}
              maxLength={500}
              required
            />
            <div className="flex justify-between">
              <p className="body-sm text-secondary">Mínimo 10 caracteres</p>
              <p className="body-sm text-secondary">{reason.length}/500</p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={reason.trim().length < 10 || isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Rechazando...
                </>
              ) : (
                "Confirmar Rechazo"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
