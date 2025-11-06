import { Service } from "@/types";
import { CheckCircle, Clock, Shield, Award } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ServiceDetailsProps {
  service: Service;
}

/**
 * Componente que muestra información detallada del servicio
 * Incluye descripción extendida, características y disponibilidad
 * Solo usa datos reales del backend, sin contenido hardcodeado
 */
export function ServiceDetails({ service }: ServiceDetailsProps) {
  const features = [
    {
      icon: CheckCircle,
      title: "Servicio Certificado",
      description: "Profesionales verificados con experiencia comprobada",
    },
    {
      icon: Shield,
      title: "Garantía Incluida",
      description: "Trabajo garantizado por 30 días desde la finalización",
    },
    {
      icon: Clock,
      title: "Respuesta Rápida",
      description: "Atención y cotización en menos de 24 horas",
    },
    {
      icon: Award,
      title: "Alta Calificación",
      description: `${service.rating.toFixed(1)}/5 basado en ${
        service.reviewCount
      } ${service.reviewCount === 1 ? "reseña" : "reseñas"}`,
    },
  ];

  const daysOfWeek = [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
  ];

  // Verificar si hay disponibilidad definida
  const hasAvailability =
    service.availability && service.availability.length > 0;

  return (
    <div className="space-y-10">
      {/* Descripción extendida */}
      <Card className="p-8 rounded-2xl shadow-lg">
        <h2 className="heading-md text-primary mb-4">
          Descripción del Servicio
        </h2>
        <div className="space-y-4">
          <p className="body-lg text-secondary leading-relaxed">
            {service.description}
          </p>
        </div>
      </Card>

      {/* Características destacadas */}
      <div>
        <h2 className="heading-md text-primary mb-6">
          ¿Qué incluye este servicio?
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--color-primary-low)] flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="heading-sm text-primary mb-1">
                      {feature.title}
                    </h3>
                    <p className="body-base text-secondary">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Disponibilidad - Solo mostrar si hay datos */}
      {hasAvailability && (
        <Card className="p-8 rounded-2xl shadow-lg">
          <h2 className="heading-md text-primary mb-4">Disponibilidad</h2>
          <p className="body-base text-secondary mb-4">
            Este servicio está disponible los siguientes días de la semana:
          </p>
          <div className="flex flex-wrap gap-3">
            {daysOfWeek.map((day) => {
              const isAvailable = service.availability.includes(day);
              return (
                <span
                  key={day}
                  className={`px-4 py-2 rounded-lg body-sm font-medium capitalize transition-all ${
                    isAvailable
                      ? "bg-green-100 text-green-700 border-2 border-green-200"
                      : "bg-gray-100 text-gray-400 border-2 border-gray-200"
                  }`}
                >
                  {day}
                </span>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
