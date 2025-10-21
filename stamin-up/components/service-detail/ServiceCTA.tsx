import { Button } from "@/components/ui/button";
import { MessageCircle, Sparkles } from "lucide-react";

interface ServiceCTAProps {
  onContactClick: () => void;
}

/**
 * CTA final para convertir al usuario
 * Invita a contactar con especialistas
 * NO SE USA ACTUALMENTE.
 */
export function ServiceCTA({ onContactClick }: ServiceCTAProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white rounded-2xl p-8 md:p-12 shadow-xl">
      {/* Decoración de fondo */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />

      {/* Contenido */}
      <div className="relative z-10 text-center max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-4">
          <MessageCircle className="w-12 h-12 md:w-16 md:h-16 opacity-90" />
          <Sparkles className="w-8 h-8 text-yellow-300" />
        </div>

        <h2 className="heading-lg text-white mb-3">
          ¿Necesitas ayuda con este servicio?
        </h2>

        <p className="body-lg text-white/90 mb-8 leading-relaxed">
          Nuestros especialistas están listos para atenderte y resolver todas
          tus dudas. Obtén una cotización personalizada sin compromiso en menos
          de 24 horas.
        </p>

        <Button
          size="lg"
          onClick={onContactClick}
          className="bg-white text-primary hover:bg-white/90 hover:scale-105 transition-all font-semibold text-lg px-8 py-6 rounded-xl shadow-lg"
        >
          Hablar con un especialista
        </Button>

        <p className="body-sm text-white/70 mt-4">
          Respuesta garantizada en menos de 24 horas
        </p>
      </div>
    </div>
  );
}
