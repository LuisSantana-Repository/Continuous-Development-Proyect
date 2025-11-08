"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Phone,
  DollarSign,
  FileText,
  Clock,
  CreditCard,
} from "lucide-react";
import type { Order } from "@/types";

interface OrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
}

export default function OrderDetailsModal({
  open,
  onOpenChange,
  order,
}: OrderDetailsModalProps) {
  const statusConfig = {
    Completado: {
      variant: "default" as const,
      className:
        "bg-[var(--color-success)] text-white hover:bg-[var(--color-success)]/90",
    },
    "En curso": {
      variant: "secondary" as const,
      className:
        "bg-[var(--color-warning)] text-white hover:bg-[var(--color-warning)]/90",
    },
    Aceptado: {
      variant: "secondary" as const,
      className: "bg-blue-500 text-white hover:bg-blue-600",
    },
    Pendiente: {
      variant: "outline" as const,
      className: "border-[var(--color-warning)] text-[var(--color-warning)]",
    },
    Rechazado: {
      variant: "destructive" as const,
      className:
        "bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]/90",
    },
    Cancelado: {
      variant: "destructive" as const,
      className: "bg-gray-500 text-white hover:bg-gray-600",
    },
  };

  const config = statusConfig[order.status];

  const createdDate = new Date(order.date).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const preferredDate = order.preferredDate
    ? new Date(order.preferredDate).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "No especificada";

  const completedDate = order.completedAt
    ? new Date(order.completedAt).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const paymentStatusLabel = {
    pending: "Pendiente",
    paid: "Pagado",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="heading-lg text-primary">
              Detalles del Servicio
            </DialogTitle>
            <Badge variant={config.variant} className={config.className}>
              {order.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4 overflow-y-auto flex-1 pr-2">
          {/* Información del Servicio */}
          <div className="space-y-3">
            <h3 className="heading-sm text-primary border-b pb-2">
              Información del Servicio
            </h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="body-sm font-medium text-secondary">
                    Tipo de Servicio
                  </p>
                  <p className="body-base text-primary">{order.serviceName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="body-sm font-medium text-secondary">
                    Proveedor
                  </p>
                  <p className="body-base text-primary">{order.providerName}</p>
                </div>
              </div>

              {order.description && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="body-sm font-medium text-secondary">
                      Descripción
                    </p>
                    <p className="body-base text-primary whitespace-pre-wrap">
                      {order.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fechas */}
          <div className="space-y-3">
            <h3 className="heading-sm text-primary border-b pb-2">Fechas</h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="body-sm font-medium text-secondary">
                    Fecha de Solicitud
                  </p>
                  <p className="body-base text-primary">{createdDate}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="body-sm font-medium text-secondary">
                    Fecha Preferida para el Servicio
                  </p>
                  <p className="body-base text-primary">{preferredDate}</p>
                </div>
              </div>

              {completedDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="body-sm font-medium text-secondary">
                      Fecha de Completado
                    </p>
                    <p className="body-base text-primary">{completedDate}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ubicación y Contacto */}
          <div className="space-y-3">
            <h3 className="heading-sm text-primary border-b pb-2">
              Ubicación y Contacto
            </h3>
            <div className="grid gap-3">
              {order.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="body-sm font-medium text-secondary">
                      Dirección
                    </p>
                    <p className="body-base text-primary">{order.address}</p>
                  </div>
                </div>
              )}

              {order.contactPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="body-sm font-medium text-secondary">
                      Teléfono de Contacto
                    </p>
                    <p className="body-base text-primary">
                      {order.contactPhone}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Información de Pago */}
          <div className="space-y-3">
            <h3 className="heading-sm text-primary border-b pb-2">Pago</h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="body-sm font-medium text-secondary">Monto</p>
                  <p className="body-lg font-bold text-primary">
                    ${order.price.toLocaleString("es-MX")} MXN
                  </p>
                </div>
              </div>

              {order.paymentStatus && (
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="body-sm font-medium text-secondary">
                      Estado de Pago
                    </p>
                    <Badge
                      variant={
                        order.paymentStatus === "paid" ? "default" : "outline"
                      }
                      className={
                        order.paymentStatus === "paid"
                          ? "bg-[var(--color-success)] text-white"
                          : "border-[var(--color-warning)] text-[var(--color-warning)]"
                      }
                    >
                      {paymentStatusLabel[order.paymentStatus]}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ID de la Solicitud */}
          <div className="space-y-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <p className="body-sm font-medium text-secondary">
              ID de Solicitud
            </p>
            <p className="body-sm text-primary font-mono break-all">
              {order.id}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
