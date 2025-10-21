import type { Order } from "@/types";

/**
 * Verifica si una orden tiene calificación
 */
export function hasRating(order: Order): boolean {
  return order.rating !== undefined;
}

/**
 * Verifica si una orden tiene reportes activos (pendientes o en revisión)
 */
export function hasActiveReports(order: Order): boolean {
  if (!order.reports || order.reports.length === 0) return false;
  return order.reports.some(
    (report) => report.status === "pending" || report.status === "in_review"
  );
}

/**
 * Verifica si una orden tiene algún reporte (cualquier estado)
 */
export function hasAnyReport(order: Order): boolean {
  return order.reports !== undefined && order.reports.length > 0;
}

/**
 * Verifica si el usuario puede calificar esta orden
 */
export function canRate(order: Order): boolean {
  return order.status === "Completado" && !hasRating(order);
}

/**
 * Verifica si el usuario puede reportar esta orden
 */
export function canReport(order: Order): boolean {
  const validStatuses = ["Completado", "En curso"];
  return validStatuses.includes(order.status) && !hasActiveReports(order);
}

/**
 * Obtiene el número total de reportes de una orden
 */
export function getReportsCount(order: Order): number {
  return order.reports?.length || 0;
}

/**
 * Obtiene el número de reportes activos (pendientes o en revisión)
 */
export function getActiveReportsCount(order: Order): number {
  if (!order.reports) return 0;
  return order.reports.filter(
    (report) => report.status === "pending" || report.status === "in_review"
  ).length;
}

/**
 * Obtiene el valor de la calificación de una orden
 */
export function getRatingValue(order: Order): number | null {
  return order.rating?.value ?? null;
}

/**
 * Formatea la fecha de creación de una calificación
 */
export function formatRatingDate(order: Order): string | null {
  if (!order.rating) return null;
  
  return new Date(order.rating.createdAt).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
