"use client";

import { useFeaturedServices } from "@/hooks/useServices";
import ServiceCard from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Section, { SectionHeader } from "@/components/layout/Section";

export default function FeaturedServicesSection() {
  // info from data layer
  const { services, loading, error } = useFeaturedServices();

  if (loading) {
    return (
      <Section size="md" background="white">
        <SectionHeader title="Servicios Destacados" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-96 animate-pulse rounded-2xl bg-gray-200"
            />
          ))}
        </div>
      </Section>
    );
  }

  if (error) {
    return (
      <Section size="md" background="white">
        <div className="text-center text-[var(--color-error)]">{error}</div>
      </Section>
    );
  }

  return (
    <Section size="md" background="white">
      <SectionHeader
        title="Servicios Destacados"
        subtitle="Descubre los servicios más solicitados y mejor valorados por nuestra comunidad"
      />

      {/* Services Grid */}
      <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {services.map((service, index) => (
          <ServiceCard
            key={service.id}
            service={service}
            priority={index === 0}
          />
        ))}
      </div>

      {/* View All Button */}
      <div className="text-center">
        <Link href="/services">
          <Button
            size="lg"
            className="rounded-2xl bg-[var(--color-primary)] px-8 text-white hover:bg-[var(--color-primary-dark)]"
          >
            Ver todos los servicios
          </Button>
        </Link>
      </div>
    </Section>
  );
}
