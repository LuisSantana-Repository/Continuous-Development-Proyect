"use client";

import { useState } from "react";
import { Package, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrderCard from "./OrderCard";
import type { Order } from "@/types";

interface OrdersListProps {
  orders: Order[];
  isLoading: boolean;
}

type StatusFilter =
  | "all"
  | "Pendiente"
  | "Aceptado"
  | "En curso"
  | "Completado"
  | "Rechazado";

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "Todos",
  Pendiente: "Pendientes",
  Aceptado: "Aceptados",
  "En curso": "En Progreso",
  Completado: "Completados",
  Rechazado: "Rechazados",
};

const ITEMS_PER_PAGE = 5;

export default function OrdersList({ orders, isLoading }: OrdersListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrar órdenes por estado
  const filteredOrders = orders.filter((order) => {
    if (statusFilter === "all") return true;
    return order.status === statusFilter;
  });

  // Calcular paginación
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambia el filtro
  const handleFilterChange = (filter: StatusFilter) => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  // Navegación de páginas
  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll suave al inicio de la lista
    const ordersSection = document.getElementById("orders-section");
    if (ordersSection) {
      ordersSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-[var(--color-background-secondary)] p-12 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md">
          <Package className="h-10 w-10 text-muted" />
        </div>
        <h3 className="heading-sm text-primary mb-2">
          No hay servicios solicitados
        </h3>
        <p className="body-base text-secondary max-w-md">
          Aún no has solicitado ningún servicio. Explora nuestra plataforma y
          encuentra el profesional perfecto para tu próximo proyecto.
        </p>
      </div>
    );
  }

  return (
    <div id="orders-section" className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((filter) => (
          <Button
            key={filter}
            variant={statusFilter === filter ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange(filter)}
            className={
              statusFilter === filter
                ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)]"
            }
          >
            {STATUS_LABELS[filter]}
            {filter === "all" && ` (${orders.length})`}
            {filter !== "all" &&
              (() => {
                const count = orders.filter((o) => o.status === filter).length;
                return count > 0 ? ` (${count})` : "";
              })()}
          </Button>
        ))}
      </div>

      {/* Lista de órdenes */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-[var(--color-background-secondary)] p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md">
            <Package className="h-8 w-8 text-muted" />
          </div>
          <h3 className="heading-sm text-primary mb-2">
            No hay servicios con este estado
          </h3>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[var(--color-border-light)] pt-4">
              <p className="body-sm text-secondary">
                Mostrando {startIndex + 1} -{" "}
                {Math.min(endIndex, filteredOrders.length)} de{" "}
                {filteredOrders.length} servicios
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
