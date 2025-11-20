"use client";

import { useState } from "react";
import {
  Check,
  X,
  MapPin,
  DollarSign,
  MessageCircle,
  Flag,
  Edit,
  Clock,
  CheckCircle,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import type { ProviderRequest } from "@/types";

interface RequestCardProps {
  request: ProviderRequest;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onEdit: (requestId: string) => void;
  onOpenChat: (requestId: string) => void;
  onReport: (requestId: string) => void;
  onViewDetail: (requestId: string) => void;
  onStartWork: (requestId: string) => void;
  onCompleteWork: (requestId: string) => void;
  onRateClient: (requestId: string) => void;
}

const STATUS_CONFIG = {
  pending: {
    label: "Pendiente",
    color: "status-pending-bg status-pending-text",
  },
  accepted: {
    label: "Aceptada",
    color: "status-accepted-bg status-accepted-text",
  },
  rejected: {
    label: "Rechazada",
    color: "status-rejected-bg status-rejected-text",
  },
  in_progress: {
    label: "En Proceso",
    color: "status-in-progress-bg status-in-progress-text",
  },
  completed: {
    label: "Completada",
    color: "status-completed-bg status-completed-text",
  },
  cancelled: { label: "Cancelada", color: "bg-gray-100 text-gray-800" },
};

export default function RequestCard({
  request,
  onAccept,
  onReject,
  onEdit,
  onOpenChat,
  onReport,
  onViewDetail,
  onStartWork,
  onCompleteWork,
  onRateClient,
}: RequestCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = STATUS_CONFIG[request.status];

  // Usar los flags que vienen en el objeto request
  const hasReview = request.hasProviderReview || false;
  const hasReport = request.hasProviderReport || false;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 50) return address;
    return address.substring(0, 50) + "...";
  };

  const canAccept = request.status === "pending";
  const canReject = request.status === "pending";
  const canStartWork = request.status === "accepted";
  const canComplete = request.status === "in_progress";

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Información Principal */}
          <div className="flex-1 min-w-0">
            <h3 className="body-lg font-semibold text-primary truncate">
              {request.serviceName}
            </h3>
            <p className="body-sm text-secondary">{request.userName}</p>
          </div>

          {/* Badge de Estado */}
          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Fecha Preferida */}
        <div className="flex items-center gap-2 text-secondary">
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span className="body-sm">{formatDate(request.preferredDate)}</span>
        </div>

        {/* Dirección */}
        <div className="flex items-start gap-2 text-secondary">
          <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span className="body-sm">{truncateAddress(request.address)}</span>
        </div>

        {/* Monto */}
        <div className="flex items-center gap-2 text-secondary">
          <DollarSign className="h-4 w-4 flex-shrink-0" />
          <span className="body-sm font-semibold text-primary">
            ${request.amount.toLocaleString("es-MX")} MXN
          </span>
        </div>

        {/* Descripción (expandible) */}
        <div className="pt-2 border-t">
          <p
            className={`body-sm text-secondary ${
              !isExpanded ? "line-clamp-2" : ""
            }`}
          >
            {request.description}
          </p>
          {request.description.length > 100 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[var(--color-primary)] body-sm font-medium mt-1 hover:underline"
            >
              {isExpanded ? "Ver menos" : "Ver más"}
            </button>
          )}
        </div>

        {/* Razón de Rechazo (si existe) */}
        {request.status === "rejected" && request.rejectionReason && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="body-sm text-red-800">
              <strong>Motivo de rechazo:</strong> {request.rejectionReason}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-col gap-2 pt-4 border-t">
        {/* Primera fila: Aceptar/Rechazar O Completar */}
        {canAccept && canReject && (
          <div className="flex gap-2 w-full">
            <Button
              size="sm"
              onClick={() => onAccept(request.requestId)}
              className="flex-1 gap-2"
            >
              <Check className="h-4 w-4" />
              Aceptar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(request.requestId)}
              className="flex-1 gap-2 text-red-600 border-red-300 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
              Rechazar
            </Button>
          </div>
        )}

        {canComplete && (
          <Button
            size="sm"
            onClick={() => onCompleteWork(request.requestId)}
            className="w-full gap-2 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4" />
            Marcar como Completado
          </Button>
        )}

        {/* Segunda fila: Ver detalles, Chat (solo pendiente), Editar (solo pendiente), Reportar/Calificar (solo completado) */}
        <div className="flex flex-wrap gap-2 w-full">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onViewDetail(request.requestId)}
            className="gap-2"
          >
            Ver detalles
          </Button>
          {request.status === "pending" && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenChat(request.requestId)}
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Chat
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(request.requestId)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            </>
          )}
          {request.status === "completed" && (
            <>
              {!hasReview && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRateClient(request.requestId)}
                  className="gap-2 border-yellow-400 text-yellow-600 hover:bg-yellow-50"
                >
                  <Star className="h-4 w-4" />
                  Calificar Cliente
                </Button>
              )}
              {!hasReport && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReport(request.requestId)}
                  className="gap-2"
                >
                  <Flag className="h-4 w-4" />
                  Reportar
                </Button>
              )}
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
