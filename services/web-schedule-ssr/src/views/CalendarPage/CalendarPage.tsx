'use client';

import type { EventContentArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { CalendarEvent } from '../../shared/lib/schedule.utils';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';
import { ProfileButton } from '../../widgets/ProfileButton/ProfileButton';
import styles from './CalendarPage.module.css';
import './fullcalendar.css';

type Props = {
  events: CalendarEvent[];
  initialDate: string;
  avatar: string | null;
  userName: string;
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

export function CalendarPage({ events, initialDate, avatar, userName }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const initialView = isMobile ? 'listWeek' : 'timeGridWeek';

  return (
    <div className={styles.page}>
      <DefaultNavbar
        center={<Typography variant="title1">Расписание</Typography>}
        rightSlot={<ProfileButton avatar={avatar} name={userName} />}
      />
      <div className={`${styles.calendarWrapper} schedule-fc-wrapper`}>
        <FullCalendar
          plugins={[timeGridPlugin, dayGridPlugin, listPlugin, interactionPlugin]}
          initialView={initialView}
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
            right: isMobile ? 'listWeek,timeGridDay' : 'timeGridWeek,timeGridDay',
          }}
          buttonText={{ today: 'Сегодня', week: 'Неделя', day: 'День', list: 'Список' }}
          eventContent={(arg) => <EventCard event={arg} />}
          weekends={false}
          dayHeaderFormat={{ weekday: 'short', day: 'numeric', month: 'numeric' }}
          listDayFormat={{ weekday: 'long', day: 'numeric', month: 'long' }}
          listDaySideFormat={false}
          noEventsContent="Занятий нет"
        />
      </div>
    </div>
  );
}
