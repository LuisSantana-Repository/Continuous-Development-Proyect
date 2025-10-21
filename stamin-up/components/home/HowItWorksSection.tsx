import { FileText, MessageCircle, CheckCircle } from "lucide-react";
import Section, { SectionHeader } from "@/components/layout/Section";

export default function HowItWorksSection() {
  const steps = [
    {
      icon: FileText,
      title: "Realiza tu request",
      description:
        "Describe qué necesitas y cuándo lo necesitas. Es rápido y gratuito.",
    },
    {
      icon: MessageCircle,
      title: "Comienza un chat",
      description:
        "Los proveedores calificados te enviarán sus presupuestos por medio del chat.",
    },
    {
      icon: CheckCircle,
      title: "Contrata con confianza",
      description:
        "Revisa perfiles, reseñas y contrata al mejor profesional para tu proyecto.",
    },
  ];

  return (
    <Section size="md" background="white">
      <SectionHeader
        title="¿Cómo funciona?"
        subtitle="Conectamos clientes con profesionales verificados en tres simples pasos"
        className="mb-16"
      />

      {/* Steps Grid */}
      <div className="grid gap-8 md:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={index} className="relative text-center">
              {/* Connector Line (hidden on mobile) */}
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 top-12 hidden h-1 w-full -translate-y-1/2 md:block">
                  <div className="h-full w-full border-t-2 border-dashed border- --color-border" />
                </div>
              )}

              {/* Step Number Badge */}
              <div className="relative z-10 mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-primary)] shadow-lg">
                <Icon className="h-12 w-12 text-white" />
              </div>

              {/* Step Content */}
              <div className="relative z-10 rounded-2xl bg-white p-6 shadow-md">
                <div className="body-sm mb-2 font-semibold text-[var(--color-primary-dark)]">
                  Paso {index + 1}
                </div>
                <h3 className="heading-sm mb-3 text-[var(--color-primary)]">
                  {step.title}
                </h3>
                <p className="body-base text-[var(--color-text-secondary)]">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
