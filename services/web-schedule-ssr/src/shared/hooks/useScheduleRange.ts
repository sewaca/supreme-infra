'use client';

import { useCallback, useRef, useState } from 'react';
import type { CalendarEvent } from '../../entities/Lesson/model/Lesson';

async function fetchScheduleRange(from: string, to: string): Promise<CalendarEvent[]> {
  try {
    const res = await fetch(`/api/schedule?date_from=${from}&date_to=${to}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.events ?? [];
  } catch {
    return [];
  }
}

export function useScheduleRange(
  initialEvents: CalendarEvent[],
  initialFrom: string,
  initialTo: string,
): {
  allEvents: CalendarEvent[];
  isFetching: boolean;
  ensureRange: (needFrom: string, needTo: string) => Promise<void>;
} {
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>(initialEvents);
  const [loadedFrom, setLoadedFrom] = useState(initialFrom);
  const [loadedTo, setLoadedTo] = useState(initialTo);
  const [isFetching, setIsFetching] = useState(false);
  const loadingRef = useRef(false);

  const ensureRange = useCallback(
    async (needFrom: string, needTo: string) => {
      if (loadingRef.current) return;
      const fetchFrom = needFrom < loadedFrom ? needFrom : null;
      const fetchTo = needTo > loadedTo ? needTo : null;
      if (!fetchFrom && !fetchTo) return;

      loadingRef.current = true;
      setIsFetching(true);
      const actualFrom = fetchFrom ?? loadedFrom;
      const actualTo = fetchTo ?? loadedTo;

      const newEvents = await fetchScheduleRange(actualFrom, actualTo);

      setAllEvents((prev) => {
        const existing = new Set(prev.map((e) => e.id));
        const merged = [...prev];
        for (const ev of newEvents) {
          if (!existing.has(ev.id)) merged.push(ev);
        }
        return merged;
      });

      setLoadedFrom((prev) => (actualFrom < prev ? actualFrom : prev));
      setLoadedTo((prev) => (actualTo > prev ? actualTo : prev));
      loadingRef.current = false;
      setIsFetching(false);
    },
    [loadedFrom, loadedTo],
  );

  return { allEvents, isFetching, ensureRange };
}
