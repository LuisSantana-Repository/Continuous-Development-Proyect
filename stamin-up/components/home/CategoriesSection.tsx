"use client";

import { useCategories } from "@/hooks/useCategories";
import CategoryCard from "@/components/CategoryCard";
import Section, { SectionHeader } from "@/components/layout/Section";

export default function CategoriesSection() {
  const { categories, loading, error } = useCategories();

  if (loading) {
    return (
      <Section size="md" background="secondary">
        <SectionHeader title="Categorías Destacadas" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl bg-gray-200"
            />
          ))}
        </div>
      </Section>
    );
  }

  if (error) {
    return (
      <Section size="md" background="secondary">
        <div className="text-center text-[var(--color-error)]">{error}</div>
      </Section>
    );
  }

  return (
    <Section size="md" background="secondary">
      <SectionHeader
        title="Categorías Destacadas"
        subtitle="Encuentra rápidamente el servicio que necesitas explorando nuestras categorías más populares"
      />

      {/* Categories Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </Section>
  );
}
