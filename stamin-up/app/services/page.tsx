"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ServiceCard from "@/components/ServiceCard";
import { Service } from "@/types";
import apiClient from "@/lib/apiClient";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function ServicesContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";
  const category = searchParams.get("category") || "";

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(query);

  // usamos hook
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const results = await apiClient.searchServices({
          query,
          category,
        });
        setServices(results);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [query, category]);

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="app-container">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold text-[#012c5b] md:text-4xl">
            {category ? `Servicios de ${category}` : "Todos los servicios"}
          </h1>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar servicios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-12"
              />
            </div>
            <Button size="lg" className="h-12 bg-[#012c5b] hover:bg-[#004a9a]">
              Buscar
            </Button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-96 animate-pulse rounded-2xl bg-gray-200"
              />
            ))}
          </div>
        ) : services.length > 0 ? (
          <>
            <p className="mb-6 text-gray-600">
              Mostrando {services.length} resultado
              {services.length !== 1 ? "s" : ""}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </>
        ) : (
          <div className="py-20 text-center">
            <p className="text-lg text-gray-600">
              No se encontraron servicios para tu búsqueda.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 py-12">
          <div className="app-container">
            <div className="mb-8">
              <div className="mb-4 h-10 w-64 animate-pulse rounded bg-gray-200" />
              <div className="h-12 w-full animate-pulse rounded bg-gray-200" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-96 animate-pulse rounded-2xl bg-gray-200"
                />
              ))}
            </div>
          </div>
        </main>
      }
    >
      <ServicesContent />
    </Suspense>
  );
}
