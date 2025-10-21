"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ServiceHero } from "@/components/service-detail/ServiceHero";
import { ServiceDetails } from "@/components/service-detail/ServiceDetails";
import { ReviewsSection } from "@/components/service-detail/ReviewsSection";
import { ServiceCTA } from "@/components/service-detail/ServiceCTA";
import { ServiceDetailSkeleton } from "@/components/service-detail/ServiceDetailSkeleton";
import { ServiceRequestModal } from "@/components/modals/ServiceRequestModal";
import Section from "@/components/layout/Section";
import { useServiceDetail } from "@/hooks/useServiceDetail";
import { useReviews } from "@/hooks/useReviews";
import { AlertCircle } from "lucide-react";

/**
 * Página de detalle de servicio
 * Ruta: /services/[id]
 *
 * Muestra toda la información completa de un servicio:
 * - Hero con imagen y datos principales
 * - Detalles y características
 * - Reseñas y calificaciones
 * - CTA final
 */
export default function ServiceDetailPage() {
  const params = useParams();
  const serviceId = params.id as string;

  // Estado para el modal de solicitud
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Hooks para obtener datos
  const {
    service,
    isLoading: serviceLoading,
    error: serviceError,
  } = useServiceDetail(serviceId);
  const { reviews, isLoading: reviewsLoading } = useReviews(serviceId);

  // Handlers para acciones
  const handleStartRequest = () => {
    setIsRequestModalOpen(true);
  };

  // Estado de carga
  if (serviceLoading) {
    return <ServiceDetailSkeleton />;
  }

  // Estado de error
  if (serviceError) {
    return (
      <Section size="lg">
        <div className="text-center py-16 max-w-2xl mx-auto">
          <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <h2 className="heading-lg text-primary mb-3">
            Error al cargar el servicio
          </h2>
          <p className="body-base text-secondary mb-6">
            {serviceError.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      </Section>
    );
  }

  // Estado de no encontrado
  if (!service) {
    return (
      <Section size="lg">
        <div className="text-center py-16 max-w-2xl mx-auto">
          <AlertCircle className="w-16 h-16 text-warning mx-auto mb-4" />
          <h2 className="heading-lg text-primary mb-3">
            Servicio no encontrado
          </h2>
          <p className="body-base text-secondary mb-6">
            El servicio que buscas no existe o ha sido removido.
          </p>
          <a
            href="/"
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Volver al inicio
          </a>
        </div>
      </Section>
    );
  }

  // Renderizado exitoso
  return (
    <div>
      {/* Hero Section */}
      <ServiceHero service={service} onStartRequest={handleStartRequest} />

      {/* Detalles del servicio */}
      <Section size="sm" background="white">
        <ServiceDetails service={service} />
      </Section>

      {/* Reseñas y calificaciones */}
      <Section size="md" background="secondary">
        <ReviewsSection
          reviews={reviews}
          averageRating={service.rating}
          totalReviews={service.reviewCount}
          isLoading={reviewsLoading}
        />
      </Section>

      {/* CTA final */}
      {/* <Section size="md" background="secondary">
        <ServiceCTA onContactClick={handleContactSpecialist} />
      </Section> */}

      {/* Modal de solicitud de servicio */}
      <ServiceRequestModal
        open={isRequestModalOpen}
        onOpenChange={setIsRequestModalOpen}
        service={service}
        userId="user_123" // TODO: Obtener del contexto de autenticación
      />
    </div>
  );
}
