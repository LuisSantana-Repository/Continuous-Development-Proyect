import React from "react";

interface AvatarProps {
  src?: string | null;
  alt: string;
  fallbackText: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-sm",
  md: "w-12 h-12 text-base",
  lg: "w-16 h-16 text-xl",
  xl: "w-24 h-24 text-3xl",
};

export function Avatar({
  src,
  alt,
  fallbackText,
  size = "md",
  className = "",
}: AvatarProps) {
  const firstLetter = fallbackText.charAt(0).toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center font-bold text-white ${className}`}
    >
      {firstLetter}
    </div>
  );
}
