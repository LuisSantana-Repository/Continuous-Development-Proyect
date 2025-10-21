"use client";

import { useState } from "react";
import { Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProviderRequest } from "@/types";

interface EditRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ProviderRequest;
  onConfirm: (requestId: string, updates: Partial<ProviderRequest>) => void;
}

export default function EditRequestModal({
  open,
  onOpenChange,
  request,
  onConfirm,
}: EditRequestModalProps) {
  const [amount, setAmount] = useState(request.amount.toString());
  const [preferredDate, setPreferredDate] = useState(
    new Date(request.preferredDate).toISOString().slice(0, 16)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (!isSubmitting) {
      // Resetear a valores originales
      setAmount(request.amount.toString());
      setPreferredDate(
        new Date(request.preferredDate).toISOString().slice(0, 16)
      );
      onOpenChange(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("El monto debe ser un número mayor a 0");
      return;
    }

    if (!preferredDate) {
      alert("Por favor selecciona una fecha");
      return;
    }

    // Validar que la fecha no sea en el pasado
    const selectedDate = new Date(preferredDate);
    const now = new Date();
    if (selectedDate < now) {
      alert("La fecha no puede ser en el pasado");
      return;
    }

    setIsSubmitting(true);

    // Simular latencia
    await new Promise((resolve) => setTimeout(resolve, 200));

    const updates: Partial<ProviderRequest> = {
      amount: amountNum,
      preferredDate: new Date(preferredDate).toISOString(),
    };

    onConfirm(request.requestId, updates);

    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="heading-lg text-primary pr-8 flex items-center gap-2">
            <Edit className="h-5 w-5 text-[var(--color-primary)]" />
            Editar Solicitud
          </DialogTitle>
          <DialogDescription className="body-base text-secondary">
            Modifica los detalles de esta solicitud. Los cambios se guardarán
            inmediatamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Contenido scrolleable */}
          <div className="overflow-y-auto px-6 space-y-4 pt-4">
            {/* Información del Servicio (solo lectura) */}
            <div className="rounded-lg bg-[var(--color-background-secondary)] p-4 space-y-2">
              <div>
                <p className="body-sm font-medium text-primary">
                  {request.serviceName}
                </p>
                <p className="body-sm text-secondary">
                  Cliente: {request.userName}
                </p>
              </div>
              <div className="border-t pt-2">
                <p className="body-sm text-secondary">
                  <strong>Dirección:</strong> {request.address}
                </p>
                <p className="body-sm text-secondary mt-1">
                  <strong>Descripción:</strong> {request.description}
                </p>
              </div>
            </div>

            {/* Monto */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="body-base font-medium">
                Monto (MXN) <span className="text-red-600">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            {/* Nueva Fecha y Hora */}
            <div className="space-y-2">
              <Label htmlFor="preferredDate" className="body-base font-medium">
                Nueva fecha y hora <span className="text-red-600">*</span>
              </Label>
              <Input
                id="preferredDate"
                type="datetime-local"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
              <p className="body-sm text-secondary">
                Fecha actual:{" "}
                {new Date(request.preferredDate).toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Botones fijos al fondo */}
          <div className="px-6 pb-6 pt-4 border-t bg-white">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
                disabled={!amount || !preferredDate || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
