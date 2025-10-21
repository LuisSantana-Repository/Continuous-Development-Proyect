"use client";

import { Calendar as CalendarIcon, Clock, Ban, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CalendarData } from "@/types";

interface CalendarPlaceholderProps {
  calendar: CalendarData | null;
  loading: boolean;
}

const DAYS_ES = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

export default function CalendarPlaceholder({
  calendar,
  loading,
}: CalendarPlaceholderProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!calendar) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="body-sm text-secondary">
            No se pudo cargar el calendario.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Nota de "Próximamente" */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <p className="body-sm text-blue-700">Vista previa del calendario</p>
        </CardContent>
      </Card>

      {/* Disponibilidad Semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horario de Disponibilidad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DAYS_ES.map(({ key, label }) => {
            const dayData =
              calendar.availability[key as keyof typeof calendar.availability];
            return (
              <div
                key={key}
                className="flex items-start justify-between pb-3 border-b last:border-b-0"
              >
                <div className="flex-1">
                  <p className="body-sm font-medium text-primary">{label}</p>
                  {dayData.enabled ? (
                    <div className="mt-1 space-y-1">
                      {dayData.slots.map((slot, idx) => (
                        <p key={idx} className="body-sm text-secondary">
                          {slot.start} - {slot.end}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="body-sm text-secondary italic mt-1">
                      No disponible
                    </p>
                  )}
                </div>
                <Badge
                  className={
                    dayData.enabled
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }
                >
                  {dayData.enabled ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Bloques de Tiempo Bloqueados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5" />
              Bloques No Disponibles
            </CardTitle>
            <Button size="sm" disabled className="gap-2 opacity-50">
              <Plus className="h-4 w-4" />
              Añadir
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {calendar.blockedSlots.length === 0 ? (
            <p className="body-sm text-secondary text-center py-4">
              No hay bloques no disponibles configurados.
            </p>
          ) : (
            <div className="space-y-3">
              {calendar.blockedSlots.map((block) => (
                <div
                  key={block.id}
                  className="flex items-start justify-between p-3 rounded-lg bg-gray-50 border"
                >
                  <div className="flex-1">
                    <p className="body-sm font-medium text-primary">
                      {new Date(block.date).toLocaleDateString("es-MX", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="body-sm text-secondary">
                      {block.start} - {block.end}
                    </p>
                    <p className="body-sm text-secondary italic mt-1">
                      {block.reason}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled
                      className="opacity-50"
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled
                      className="opacity-50 text-red-600"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botones de Gestión (Deshabilitados) */}
      <div className="flex gap-2">
        <Button disabled className="flex-1 opacity-50">
          Editar Horario
        </Button>
        <Button disabled variant="outline" className="flex-1 opacity-50">
          Configuración Avanzada
        </Button>
      </div>
    </div>
  );
}
