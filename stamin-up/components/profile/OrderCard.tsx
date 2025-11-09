"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Star, Flag, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import RateServiceModal from "@/components/modals/RateServiceModal";
import ReportServiceModal from "@/components/modals/ReportServiceModal";
import OrderDetailsModal from "@/components/modals/OrderDetailsModal";
import { canRate, canReport, hasActiveReports } from "@/lib/orderUtils";
import type { Order, OrderRating, OrderReport } from "@/types";

interface OrderCardProps {
  order: Order;
}

export default function OrderCard({ order }: OrderCardProps) {
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [localOrder, setLocalOrder] = useState(order);

  const statusConfig = {
    Completado: {
      variant: "default" as const,
      className: "status-completed-bg status-completed-text hover:opacity-90",
    },
    "En curso": {
      variant: "secondary" as const,
      className:
        "status-in-progress-bg status-in-progress-text hover:opacity-90",
    },
    Aceptado: {
      variant: "secondary" as const,
      className: "status-accepted-bg status-accepted-text hover:opacity-90",
    },
    Pendiente: {
      variant: "secondary" as const,
      className: "status-pending-bg status-pending-text hover:opacity-90",
    },
    Rechazado: {
      variant: "destructive" as const,
      className: "status-rejected-bg status-rejected-text hover:opacity-90",
    },
  };

  const config = statusConfig[localOrder.status];
  const orderDate = new Date(localOrder.date).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleRatingSuccess = (ratingValue: number) => {
    // Actualizar el estado local con el nuevo rating
    const newRating: OrderRating = {
      value: ratingValue,
      createdAt: new Date().toISOString(),
    };
    setLocalOrder({ ...localOrder, rating: newRating });
  };

  const handleReportSuccess = (reportId: string, category: string) => {
    // Agregar el nuevo reporte al array de reportes
    const newReport: OrderReport = {
      id: reportId,
      category: category as OrderReport["category"],
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const updatedReports = [...(localOrder.reports || []), newReport];
    setLocalOrder({ ...localOrder, reports: updatedReports });
  };

  // Determinar qué botones mostrar usando las funciones helper
  const showRateButton = canRate(localOrder);
  const showReportButton = canReport(localOrder);

  return (
    <Card className="overflow-hidden shadow-md transition-all hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left Section */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="heading-sm text-primary">
                {localOrder.providerName}
              </h3>
              <Badge variant={config.variant} className={config.className}>
                {localOrder.status}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-secondary">
                <Calendar className="h-4 w-4" />
                <span className="body-sm">{orderDate}</span>
              </div>

              <div className="flex items-center gap-2 text-secondary">
                <span className="body-sm font-medium">
                  Categoría: {localOrder.serviceName}
                </span>
              </div>

              <div className="flex items-center gap-2 text-primary">
                <DollarSign className="h-4 w-4" />
                <span className="body-base font-semibold">
                  ${localOrder.price.toLocaleString("es-MX")} MXN
                </span>
              </div>

              {localOrder.rating && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < localOrder.rating!.value
                            ? "fill-[var(--color-warning)] text-[var(--color-warning)]"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="body-sm text-secondary">
                    {localOrder.rating.value}.0
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex flex-col gap-2 md:items-end">
            {/* Botón Ver Detalles - Siempre visible */}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10"
              onClick={() => setIsDetailsModalOpen(true)}
            >
              <Eye className="h-4 w-4" />
              Ver Detalles
            </Button>

            {/* Botón de Calificar (solo para completados sin rating) */}
            {showRateButton && (
              <Button
                size="sm"
                className="gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90"
                onClick={() => setIsRateModalOpen(true)}
              >
                <Star className="h-4 w-4" />
                Calificar Servicio
              </Button>
            )}

            {/* Botón de Reportar */}
            {showReportButton && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-[var(--color-error)] border-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                onClick={() => setIsReportModalOpen(true)}
              >
                <Flag className="h-4 w-4" />
                {localOrder.status === "En curso"
                  ? "Reportar Problema"
                  : "Reportar"}
              </Button>
            )}

            {/* Mensaje si tiene reportes activos */}
            {hasActiveReports(localOrder) && (
              <div className="flex items-center gap-2 text-[var(--color-warning)] body-sm">
                <Flag className="h-4 w-4" />
                <span>Reporte en revisión</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Modales */}
      <OrderDetailsModal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        order={localOrder}
      />

      <RateServiceModal
        open={isRateModalOpen}
        onOpenChange={setIsRateModalOpen}
        order={localOrder}
        onSuccess={handleRatingSuccess}
      />

      <ReportServiceModal
        open={isReportModalOpen}
        onOpenChange={setIsReportModalOpen}
        order={localOrder}
        onSuccess={handleReportSuccess}
      />
    </Card>
  );
}
