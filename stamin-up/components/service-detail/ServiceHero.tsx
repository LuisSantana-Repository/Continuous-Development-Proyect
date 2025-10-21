import { Service } from "@/types";
import { Star, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ServiceHeroProps {
  service: Service;
  onStartRequest: () => void;
}

/**
 * Hero section para la página de detalle de servicio
 * Muestra imagen principal, título, descripción, precio y CTA
 */
export function ServiceHero({ service, onStartRequest }: ServiceHeroProps) {
  const formatPrice = (price: number, priceType: string) => {
    const formattedPrice = new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(price);

    const typeLabels: Record<string, string> = {
      fixed: "Precio fijo",
      hourly: "por hora",
      negotiable: "Negociable",
    };

    return `${formattedPrice} ${
      typeLabels[priceType] !== "Precio fijo" ? typeLabels[priceType] : ""
    }`;
  };

  return (
    <div className="bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary-dark)] text-white">
      <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Imagen del servicio */}
          <div className="order-2 md:order-1">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={service.imageUrl}
                alt={service.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Información del servicio */}
          <div className="order-1 md:order-2 space-y-6">
            {/* Badge de categoría */}
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 px-4 py-1.5 text-sm font-medium">
              <Tag className="w-4 h-4 mr-2" />
              {service.category.name}
            </Badge>

            {/* Título */}
            <h1 className="heading-xl text-white">{service.title}</h1>

            {/* Descripción breve */}
            <p className="body-lg text-white/90 leading-relaxed">
              {service.description}
            </p>

            {/* Rating y reseñas */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                <span className="body-lg font-semibold">
                  {service.rating.toFixed(1)}
                </span>
              </div>
              <span className="body-base text-white/80">
                ({service.reviewCount}{" "}
                {service.reviewCount === 1 ? "reseña" : "reseñas"})
              </span>
            </div>

            {/* Precio */}
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
              {/* <p className="body-sm text-white/70 mb-1">Desde</p> */}
              <p className="heading-md text-white">
                {formatPrice(service.price, service.priceType)}
              </p>
            </div>

            {/* Tags */}
            {service.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {service.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 capitalize"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* CTA Principal */}
            <div className="pt-2">
              <Button
                size="lg"
                onClick={onStartRequest}
                className="w-full md:w-auto bg-white text-primary hover:bg-white/90 hover:scale-105 transition-all font-semibold text-lg px-8 py-6 rounded-xl shadow-lg"
              >
                Comenzar request
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
