'use client';

import type { DatesSetArg, EventClickArg, EventContentArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import EventIcon from '@mui/icons-material/Event';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import type { CalendarEvent } from '../../shared/lib/schedule.utils';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';
import { ProfileButton } from '../../widgets/ProfileButton/ProfileButton';
import styles from './CalendarPage.module.css';
import './fullcalendar.css';
import { LessonDetailDialog } from './LessonDetailDialog';
import { ScheduleListView } from './ScheduleListView';

type Props = {
  events: CalendarEvent[];
  initialDate: string;
  loadedFrom: string;
  loadedTo: string;
  avatar: string | null;
  userName: string;
  error: string | null;
  initialViewMode: 'list' | 'calendar';
};

function EventCard({ event }: { event: EventContentArg }) {
  const { teacher_name, classroom_name } = event.event.extendedProps as {
    teacher_name: string | null;
    classroom_name: string | null;
  };

  return (
    <div className={styles.eventCard}>
      <span className={styles.eventTitle}>{event.event.title}</span>
      {(teacher_name || classroom_name) && (
        <div className={styles.eventFooter}>
          <span className={styles.eventTeacher}>{teacher_name ?? ''}</span>
          {classroom_name && <span className={styles.eventRoom}>{classroom_name}</span>}
        </div>
      )}
    </div>
  );
}

function setViewCookie(mode: 'list' | 'calendar') {
  // biome-ignore lint/suspicious/noDocumentCookie: setting view preference cookie
  document.cookie = `schedule_view=${mode};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
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

export function CalendarPage({
  events: initialEvents,
  initialDate,
  loadedFrom: initialLoadedFrom,
  loadedTo: initialLoadedTo,
  avatar,
  userName,
  error,
  initialViewMode,
}: Props) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(initialViewMode);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>(initialEvents);
  const [loadedFrom, setLoadedFrom] = useState(initialLoadedFrom);
  const [loadedTo, setLoadedTo] = useState(initialLoadedTo);
  const [listWeekStart, setListWeekStart] = useState(initialDate);
  const loadingRef = useRef(false);
  const calendarRef = useRef<FullCalendar>(null);
  const isInitialRender = useRef(true);

  const ensureRange = useCallback(
    async (needFrom: string, needTo: string) => {
      if (loadingRef.current) return;
      // Check if we need to fetch anything
      const fetchFrom = needFrom < loadedFrom ? needFrom : null;
      const fetchTo = needTo > loadedTo ? needTo : null;
      if (!fetchFrom && !fetchTo) return;

      loadingRef.current = true;
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
    },
    [loadedFrom, loadedTo],
  );

  const toggleView = useCallback(() => {
    const next = viewMode === 'list' ? 'calendar' : 'list';
    setViewMode(next);
    setViewCookie(next);
  }, [viewMode]);

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
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
        center={<Typography variant="title1">Расписание</Typography>}
        rightSlot={<ProfileButton avatar={avatar} name={userName} />}
      />

      <Box className={styles.content}>
        {error && (
          <Paper className={styles.errorCard} elevation={0}>
            <ErrorOutlineIcon color="error" fontSize="small" />
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Paper>
        )}

        <Box className={styles.topSection}>
          <Chip
            icon={<GroupsIcon />}
            label="Другая группа"
            variant="outlined"
            size="small"
            clickable
            onClick={() => router.push('/schedule/group')}
          />
          <Chip
            icon={<PersonIcon />}
            label="Преподаватель"
            variant="outlined"
            size="small"
            clickable
            onClick={() => router.push('/schedule/teacher')}
          />
          <Chip
            icon={<EventIcon />}
            label="Сессия"
            variant="outlined"
            size="small"
            clickable
            onClick={() => router.push('/schedule/exams')}
          />

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
          />
        ) : (
          <Paper className={styles.calendarCard} elevation={0}>
            <div className={`${styles.calendarInner} schedule-fc-wrapper`}>
              <FullCalendar
                ref={calendarRef}
                plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
                initialView={isMobile ? 'timeGridDay' : 'timeGridWeek'}
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
                headerToolbar={{
                  left: 'prev today next',
                  center: 'title',
                  right: isMobile ? '' : 'timeGridWeek,timeGridDay',
                }}
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
    </Paper>
  );
}
