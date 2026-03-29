'use client';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import type { CalendarEvent } from '../../shared/lib/schedule.utils';
import { getLessonChipColor } from '../../shared/lib/schedule.utils';
import styles from './ScheduleListView.module.css';

type Props = {
  events: CalendarEvent[];
  dateFrom: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onEventClick: (event: CalendarEvent) => void;
};

const DAY_NAMES: Record<number, string> = {
  0: 'Воскресенье',
  1: 'Понедельник',
  2: 'Вторник',
  3: 'Среда',
  4: 'Четверг',
  5: 'Пятница',
  6: 'Суббота',
};

const MONTH_NAMES = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

function formatDayHeader(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const dayName = DAY_NAMES[d.getDay()];
  return `${dayName}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

function formatWeekRange(dateFrom: string): string {
  const from = new Date(`${dateFrom}T00:00:00`);
  const to = new Date(from);
  to.setDate(from.getDate() + 5);
  return `${from.getDate()} ${MONTH_NAMES[from.getMonth()]} — ${to.getDate()} ${MONTH_NAMES[to.getMonth()]}`;
}

type DayGroup = { date: string; events: CalendarEvent[] };

export function ScheduleListView({ events, dateFrom, onPrevWeek, onNextWeek, onEventClick }: Props) {
  const days = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const date = ev.start.slice(0, 10);
      const list = map.get(date);
      if (list) {
        list.push(ev);
      } else {
        map.set(date, [ev]);
      }
    }
    // Sort events within each day by start time
    for (const list of map.values()) {
      list.sort((a, b) => a.start.localeCompare(b.start));
    }
    // Build day groups sorted by date
    const groups: DayGroup[] = [];
    for (const [date, evs] of map) {
      groups.push({ date, events: evs });
    }
    groups.sort((a, b) => a.date.localeCompare(b.date));
    return groups;
  }, [events]);

  return (
    <div className={styles.container}>
      <Box className={styles.weekNav}>
        <IconButton onClick={onPrevWeek} size="small">
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          {formatWeekRange(dateFrom)}
        </Typography>
        <IconButton onClick={onNextWeek} size="small">
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {days.length === 0 && (
        <Paper className={styles.emptyCard} elevation={0}>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            Занятий на этой неделе нет
          </Typography>
        </Paper>
      )}

      {days.map((day) => (
        <Paper key={day.date} className={styles.dayCard} elevation={0}>
          <Typography className={styles.dayHeader}>{formatDayHeader(day.date)}</Typography>

          {day.events.map((ev) => {
            const startTime = ev.start.slice(11, 16);
            const endTime = ev.end.slice(11, 16);
            const chipColor = getLessonChipColor(ev.extendedProps.lesson_type);

            return (
              <div key={ev.id} className={styles.lessonRow} onClick={() => onEventClick(ev)} role="button" tabIndex={0}>
                <div className={styles.lessonLeft}>
                  <span className={styles.lessonTime}>
                    {startTime}–{endTime}
                  </span>
                  {ev.extendedProps.classroom_name && (
                    <span className={styles.lessonClassroom}>{ev.extendedProps.classroom_name}</span>
                  )}
                </div>
                <div className={styles.lessonRight}>
                  <span className={styles.lessonSubject}>{ev.title}</span>
                  <span className={styles.lessonType} style={{ color: chipColor }}>
                    {ev.extendedProps.lesson_type}
                  </span>
                  {ev.extendedProps.teacher_name && (
                    <span className={styles.lessonTeacher}>{ev.extendedProps.teacher_name}</span>
                  )}
                </div>
              </div>
            );
          })}
        </Paper>
      ))}
    </div>
  );
}
