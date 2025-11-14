"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import CategoryCard from "@/components/CategoryCard";
import Section, { SectionHeader } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 6;

export default function CategoriesSection() {
  const { categories, loading, error } = useCategories();
  const [currentPage, setCurrentPage] = useState(1);

  // Calcular paginación
  const totalPages = Math.ceil(categories.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCategories = categories.slice(startIndex, endIndex);

  // Navegación de páginas
  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll suave al inicio de la sección
    const categoriesSection = document.getElementById("categories-section");
    if (categoriesSection) {
      categoriesSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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
    <Section size="md" background="secondary" id="categories-section">
      <SectionHeader
        title="Categorías Destacadas"
        subtitle="Encuentra rápidamente el servicio que necesitas explorando nuestras categorías más populares"
      />

      {/* Categories Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {paginatedCategories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--color-border-light)] pt-6 mt-8">
          <p className="body-sm text-secondary">
            Mostrando {startIndex + 1} - {Math.min(endIndex, categories.length)}{" "}
            de {categories.length} categorías
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  // Mostrar solo 3 páginas: anterior, actual, y siguiente
                  if (page >= currentPage - 1 && page <= currentPage + 1) {
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(page)}
                        className={
                          currentPage === page
                            ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] min-w-[2.5rem]"
                            : "min-w-[2.5rem]"
                        }
                      >
                        {page}
                      </Button>
                    );
                  }
                  return null;
                }
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="gap-1"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Section>
  );
}
