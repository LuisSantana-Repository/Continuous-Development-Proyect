"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import RequestCard from "./RequestCard";
import type { ProviderRequest } from "@/types";

interface RequestsListProps {
  requests: ProviderRequest[];
  loading: boolean;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onEdit: (requestId: string) => void;
  onOpenChat: (requestId: string) => void;
  onReport: (requestId: string) => void;
  onViewDetail: (requestId: string) => void;
  onStartWork: (requestId: string) => void;
  onCompleteWork: (requestId: string) => void;
}

export default function RequestsList({
  requests,
  loading,
  onAccept,
  onReject,
  onEdit,
  onOpenChat,
  onReport,
  onViewDetail,
  onStartWork,
  onCompleteWork,
}: RequestsListProps) {
  const [filter, setFilter] = useState<string>("all");

  // Ordenar por fecha de creación (más recientes primero)
  const sortedRequests = [...requests].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Filtrar por estado
  const filteredRequests =
    filter === "all"
      ? sortedRequests
      : sortedRequests.filter((req) => req.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg body-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-[var(--color-primary)] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Todas ({requests.length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-lg body-sm font-medium transition-colors ${
            filter === "pending"
              ? "bg-[var(--color-primary)] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Pendientes ({requests.filter((r) => r.status === "pending").length})
        </button>
        <button
          onClick={() => setFilter("accepted")}
          className={`px-4 py-2 rounded-lg body-sm font-medium transition-colors ${
            filter === "accepted"
              ? "bg-[var(--color-primary)] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Aceptadas ({requests.filter((r) => r.status === "accepted").length})
        </button>
        <button
          onClick={() => setFilter("in_progress")}
          className={`px-4 py-2 rounded-lg body-sm font-medium transition-colors ${
            filter === "in_progress"
              ? "bg-[var(--color-primary)] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          En Proceso (
          {requests.filter((r) => r.status === "in_progress").length})
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`px-4 py-2 rounded-lg body-sm font-medium transition-colors ${
            filter === "completed"
              ? "bg-[var(--color-primary)] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Completadas ({requests.filter((r) => r.status === "completed").length}
          )
        </button>
      </div>

      {/* Lista de Requests */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <p className="body-base text-secondary">
            No hay solicitudes {filter !== "all" ? `en este estado` : ""}.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => (
            <RequestCard
              key={request.requestId}
              request={request}
              onAccept={onAccept}
              onReject={onReject}
              onEdit={onEdit}
              onOpenChat={onOpenChat}
              onReport={onReport}
              onViewDetail={onViewDetail}
              onStartWork={onStartWork}
              onCompleteWork={onCompleteWork}
            />
          ))}
        </div>
      )}
    </div>
  );
}
