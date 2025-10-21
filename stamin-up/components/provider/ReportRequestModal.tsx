"use client";

import { useState } from "react";
import { FileText, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ProviderRequest } from "@/types";

interface ReportRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ProviderRequest;
  onSuccess?: (reportId: string, category: string) => void;
}

const REPORT_CATEGORIES = [
  {
    id: "excellent",
    label: "Excelente",
    description: "Cliente muy profesional y colaborador",
  },
  {
    id: "good",
    label: "Bueno",
    description: "El servicio se completó sin problemas significativos",
  },
  {
    id: "payment_issue",
    label: "Problema de pago",
    description: "Hubo inconvenientes con el pago acordado",
  },
  {
    id: "inappropriate_behavior",
    label: "Comportamiento inapropiado",
    description: "El cliente tuvo un comportamiento no profesional",
  },
  {
    id: "dangerous_conditions",
    label: "Condiciones peligrosas",
    description: "El lugar de trabajo presentó condiciones inseguras",
  },
  {
    id: "incomplete_info",
    label: "Información incompleta",
    description: "El cliente no proporcionó toda la información necesaria",
  },
  {
    id: "service_cancelled",
    label: "Servicio cancelado",
    description: "El cliente canceló el servicio sin previo aviso",
  },
  {
    id: "other",
    label: "Otro",
    description: "Otro tipo de situación no listada",
  },
];

export default function ReportRequestModal({
  open,
  onOpenChange,
  request,
  onSuccess,
}: ReportRequestModalProps) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (!isSubmitting) {
      setCategory("");
      setDescription("");
      onOpenChange(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category) {
      alert("Por favor selecciona una categoría");
      return;
    }

    if (description.trim().length < 10) {
      alert(
        "Por favor proporciona una descripción más detallada (mínimo 10 caracteres)"
      );
      return;
    }

    setIsSubmitting(true);

    // Simular envío de datos
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generar ID único para el reporte
    const reportId = `rep_${Date.now()}`;

    console.log("Reporte del servicio completado enviado:", {
      id: reportId,
      requestId: request.requestId,
      clientName: request.userName,
      category,
      description,
      timestamp: new Date().toISOString(),
    });

    setIsSubmitting(false);

    // Mostrar mensaje de éxito
    alert(
      "Tu reporte ha sido enviado exitosamente. Gracias por documentar tu experiencia."
    );

    if (onSuccess) {
      onSuccess(reportId, category);
    }

    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="heading-lg text-primary pr-8 flex items-center gap-2">
            {/* <FileText className="h-6 w-6 text-[var(--color-primary)]" /> */}
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

            {/* Categoría del Reporte */}
            <div className="space-y-3">
              <label className="body-base font-medium text-primary">
                ¿Cómo fue tu experiencia con este cliente?{" "}
                <span className="text-[var(--color-error)]">*</span>
              </label>
              <div className="space-y-2">
                {REPORT_CATEGORIES.map((cat) => (
                  <label
                    key={cat.id}
                    className={`flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      category === cat.id
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat.id}
                      checked={category === cat.id}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1 h-4 w-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                    />
                    <div className="flex-1">
                      <div className="body-base font-medium text-primary">
                        {cat.label}
                      </div>
                      <div className="body-sm text-secondary">
                        {cat.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Descripción Detallada */}
            <div className="space-y-3">
              <label
                htmlFor="description"
                className="body-base font-medium text-primary"
              >
                Detalles del servicio{" "}
                <span className="text-[var(--color-error)]">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe cómo fue la experiencia, si hubo algún problema o destacar algo positivo sobre el cliente..."
                maxLength={1000}
                rows={6}
                className="w-full rounded-lg border border-gray-300 p-3 body-base text-primary placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                required
              />
              <div className="flex justify-between items-center">
                <p className="body-sm text-secondary">Mínimo 10 caracteres</p>
                <p className="body-sm text-secondary">
                  {description.length}/1000 caracteres
                </p>
              </div>
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
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  !category || description.trim().length < 10 || isSubmitting
                }
                className="w-full sm:w-auto gap-2"
              >
                {isSubmitting ? (
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
