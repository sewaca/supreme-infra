'use client';

import type { CalendarApi, DatesSetArg, EventClickArg, EventContentArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { type TouchEvent as ReactTouchEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CalendarEvent } from '../../../entities/Lesson/model/Lesson';
import { setCookie } from '../../../shared/lib/cookies';
import styles from './ScheduleCalendarView.module.css';
import './fullcalendar.css';

export type CalType = 'timeGridWeek' | 'timeGrid3Day' | 'timeGridDay';

type Props = {
  events: CalendarEvent[];
  /** Explicit date from URL params. Undefined = FullCalendar uses browser new Date() (correct timezone). */
  initialDate?: string;
  initialCalType: CalType | null;
  isFetching: boolean;
  onRangeChange: (from: string, to: string) => void;
  onEventClick: (event: CalendarEvent) => void;
};

// TODO: прибраться
/** Matches `hiddenDays` on FullCalendar — navigation uses the same rules. */
const SCHEDULE_HIDDEN_WEEKDAYS = [0] as const;

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addLocalDays(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta);
}

function isLocallyHidden(d: Date, hidden: readonly number[]): boolean {
  return hidden.includes(d.getDay());
}

/** First day of the contiguous visible block that ends on `lastVisible` and has `span` visible days. */
function startOfVisibleBlockEndingOn(lastVisible: Date, span: number, hidden: readonly number[]): Date {
  let count = 0;
  let day = startOfLocalDay(lastVisible);
  for (;;) {
    if (!isLocallyHidden(day, hidden)) {
      count += 1;
      if (count === span) return day;
    }
    day = addLocalDays(day, -1);
  }
}

function firstVisibleOnOrAfter(day: Date, hidden: readonly number[]): Date {
  let d = startOfLocalDay(day);
  while (isLocallyHidden(d, hidden)) {
    d = addLocalDays(d, 1);
  }
  return d;
}

function lastVisibleBefore(firstDayOfRange: Date, hidden: readonly number[]): Date {
  let d = addLocalDays(startOfLocalDay(firstDayOfRange), -1);
  while (isLocallyHidden(d, hidden)) {
    d = addLocalDays(d, -1);
  }
  return d;
}

function prevTimeGrid3DayTarget(activeStart: Date, hidden: readonly number[]): Date {
  return startOfVisibleBlockEndingOn(lastVisibleBefore(activeStart, hidden), 3, hidden);
}

function nextTimeGrid3DayTarget(activeEnd: Date, hidden: readonly number[]): Date {
  return firstVisibleOnOrAfter(activeEnd, hidden);
}

/** For timeGrid3Day: visible blocks are Mon–Wed and Thu–Sat (Sun hidden). Start of the block that contains `ref` (local). */
function startOfThreeDayChunkContaining(ref: Date, hidden: readonly number[]): Date {
  const d = firstVisibleOnOrAfter(startOfLocalDay(ref), hidden);
  const weekday = d.getDay();
  if (weekday >= 1 && weekday <= 3) {
    return addLocalDays(d, 1 - weekday);
  }
  if (weekday >= 4 && weekday <= 6) {
    return addLocalDays(d, 4 - weekday);
  }
  return d;
}

function navigateScheduleHorizontally(api: CalendarApi, dir: -1 | 1): void {
  if (api.view.type !== 'timeGrid3Day') {
    if (dir < 0) api.prev();
    else api.next();
    return;
  }
  const hidden = SCHEDULE_HIDDEN_WEEKDAYS;
  const { activeStart, activeEnd } = api.view;
  const target = dir < 0 ? prevTimeGrid3DayTarget(activeStart, hidden) : nextTimeGrid3DayTarget(activeEnd, hidden);
  api.gotoDate(target);
}

function EventCard({ event }: { event: EventContentArg }) {
  const { teacher_name, classroom_name: room } = event.event.extendedProps as {
    teacher_name: string | null;
    classroom_name: string | null;
  };

  return (
    <div className={styles.eventCard}>
      <span className={styles.eventTitle}>{event.event.title}</span>
      {(teacher_name || room) && (
        <div className={styles.eventFooter}>
          <span className={styles.eventTeacher}>{teacher_name ?? ''}</span>
          {room && <span className={styles.eventRoom}>{room}</span>}
        </div>
      )}
    </div>
  );
}

/** Pick best calendar type: prefer saved cookie, then largest that fits screen.
 *  `mounted` = false during SSR/hydration when useMediaQuery always returns false —
 *  in that case trust the cookie unconditionally so initialView is correct. */
function resolveCalType(saved: CalType | null, canWeek: boolean, can3Day: boolean, mounted: boolean): CalType {
  if (!mounted && saved) return saved; // SSR: trust cookie
  if (saved === 'timeGridWeek' && canWeek) return 'timeGridWeek';
  if (saved === 'timeGrid3Day' && can3Day) return 'timeGrid3Day';
  if (saved === 'timeGridDay') return 'timeGridDay';
  if (canWeek) return 'timeGridWeek';
  if (can3Day) return 'timeGrid3Day';
  return 'timeGridDay';
}

