'use client';

import type { DatesSetArg, EventClickArg, EventContentArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import EventIcon from '@mui/icons-material/Event';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import SyncIcon from '@mui/icons-material/Sync';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useRouter } from 'next/navigation';
import { type TouchEvent as ReactTouchEvent, useCallback, useEffect, useRef, useState } from 'react';
import type { CalendarEvent } from '../../shared/lib/schedule.utils';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';
import { ProfileButton } from '../../widgets/ProfileButton/ProfileButton';
import { CaldavGuideDialog } from './CaldavGuideDialog';
import styles from './CalendarPage.module.css';
import './fullcalendar.css';
import { LessonDetailDialog } from './LessonDetailDialog';
import { ScheduleListView } from './ScheduleListView';

type CalType = 'timeGridWeek' | 'timeGrid3Day' | 'timeGridDay';

type Props = {
  events: CalendarEvent[];
  initialDate: string;
  loadedFrom: string;
  loadedTo: string;
  avatar: string | null;
  userName: string;
  error: string | null;
  initialViewMode: 'list' | 'calendar';
  initialCalType: CalType | null;
};

function formatRoom(classroom: string | null, building: string | null): string | null {
  if (!classroom) return null;
  return building ? `${building}, ${classroom}` : classroom;
}

function EventCard({ event }: { event: EventContentArg }) {
  const { teacher_name, classroom_name, classroom_building } = event.event.extendedProps as {
    teacher_name: string | null;
    classroom_name: string | null;
    classroom_building: string | null;
  };
  const room = formatRoom(classroom_name, classroom_building);

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

function setCookie(name: string, value: string) {
  // biome-ignore lint/suspicious/noDocumentCookie: setting preference cookie
  document.cookie = `${name}=${value};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}

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

export function CalendarPage({
  events: initialEvents,
  initialDate,
  loadedFrom: initialLoadedFrom,
  loadedTo: initialLoadedTo,
  avatar,
  userName,
  error,
  initialViewMode,
  initialCalType,
}: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Breakpoints based on ~200px per day column + 60px time label
  const canShowWeek = useMediaQuery('(min-width: 1260px)');
  const canShow3Days = useMediaQuery('(min-width: 660px)');
  const calendarView = resolveCalType(initialCalType, canShowWeek, canShow3Days, mounted);
  const calendarRight = canShowWeek ? 'timeGridWeek,timeGridDay' : canShow3Days ? 'timeGrid3Day,timeGridDay' : '';

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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(initialViewMode);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [caldavOpen, setCaldavOpen] = useState(false);
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>(initialEvents);
  const [loadedFrom, setLoadedFrom] = useState(initialLoadedFrom);
  const [loadedTo, setLoadedTo] = useState(initialLoadedTo);
  const [listWeekStart, setListWeekStart] = useState(initialDate);
  const [isFetching, setIsFetching] = useState(false);
  const loadingRef = useRef(false);
  const calendarRef = useRef<FullCalendar>(null);
  const isInitialRender = useRef(true);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

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

    if (Math.abs(diffY) > 60) return; // dont trigger prev/next on user scrolling down/top
    if (diffX > 80) api.prev();
    else if (diffX < -80) api.next();
  }, []);

  const ensureRange = useCallback(
    async (needFrom: string, needTo: string) => {
      if (loadingRef.current) return;
      // Check if we need to fetch anything
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

  const toggleView = useCallback(() => {
    const next = viewMode === 'list' ? 'calendar' : 'list';
    setViewMode(next);
    setCookie('schedule_view', next);
  }, [viewMode]);

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      // Save selected calendar type to cookie
      const viewType = arg.view.type;
      if (viewType === 'timeGridWeek' || viewType === 'timeGrid3Day' || viewType === 'timeGridDay') {
        setCookie('schedule_cal_type', viewType);
      }
      if (isInitialRender.current) {
        isInitialRender.current = false;
        return;
      }
      const from = arg.start.toISOString().slice(0, 10);
      const to = new Date(arg.end.getTime() - 86400000).toISOString().slice(0, 10);
      ensureRange(from, to);
    },
    [ensureRange],
  );

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      const clicked = allEvents.find((e) => e.id === arg.event.id);
      if (clicked) setSelectedEvent(clicked);
    },
    [allEvents],
  );

  const handleListEventClick = useCallback((ev: CalendarEvent) => {
    setSelectedEvent(ev);
  }, []);

  const handleListPrevWeek = useCallback(() => {
    const d = new Date(`${listWeekStart}T00:00:00`);
    d.setDate(d.getDate() - 7);
    const from = d.toISOString().slice(0, 10);
    const to = new Date(d.getTime() + 5 * 86400000).toISOString().slice(0, 10);
    setListWeekStart(from);
    ensureRange(from, to);
  }, [listWeekStart, ensureRange]);

  const handleListNextWeek = useCallback(() => {
    const d = new Date(`${listWeekStart}T00:00:00`);
    d.setDate(d.getDate() + 7);
    const from = d.toISOString().slice(0, 10);
    const to = new Date(d.getTime() + 5 * 86400000).toISOString().slice(0, 10);
    setListWeekStart(from);
    ensureRange(from, to);
  }, [listWeekStart, ensureRange]);

  return (
    <Paper
      sx={{
        backgroundColor: 'var(--color-background-primary)',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
      }}
      elevation={0}
    >
      <DefaultNavbar
        // biome-ignore lint/complexity/noUselessFragments: нужен для того чтобы не показывать кнопку назад в навбаре
        leftSlot={<></>}
        center={<Typography variant="title2">Расписание</Typography>}
        rightSlot={<ProfileButton avatar={avatar} name={userName} />}
      />

      <Box className={styles.content}>
        <Alert
          icon={<SyncIcon fontSize="small" />}
          severity="info"
          onClick={() => setCaldavOpen(true)}
          sx={{ cursor: 'pointer', borderRadius: '12px', mb: 1, mt: 1 }}
        >
          <strong>Привяжите CalDAV-календарь</strong> — расписание прямо в вашем телефоне!
        </Alert>

        {error && (
          <Alert severity="error" sx={{ borderRadius: '12px', mb: 1 }}>
            {error}
          </Alert>
        )}

        <Box className={styles.topSection}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<GroupsIcon />}
            onClick={() => router.push('/schedule/group')}
            sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', px: 2 }}
          >
            Группа
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PersonIcon />}
            onClick={() => router.push('/schedule/teacher')}
            sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', px: 2 }}
          >
            Преподаватель
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EventIcon />}
            onClick={() => router.push('/schedule/exams')}
            sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', px: 2 }}
          >
            Сессия
          </Button>

          <Box sx={{ marginLeft: 'auto' }}>
            <IconButton onClick={toggleView} size="small" title={viewMode === 'list' ? 'Календарь' : 'Список'}>
              {viewMode === 'list' ? <CalendarViewMonthIcon /> : <FormatListBulletedIcon />}
            </IconButton>
          </Box>
        </Box>

        {viewMode === 'list' ? (
          <ScheduleListView
            events={allEvents}
            dateFrom={listWeekStart}
            onPrevWeek={handleListPrevWeek}
            onNextWeek={handleListNextWeek}
            onEventClick={handleListEventClick}
            isFetching={isFetching}
          />
        ) : (
          <Paper className={styles.calendarCard} elevation={0} sx={{ px: 0, position: 'relative' }}>
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
                    duration: { days: 3 },
                    dateAlignment: 'week',
                    buttonText: '3 дня',
                  },
                  timeGridWeek: {
                    type: 'timeGrid',
                    duration: { weeks: 1 },
                    dateAlignment: 'week',
                  },
                }}
                initialDate={initialDate}
                events={allEvents}
                locale="ru"
                firstDay={1}
                hiddenDays={[0]}
                slotMinTime="07:00:00"
                slotMaxTime="22:00:00"
                slotDuration="00:30:00"
                slotLabelInterval="01:00:00"
                allDaySlot={false}
                nowIndicator
                height="100%"
                headerToolbar={{ left: 'prev,today,next', center: 'title', right: calendarRight }}
                buttonText={{ today: 'Сегодня', week: 'Неделя', day: 'День' }}
                eventContent={(arg) => <EventCard event={arg} />}
                eventClick={handleEventClick}
                datesSet={handleDatesSet}
                dayHeaderFormat={{ weekday: 'short', day: 'numeric', month: 'numeric' }}
              />
            </div>
          </Paper>
        )}
      </Box>

      <LessonDetailDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      <CaldavGuideDialog open={caldavOpen} onClose={() => setCaldavOpen(false)} />
    </Paper>
  );
}
