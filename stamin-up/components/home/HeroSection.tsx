"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Section from "@/components/layout/Section";

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Type script function to realice the search
  //  - no funciona al 100 xd. Mejorar despues
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/services?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <Section size="lg" background="gradient" className="relative text-white">
      {/* Background Main Blue */}
      <div className="absolute inset-0 bg-[var(--color-primary)] opacity-10"></div>

      <div className="relative mx-auto max-w-4xl text-center">
        {/* Title */}
        <h1 className="heading-xl mb-6 leading-tight">
          Encuentra el profesional ideal para tu hogar{" "}
          <span style={{ color: "var(--color-primary-low)" }}>en minutos</span>
        </h1>

        {/* Subtitle */}
        <p className="body-lg mb-8 text-blue-100">
          Solicita servicios de plomería, electricidad, limpieza y más, sin
          complicaciones.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="¿Qué servicio necesitas?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 w-full rounded-2xl border-0 bg-white pl-12 pr-4 text-gray-900 shadow-lg focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-14 rounded-2xl bg-white px-8 text-[var(--color-primary)] shadow-lg hover:bg-gray-100"
            >
              Buscar
            </Button>
          </div>
        </form>

        {/* Secondary CTA */}
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.push("/services")}
          className="rounded-2xl border-2 border-white bg-transparent text-white hover:bg-white hover:text-[var(--color-primary)]"
        >
          Explorar servicios populares
        </Button>
      </div>
    </Section>
  );
}