export function ScheduleCalendarView({
  events,
  initialDate,
  initialCalType,
  isFetching,
  onRangeChange,
  onEventClick,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Breakpoints based on ~200px per day column + 60px time label
  const canShowWeek = useMediaQuery('(min-width: 1260px)');
  const canShow3Days = useMediaQuery('(min-width: 660px)');
  const calendarView = resolveCalType(initialCalType, canShowWeek, canShow3Days, mounted);

  const calendarHeaderToolbar = useMemo(() => {
    if (canShowWeek)
      return { left: 'schedulePrev,today,scheduleNext', center: 'title', right: 'timeGridWeek,timeGridDay' };
    if (canShow3Days)
      return { left: 'schedulePrev,today,scheduleNext', center: 'title', right: 'timeGrid3Day,timeGridDay' };
    return { left: '', center: 'schedulePrev,today,scheduleNext', right: '' };
  }, [canShow3Days, canShowWeek]);

  const handleScheduleNav = useCallback((dir: -1 | 1) => {
    const api = calendarRef.current?.getApi();
    if (api) navigateScheduleHorizontally(api, dir);
  }, []);

  const handleTodayClick = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    if (api.view.type === 'timeGrid3Day') {
      api.gotoDate(startOfThreeDayChunkContaining(new Date(), SCHEDULE_HIDDEN_WEEKDAYS));
    } else {
      api.today();
    }
  }, []);

  const customButtons = useMemo(
    () => ({
      schedulePrev: {
        text: '‹',
        hint: 'Назад',
        click: () => handleScheduleNav(-1),
      },
      scheduleNext: {
        text: '›',
        hint: 'Вперёд',
        click: () => handleScheduleNav(1),
      },
      today: {
        text: 'Сегодня',
        hint: 'Сегодня',
        click: handleTodayClick,
      },
    }),
    [handleScheduleNav, handleTodayClick],
  );

  const calendarRef = useRef<FullCalendar>(null);
  const isInitialRender = useRef(true);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // After hydration, if cookie view doesn't fit screen — switch FullCalendar programmatically
  const correctedRef = useRef(false);
  useEffect(() => {
    if (!mounted || correctedRef.current) return;
    correctedRef.current = true;
    const api = calendarRef.current?.getApi();
    if (api && api.view.type !== calendarView) {
      api.changeView(calendarView);
    }
  }, [mounted, calendarView]);

  const handleTouchStart = useCallback((e: ReactTouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback((e: ReactTouchEvent) => {
    if (touchStart.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStart.current.x;
    const diffY = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;

    const api = calendarRef.current?.getApi();
    if (!api) return;

    if (Math.abs(diffY) > 60) return;
    if (diffX > 80) navigateScheduleHorizontally(api, -1);
    else if (diffX < -80) navigateScheduleHorizontally(api, 1);
  }, []);

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      const viewType = arg.view.type;
      if (viewType === 'timeGridWeek' || viewType === 'timeGrid3Day' || viewType === 'timeGridDay') {
        setCookie('schedule_cal_type', viewType);
      }
      if (isInitialRender.current) {
        isInitialRender.current = false;
        return;
      }
      const from = arg.start.toISOString().slice(0, 10);
      const to = new Date(arg.end.getTime()).toISOString().slice(0, 10);
      onRangeChange(from, to);
    },
    [onRangeChange],
  );

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      const clicked = events.find((e) => e.id === arg.event.id);
      if (clicked) onEventClick(clicked);
    },
    [events, onEventClick],
  );

  return (
    <Paper className={styles.calendarCard} elevation={0} sx={{ px: 0 }}>
      {isFetching && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 12,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            backgroundColor: 'var(--color-background-secondary)',
            borderRadius: '20px',
            px: 1.5,
            py: 0.5,
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          }}
        >
          <CircularProgress size={14} thickness={5} sx={{ color: 'var(--schedule-primary, #1a237e)' }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
            Загрузка...
          </Typography>
        </Box>
      )}
      <div
        className={`${styles.calendarInner} schedule-fc-wrapper`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView={calendarView}
          views={{
            timeGrid3Day: {
              type: 'timeGrid',
              dayCount: 3,
              buttonText: '3 дня',
            },
            timeGridWeek: {
              type: 'timeGrid',
              duration: { weeks: 1 },
              dateAlignment: 'week',
            },
          }}
          initialDate={initialDate}
          events={events}
          locale="ru"
          firstDay={1}
          hiddenDays={[...SCHEDULE_HIDDEN_WEEKDAYS]}
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          slotDuration="00:30:00"
          slotLabelInterval="01:00:00"
          allDaySlot={false}
          nowIndicator
          height="100%"
          headerToolbar={calendarHeaderToolbar}
          customButtons={customButtons}
          buttonText={{ today: 'Сегодня', week: 'Неделя', day: 'День' }}
          eventContent={(arg) => <EventCard event={arg} />}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          dayHeaderFormat={{ weekday: 'short', day: 'numeric', month: 'numeric' }}
        />
      </div>
    </Paper>
  );
}
