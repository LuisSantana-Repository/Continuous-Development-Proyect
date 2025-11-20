import Link from "next/link";
import Image from "next/image";
import { Service } from "@/types";
import { Star, User } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface ServiceCardProps {
  service: Service;
  priority?: boolean;
}

export default function ServiceCard({
  service,
  priority = false,
}: ServiceCardProps) {
  // json: priceType: str
  const getPriceDisplay = () => {
    if (service.priceType === "hourly") {
      return `$${service.price}/hora`;
    }
    return `$${service.price}`;
  };

  return (
    <Link href={`/services/${service.id}`}>
      <Card className="group h-full overflow-hidden transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-1 rounded-2xl p-0">
        {/* Image */}
        <div className="relative h-48 w-full overflow-hidden bg-[var(--color-background-secondary)]">
          {(() => {
            const src = service.imageUrl || "";
            // If it's a relative API path, prefix with configured API host
            const apiBaseRaw = process.env.NEXT_PUBLIC_API_URL || "";
            const apiBase = apiBaseRaw
              .replace(/\/api\/?$/, "")
              .replace(/\/$/, "");
            const resolvedSrc =
              src.startsWith("/api/") && apiBase ? `${apiBase}${src}` : src;

            return (
              <Image
                src={resolvedSrc}
                alt={service.title}
                fill
                unoptimized
                priority={priority}
                className="object-cover transition-transform duration-200 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            );
          })()}
          {service.featured && (
            <div className="absolute right-2 top-2 rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-white">
              Destacado
            </div>
          )}
        </div>

        <CardContent className="px-4 py-3">
          {/* Category */}
          <div className="mb-1.5">
            <span className="body-sm font-medium text-[var(--color-text-muted)]">
              {service.category.name}
            </span>
          </div>

          {/* Title */}
          <h3 className="heading-sm mb-1.5 text-[var(--color-primary)] line-clamp-2 group-hover:text-[var(--color-primary-dark)]">
            {service.title}
          </h3>

          {/* Provider */}
          <div className="mb-1.5 flex items-center space-x-2">
            <div className="relative h-6 w-6 overflow-hidden rounded-full bg-[var(--color-background-secondary)] flex items-center justify-center">
              {service.provider.avatarUrl ? (
                (() => {
                  const src = service.provider.avatarUrl || "";
                  const apiBaseRaw = process.env.NEXT_PUBLIC_API_URL || "";
                  const apiBase = apiBaseRaw
                    .replace(/\/api\/?$/, "")
                    .replace(/\/$/, "");
                  const resolved =
                    src.startsWith("/api/") && apiBase
                      ? `${apiBase}${src}`
                      : src;
                  return (
                    <Image
                      src={resolved}
                      alt={service.provider.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  );
                })()
              ) : (
                <User
                  className="h-4 w-4 text-white"
                  style={{
                    backgroundColor: "var(--color-primary)",
                    borderRadius: "50%",
                    padding: "4px",
                    width: "100%",
                    height: "100%",
                  }}
                />
              )}
            </div>
            <span className="body-sm text-[var(--color-text-secondary)]">
              {service.provider.name}
            </span>
            {service.provider.verified && (
              <span
                className="text-[var(--color-primary-light)]"
                title="Verificado"
              ></span>
            )}
          </div>

          {/* Rating and Reviews */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="body-sm font-semibold">
                {service.rating > 0 ? service.rating.toFixed(1) : "N/A"}
              </span>
            </div>
            <span className="body-sm text-[var(--color-text-muted)]">
              ({service.reviewCount}{" "}
              {service.reviewCount === 1 ? "reseña" : "reseñas"})
            </span>
          </div>
        </CardContent>

        <CardFooter className="border-t border-[var(--color-border-light)] bg-[var(--color-background-secondary)] px-4 py-3">
          <div className="flex w-full items-center justify-between">
            <div>
              <p className="body-sm text-[var(--color-text-muted)]">Precio</p>
              <p className="heading-sm text-[var(--color-primary)]">
                {getPriceDisplay()}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--color-primary)] px-4 py-2 body-sm font-semibold text-white transition-colors group-hover:bg-[var(--color-primary-dark)]">
              Ver detalles
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
