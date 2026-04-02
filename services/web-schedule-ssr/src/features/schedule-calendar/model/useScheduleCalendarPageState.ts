'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CalendarEvent } from '../../../entities/Lesson/model/Lesson';
import { useScheduleRange } from '../../../shared/hooks/useScheduleRange';
import { setCookie } from '../../../shared/lib/cookies';
import { addCalendarDays, getWeekRange, mondayOfCalendarWeek, toDateStr } from '../../../shared/lib/schedule.utils';

export type ScheduleCalendarPageStateParams = {
  initialEvents: CalendarEvent[];
  initialLoadedFrom: string;
  initialLoadedTo: string;
  initialDate: string | undefined;
  initialViewMode: 'list' | 'calendar';
  scheduleGroupName?: string;
  scheduleTeacherId?: string;
};

export function useScheduleCalendarPageState({
  initialEvents,
  initialLoadedFrom,
  initialLoadedTo,
  initialDate,
  initialViewMode,
  scheduleGroupName,
  scheduleTeacherId,
}: ScheduleCalendarPageStateParams) {
  const { allEvents, isFetching, ensureRange } = useScheduleRange(
    initialEvents,
    initialLoadedFrom,
    initialLoadedTo,
    scheduleGroupName,
    scheduleTeacherId,
  );
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(initialViewMode);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [listWeekStart, setListWeekStart] = useState(initialDate ?? '');

  useEffect(() => {
    if (!initialDate) {
      setListWeekStart(getWeekRange(new Date()).dateFrom);
    }
  }, [initialDate]);

  const toggleView = useCallback(() => {
    const next = viewMode === 'list' ? 'calendar' : 'list';
    setViewMode(next);
    setCookie('schedule_view', next);
  }, [viewMode]);

  const handleListPrevWeek = useCallback(() => {
    const anchor = listWeekStart ? mondayOfCalendarWeek(listWeekStart) : getWeekRange(new Date()).dateFrom;
    const d = new Date(`${anchor}T12:00:00`);
    d.setDate(d.getDate() - 7);
    const from = toDateStr(d);
    const to = addCalendarDays(from, 6);
    setListWeekStart(from);
    ensureRange(from, to);
  }, [listWeekStart, ensureRange]);

  const handleListNextWeek = useCallback(() => {
    const anchor = listWeekStart ? mondayOfCalendarWeek(listWeekStart) : getWeekRange(new Date()).dateFrom;
    const d = new Date(`${anchor}T12:00:00`);
    d.setDate(d.getDate() + 7);
    const from = toDateStr(d);
    const to = addCalendarDays(from, 6);
    setListWeekStart(from);
    ensureRange(from, to);
  }, [listWeekStart, ensureRange]);

  return {
    allEvents,
    isFetching,
    ensureRange,
    viewMode,
    toggleView,
    listWeekStart,
    selectedEvent,
    setSelectedEvent,
    handleListPrevWeek,
    handleListNextWeek,
  };
}
