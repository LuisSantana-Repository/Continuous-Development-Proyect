"use client";

import { useState, useEffect } from "react";
import type { CalendarData } from "@/types";

export function useCalendar() {
  const [calendar, setCalendar] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simular latencia de red
        await new Promise((resolve) => setTimeout(resolve, 200));

        const response = await fetch("/data/calendar.json");
        if (!response.ok) {
          throw new Error("No se pudo cargar el calendario");
        }

        const data = await response.json();
        setCalendar(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Error desconocido al cargar el calendario"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
  }, []);

  return { calendar, loading, error };
}
