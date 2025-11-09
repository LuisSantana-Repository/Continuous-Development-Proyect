import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import type { ProviderCalendarData } from '@/types';

export function useProviderCalendar(providerId: number | undefined, month: string) {
  const [calendarData, setCalendarData] = useState<ProviderCalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!providerId) {
      setLoading(false);
      return;
    }

    const fetchCalendar = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.getProviderCalendar(providerId, month);
        setCalendarData(response.data);
      } catch (err) {
        console.error('Error fetching provider calendar:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar el calendario');
        setCalendarData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
  }, [providerId, month]);

  return { calendarData, loading, error };
}
