"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProviderCalendar } from "@/hooks/useProviderCalendar";
import type { CalendarEvent } from "@/types";

interface ProviderCalendarProps {
  providerId: number;
}

const DAYS_OF_WEEK = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default function ProviderCalendar({
  providerId,
}: ProviderCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Formato YYYY-MM para el backend
  const monthString = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }, [currentDate]);

  const { calendarData, loading, error } = useProviderCalendar(
    providerId,
    monthString
  );

  // Calcular días del mes
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Días del mes
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentDate]);

  // Obtener eventos para un día específico
  const getEventsForDay = (date: Date): CalendarEvent[] => {
    if (!calendarData?.events) return [];

    const dateString = date.toISOString().split("T")[0];
    return calendarData.events.filter((event) => event.date === dateString);
  };

  // Navegar entre meses
  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(new Date());
  };

  // Verificar si es hoy
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Verificar si está seleccionado
  const isSelected = (date: Date): boolean => {
    if (!selectedDay) return false;
    return (
      date.getDate() === selectedDay.getDate() &&
      date.getMonth() === selectedDay.getMonth() &&
      date.getFullYear() === selectedDay.getFullYear()
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendario de Servicios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendario de Servicios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="body-sm text-red-600">Error al cargar el calendario</p>
        </CardContent>
      </Card>
    );
  }

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <div className="space-y-4">
      {/* Calendario Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {MONTHS_ES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={goToToday}>
                Hoy
              </Button>
              <Button size="sm" variant="outline" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Encabezados de días */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="text-center py-2">
                <span className="body-sm font-medium text-secondary">
                  {day}
                </span>
              </div>
            ))}
          </div>

          {/* Días del calendario */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const events = getEventsForDay(day);
              const hasEvents = events.length > 0;
              const dayIsToday = isToday(day);
              const dayIsSelected = isSelected(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={`
                    aspect-square p-2 rounded-lg border transition-all
                    hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5
                    ${
                      dayIsToday
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                        : "border-gray-200"
                    }
                    ${dayIsSelected ? "ring-2 ring-[var(--color-primary)]" : ""}
                  `}
                >
                  <div className="flex flex-col items-center justify-between h-full">
                    <span
                      className={`body-sm ${
                        dayIsToday
                          ? "font-bold text-[var(--color-primary)]"
                          : "text-primary"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {hasEvents && (
                      <div className="flex gap-0.5">
                        {events.slice(0, 3).map((event, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              event.status === "pending"
                                ? "status-pending"
                                : event.status === "accepted"
                                ? "status-accepted"
                                : event.status === "in_progress"
                                ? "status-in-progress"
                                : "bg-gray-500"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full status-pending" />
              <span className="body-sm text-secondary">Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full status-accepted" />
              <span className="body-sm text-secondary">Aceptado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full status-in-progress" />
              <span className="body-sm text-secondary">En Progreso</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panel de Eventos del Día Seleccionado */}
      {selectedDay && (
        <Card>
          <CardHeader>
            <CardTitle className="body-base font-semibold">
              {selectedDay.toLocaleDateString("es-MX", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDayEvents.length === 0 ? (
              <p className="body-sm text-secondary text-center py-4">
                No hay servicios programados para este día
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 rounded-lg border bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="body-base font-semibold text-primary">
                          {event.serviceName}
                        </h4>
                        <p className="body-sm text-secondary">
                          Cliente: {event.clientName}
                        </p>
                      </div>
                      <Badge
                        className={
                          event.status === "pending"
                            ? "status-pending-bg status-pending-text"
                            : event.status === "accepted"
                            ? "status-accepted-bg status-accepted-text"
                            : event.status === "in_progress"
                            ? "status-in-progress-bg status-in-progress-text"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {event.status === "pending"
                          ? "Pendiente"
                          : event.status === "accepted"
                          ? "Aceptado"
                          : event.status === "in_progress"
                          ? "En Progreso"
                          : event.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-secondary">
                      <CalendarIcon className="h-4 w-4" />
                      <span className="body-sm">
                        {event.startTime} - {event.endTime}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resumen de Estadísticas */}
      {calendarData?.summary && (
        <Card>
          <CardHeader>
            <CardTitle className="body-base font-semibold">
              Resumen del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <p className="heading-lg text-[var(--color-primary)]">
                  {calendarData.summary.totalRequests}
                </p>
                <p className="body-sm text-secondary">Total Servicios</p>
              </div>
              <div className="text-center p-3 rounded-lg status-pending-bg">
                <p className="heading-lg status-pending-text">
                  {calendarData.summary.pendingRequests}
                </p>
                <p className="body-sm text-secondary">Pendientes</p>
              </div>
              <div className="text-center p-3 rounded-lg status-accepted-bg">
                <p className="heading-lg status-accepted-text">
                  {calendarData.summary.acceptedRequests}
                </p>
                <p className="body-sm text-secondary">Aceptados</p>
              </div>
              <div className="text-center p-3 rounded-lg status-in-progress-bg">
                <p className="heading-lg status-in-progress-text">
                  {calendarData.summary.inProgressRequests}
                </p>
                <p className="body-sm text-secondary">En Progreso</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
