import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  children: ReactNode;
  /**
   * Tamaño de padding de la sección
   * xs: 2rem (32px)
   * sm: 3rem (48px)
   * md: 4rem (64px)
   * lg: 5rem (80px)
   */
  size?: "xs" | "sm" | "md" | "lg";
  /**
   * Color de fondo de la sección
   */
  background?: "white" | "secondary" | "primary" | "gradient";
  /**
   * Clases CSS adicionales
   */
  className?: string;
  /**
   * ID para navegación
   */
  id?: string;
  /**
   * Ancho máximo del contenedor
   */
  containerSize?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizeStyles = {
  xs: "py-[var(--section-padding-xs)]",
  sm: "py-[var(--section-padding-sm)]",
  md: "py-[var(--section-padding-md)]",
  lg: "py-[var(--section-padding-lg)]",
};

const backgroundStyles = {
  white: "bg-white",
  secondary: "bg-[var(--color-background-secondary)]",
  primary: "bg-[var(--color-primary)]",
  gradient:
    "bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-primary-dark)] to-[var(--color-primary)]",
};

const containerSizeStyles = {
  sm: "max-w-4xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-full",
};

/**
 * Componente Section reutilizable para mantener consistencia en el layout
 *
 * @example
 * ```tsx
 * <Section size="md" background="secondary">
 *   <SectionHeader
 *     title="Título de la sección"
 *     subtitle="Subtítulo descriptivo"
 *   />
 *   <div>Contenido...</div>
 * </Section>
 * ```
 */
export default function Section({
  children,
  size = "md",
  background = "white",
  className,
  id,
  containerSize = "xl",
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "w-full",
        sizeStyles[size],
        backgroundStyles[background],
        className
      )}
    >
      <div className={cn("app-container", containerSizeStyles[containerSize])}>
        {children}
      </div>
    </section>
  );
}

/**
 * Componente para el encabezado de una sección
 */
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center" | "right";
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}

export function SectionHeader({
  title,
  subtitle,
  align = "center",
  className,
  titleClassName,
  subtitleClassName,
}: SectionHeaderProps) {
  const alignStyles = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <div className={cn("mb-12", alignStyles[align], className)}>
      <h2
        className={cn(
          "heading-lg mb-4 text-[var(--color-primary)]",
          titleClassName
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "body-lg mx-auto max-w-2xl text-[var(--color-text-secondary)]",
            subtitleClassName
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
