'use client';

import type { DatesSetArg, EventContentArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
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
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import type { CalendarEvent } from '../../shared/lib/schedule.utils';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';
import { ProfileButton } from '../../widgets/ProfileButton/ProfileButton';
import styles from './CalendarPage.module.css';
import './fullcalendar.css';
import { ScheduleListView } from './ScheduleListView';

type Props = {
  events: CalendarEvent[];
  initialDate: string;
  avatar: string | null;
  userName: string;
  error: string | null;
  initialViewMode: 'list' | 'calendar';
};

function EventCard({ event }: { event: EventContentArg }) {
  const { teacher_name, classroom_name, lesson_type, is_override } = event.event.extendedProps as {
    teacher_name: string | null;
    classroom_name: string | null;
    lesson_type: string;
    is_override: boolean;
  };

  return (
    <div className={styles.eventCard}>
      <div className={styles.eventTitle}>
        {is_override && <span className={styles.overrideDot} />}
        {event.event.title}
      </div>
      {lesson_type && <div className={styles.eventMeta}>{lesson_type}</div>}
      {classroom_name && <div className={styles.eventMeta}>{classroom_name}</div>}
      {teacher_name && <div className={styles.eventMeta}>{teacher_name}</div>}
    </div>
  );
}

function setViewCookie(mode: 'list' | 'calendar') {
  document.cookie = `schedule_view=${mode};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}

export function CalendarPage({ events, initialDate, avatar, userName, error, initialViewMode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(initialViewMode);
  const calendarRef = useRef<FullCalendar>(null);
  const isInitialRender = useRef(true);

  const toggleView = useCallback(() => {
    const next = viewMode === 'list' ? 'calendar' : 'list';
    setViewMode(next);
    setViewCookie(next);
  }, [viewMode]);

  const navigateToWeek = useCallback(
    (dateFrom: string, dateTo: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('date_from', dateFrom);
      params.set('date_to', dateTo);
      router.push(`/calendar?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      // Skip the initial render — data is already loaded for initialDate
      if (isInitialRender.current) {
        isInitialRender.current = false;
        return;
      }
      const from = arg.start.toISOString().slice(0, 10);
      const to = new Date(arg.end.getTime() - 86400000).toISOString().slice(0, 10);
      navigateToWeek(from, to);
    },
    [navigateToWeek],
  );

  const handleListPrevWeek = useCallback(() => {
    const d = new Date(initialDate + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    const from = d.toISOString().slice(0, 10);
    const to = new Date(d.getTime() + 5 * 86400000).toISOString().slice(0, 10);
    navigateToWeek(from, to);
  }, [initialDate, navigateToWeek]);

  const handleListNextWeek = useCallback(() => {
    const d = new Date(initialDate + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    const from = d.toISOString().slice(0, 10);
    const to = new Date(d.getTime() + 5 * 86400000).toISOString().slice(0, 10);
    navigateToWeek(from, to);
  }, [initialDate, navigateToWeek]);

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

        {/* Top section: navigation chips + view toggle */}
        <Box className={styles.topSection}>
          <Chip icon={<GroupsIcon />} label="Другая группа" variant="outlined" size="small" clickable />
          <Chip icon={<PersonIcon />} label="Преподаватель" variant="outlined" size="small" clickable />
          <Chip icon={<EventIcon />} label="Сессия" variant="outlined" size="small" clickable />

          <Box sx={{ marginLeft: 'auto' }}>
            <IconButton onClick={toggleView} size="small" title={viewMode === 'list' ? 'Календарь' : 'Список'}>
              {viewMode === 'list' ? <CalendarViewMonthIcon /> : <FormatListBulletedIcon />}
            </IconButton>
          </Box>
        </Box>

        {viewMode === 'list' ? (
          <ScheduleListView
            events={events}
            dateFrom={initialDate}
            onPrevWeek={handleListPrevWeek}
            onNextWeek={handleListNextWeek}
          />
        ) : (
          <Paper className={styles.calendarCard} elevation={0}>
            <div className={`${styles.calendarInner} schedule-fc-wrapper`}>
              <FullCalendar
                ref={calendarRef}
                plugins={[timeGridPlugin, dayGridPlugin, listPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                initialDate={initialDate}
                events={events}
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
                  left: 'prev,next today',
                  center: 'title',
                  right: 'timeGridWeek,timeGridDay',
                }}
                buttonText={{ today: 'Сегодня', week: 'Неделя', day: 'День' }}
                eventContent={(arg) => <EventCard event={arg} />}
                dayHeaderFormat={{ weekday: 'short', day: 'numeric', month: 'numeric' }}
                datesSet={handleDatesSet}
                noEventsContent="Занятий нет"
              />
            </div>
          </Paper>
        )}
      </Box>
    </Paper>
  );
}
