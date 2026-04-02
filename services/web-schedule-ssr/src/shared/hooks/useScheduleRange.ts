'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CalendarEvent } from '../../entities/Lesson/model/Lesson';

const CHUNK_DAYS = 14;
const MAX_CHUNK_ITERATIONS = 26;

async function fetchScheduleRange(
  from: string,
  to: string,
  groupName?: string,
  teacherId?: string,
): Promise<CalendarEvent[]> {
  try {
    const qs = new URLSearchParams({ date_from: from, date_to: to });
    if (groupName) qs.set('group_name', groupName);
    if (teacherId) qs.set('teacher_id', teacherId);
    const res = await fetch(`/api/schedule?${qs.toString()}`);
    if (!res.ok) return [];
    const data: { events?: CalendarEvent[] } = await res.json();
    return data.events ?? [];
  } catch {
    return [];
  }
}

/** Local calendar day arithmetic (noon avoids DST edge cases), YYYY-MM-DD */
function addDaysISO(isoDate: string, deltaDays: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + deltaDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function mergeById(prev: CalendarEvent[], incoming: CalendarEvent[]): CalendarEvent[] {
  const existing = new Set(prev.map((e) => e.id));
  const merged = [...prev];
  for (const ev of incoming) {
    if (!existing.has(ev.id)) {
      existing.add(ev.id);
      merged.push(ev);
    }
  }
  return merged;
}

export function useScheduleRange(
  initialEvents: CalendarEvent[],
  initialFrom: string,
  initialTo: string,
  scheduleGroupName?: string,
  scheduleTeacherId?: string,
): {
  allEvents: CalendarEvent[];
  isFetching: boolean;
  ensureRange: (needFrom: string, needTo: string) => Promise<void>;
} {
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>(initialEvents);
  const [isFetching, setIsFetching] = useState(false);
  const loadingRef = useRef(false);
  const loadedBoundsRef = useRef<{ from: string; to: string }>({ from: initialFrom, to: initialTo });
  const skipGroupEffectRef = useRef(scheduleGroupName !== undefined);
  const skipTeacherEffectRef = useRef(scheduleTeacherId !== undefined);

  useEffect(() => {
    if (scheduleGroupName === undefined) return;
    if (skipGroupEffectRef.current) {
      skipGroupEffectRef.current = false;
      return;
    }

    let cancelled = false;
    loadingRef.current = true;
    setIsFetching(true);
    void (async () => {
      try {
        const events = await fetchScheduleRange(initialFrom, initialTo, scheduleGroupName);
        if (cancelled) return;
        setAllEvents(events);
        loadedBoundsRef.current = { from: initialFrom, to: initialTo };
      } finally {
        if (!cancelled) {
          loadingRef.current = false;
          setIsFetching(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scheduleGroupName, initialFrom, initialTo]);

  useEffect(() => {
    if (scheduleTeacherId === undefined) return;
    if (skipTeacherEffectRef.current) {
      skipTeacherEffectRef.current = false;
      return;
    }

    let cancelled = false;
    loadingRef.current = true;
    setIsFetching(true);
    void (async () => {
      try {
        const events = await fetchScheduleRange(initialFrom, initialTo, undefined, scheduleTeacherId);
        if (cancelled) return;
        setAllEvents(events);
        loadedBoundsRef.current = { from: initialFrom, to: initialTo };
      } finally {
        if (!cancelled) {
          loadingRef.current = false;
          setIsFetching(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scheduleTeacherId, initialFrom, initialTo]);

  const ensureRange = useCallback(
    async (needFrom: string, needTo: string) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setIsFetching(true);
      const groupArg = scheduleGroupName;
      const teacherArg = scheduleTeacherId;
      try {
        let iterations = 0;
        while (needFrom < loadedBoundsRef.current.from && iterations < MAX_CHUNK_ITERATIONS) {
          iterations += 1;
          const lf = loadedBoundsRef.current.from;
          const chunkEnd = addDaysISO(lf, -1);
          const chunkStart = addDaysISO(chunkEnd, -(CHUNK_DAYS - 1));
          const newEvents = await fetchScheduleRange(chunkStart, chunkEnd, groupArg, teacherArg);
          loadedBoundsRef.current = { from: chunkStart, to: loadedBoundsRef.current.to };
          setAllEvents((prev) => mergeById(prev, newEvents));
        }

        iterations = 0;
        while (needTo > loadedBoundsRef.current.to && iterations < MAX_CHUNK_ITERATIONS) {
          iterations += 1;
          const lt = loadedBoundsRef.current.to;
          const chunkStart = addDaysISO(lt, 1);
          const chunkEnd = addDaysISO(chunkStart, CHUNK_DAYS - 1);
          const newEvents = await fetchScheduleRange(chunkStart, chunkEnd, groupArg, teacherArg);
          loadedBoundsRef.current = { from: loadedBoundsRef.current.from, to: chunkEnd };
          setAllEvents((prev) => mergeById(prev, newEvents));
        }
      } finally {
        loadingRef.current = false;
        setIsFetching(false);
      }
    },
    [scheduleGroupName, scheduleTeacherId],
  );

  return { allEvents, isFetching, ensureRange };
}
