"use client";

import { useState } from "react";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const ITEMS_PER_PAGE = 5;

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
  const [currentPage, setCurrentPage] = useState(1);

  // Ordenar por fecha de creación (más recientes primero)
  const sortedRequests = [...requests].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Filtrar por estado
  const filteredRequests =
    filter === "all"
      ? sortedRequests
      : sortedRequests.filter((req) => req.status === filter);

  // Calcular paginación
  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambia el filtro
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  // Navegación de páginas
  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll suave al inicio de la lista
    const requestsSection = document.getElementById("requests-section");
    if (requestsSection) {
      requestsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div id="requests-section" className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => handleFilterChange("all")}
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          className={
            filter === "all"
              ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)]"
          }
        >
          Todas ({requests.length})
        </Button>
        <Button
          onClick={() => handleFilterChange("pending")}
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          className={
            filter === "pending"
              ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)]"
          }
        >
          Pendientes ({requests.filter((r) => r.status === "pending").length})
        </Button>
        <Button
          onClick={() => handleFilterChange("accepted")}
          variant={filter === "accepted" ? "default" : "outline"}
          size="sm"
          className={
            filter === "accepted"
              ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)]"
          }
        >
          Aceptadas ({requests.filter((r) => r.status === "accepted").length})
        </Button>
        <Button
          onClick={() => handleFilterChange("in_progress")}
          variant={filter === "in_progress" ? "default" : "outline"}
          size="sm"
          className={
            filter === "in_progress"
              ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)]"
          }
        >
          En Proceso (
          {requests.filter((r) => r.status === "in_progress").length})
        </Button>
        <Button
          onClick={() => handleFilterChange("completed")}
          variant={filter === "completed" ? "default" : "outline"}
          size="sm"
          className={
            filter === "completed"
              ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)]"
          }
        >
          Completadas ({requests.filter((r) => r.status === "completed").length}
          )
        </Button>
      </div>

      {/* Lista de Requests */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <p className="body-base text-secondary">
            No hay solicitudes {filter !== "all" ? `en este estado` : ""}.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {paginatedRequests.map((request) => (
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

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[var(--color-border-light)] pt-4">
              <p className="body-sm text-secondary">
                Mostrando {startIndex + 1} -{" "}
                {Math.min(endIndex, filteredRequests.length)} de{" "}
                {filteredRequests.length} solicitudes
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => {
                      // Mostrar solo 3 páginas: anterior, actual, y siguiente
                      if (page >= currentPage - 1 && page <= currentPage + 1) {
                        return (
                          <Button
                            key={page}
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => goToPage(page)}
                            className={
                              currentPage === page
                                ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] min-w-[2.5rem]"
                                : "min-w-[2.5rem]"
                            }
                          >
                            {page}
                          </Button>
                        );
                      }
                      return null;
                    }
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="gap-1"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
