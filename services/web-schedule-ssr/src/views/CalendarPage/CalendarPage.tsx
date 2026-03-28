'use client';
import type { EventContentArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ViewDayIcon from '@mui/icons-material/ViewDay';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';

import styles from './CalendarPage.module.css';
import './fullcalendar.css';
import { CalendarEvent } from '../../shared/lib/schedule.utils';
import { GroupSearch } from '../../widgets/GroupSearch/GroupSearch';

type Props = {
  events: CalendarEvent[];
  currentGroup: string | null;
  initialDate: string;
};

type CalendarView = 'timeGridWeek' | 'timeGridDay' | 'listWeek';

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
        {is_override && <span className={styles.overrideDot} title="Изменено" />}
        {event.event.title}
      </div>
      {lesson_type && <div className={styles.eventMeta}>{lesson_type}</div>}
      {classroom_name && <div className={styles.eventMeta}>{classroom_name}</div>}
      {teacher_name && <div className={styles.eventMeta}>{teacher_name}</div>}
    </div>
  );
}

export function CalendarPage({ events, currentGroup, initialDate }: Props) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const router = useRouter();
  const searchParams = useSearchParams();
  const calendarRef = useRef<FullCalendar>(null);

  const getDefaultView = useCallback((): CalendarView => {
    if (isDesktop) return 'timeGridWeek';
    return 'listWeek';
  }, [isDesktop]);

  const [view, setView] = useState<CalendarView>(getDefaultView);

  function switchView(newView: CalendarView) {
    setView(newView);
    calendarRef.current?.getApi().changeView(newView);
  }

  function handleDatesSet(info: { view: { type: string } }) {
    const currentView = info.view.type as CalendarView;
    if (view !== currentView) setView(currentView);

    // Update URL with new date range for server re-fetch on navigation
    const api = calendarRef.current?.getApi();
    if (!api) return;
    const start = api.view.currentStart;
    const end = new Date(api.view.currentEnd);
    end.setDate(end.getDate() - 1);

    const params = new URLSearchParams(searchParams.toString());
    params.set('date_from', start.toISOString().slice(0, 10));
    params.set('date_to', end.toISOString().slice(0, 10));
    router.replace(`/calendar?${params.toString()}`, { scroll: false });
  }

  const effectiveView: CalendarView = isDesktop ? (view === 'listWeek' ? 'timeGridWeek' : view) : view;

  return (
    <Box className={styles.container}>
      <Box className={styles.toolbar}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mr: 'auto' }}>
          {currentGroup ? `Группа: ${currentGroup}` : 'Моё расписание'}
        </Typography>
        <GroupSearch currentGroup={currentGroup} />
        <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
          <Tooltip title="Неделя">
            <IconButton
              size="small"
              onClick={() => switchView('timeGridWeek')}
              color={effectiveView === 'timeGridWeek' ? 'primary' : 'default'}
            >
              <ViewWeekIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="День">
            <IconButton
              size="small"
              onClick={() => switchView('timeGridDay')}
              color={effectiveView === 'timeGridDay' ? 'primary' : 'default'}
            >
              <ViewDayIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {!isDesktop && (
            <Tooltip title="Список">
              <IconButton
                size="small"
                onClick={() => switchView('listWeek')}
                color={effectiveView === 'listWeek' ? 'primary' : 'default'}
              >
                <CalendarMonthIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Box className={`${styles.calendarWrapper} schedule-fc-wrapper`}>
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, dayGridPlugin, listPlugin, interactionPlugin]}
          initialView={effectiveView}
          initialDate={initialDate}
          events={events}
          locale="ru"
          firstDay={1}
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
            right: '',
          }}
          buttonText={{ today: 'Сегодня', week: 'Неделя', day: 'День', list: 'Список' }}
          eventContent={(arg) => <EventCard event={arg} />}
          datesSet={handleDatesSet}
          weekends={false}
          dayHeaderFormat={{ weekday: 'short', day: 'numeric', month: 'numeric' }}
          listDayFormat={{ weekday: 'long', day: 'numeric', month: 'long' }}
          listDaySideFormat={false}
          noEventsContent="Занятий нет"
        />
      </Box>
    </Box>
  );
}
