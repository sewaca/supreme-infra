'use client';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { useMemo } from 'react';
import type { CalendarEvent } from '../../../entities/Lesson/model/Lesson';
import { getLessonChipColor } from '../../../entities/Lesson/model/Lesson';
import { addCalendarDays, mondayOfCalendarWeek, toDateStr } from '../../../shared/lib/schedule.utils';
import styles from './ScheduleListView.module.css';

export type { CalendarEvent };

type Props = {
  events: CalendarEvent[];
  dateFrom: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onEventClick: (event: CalendarEvent) => void;
  isFetching?: boolean;
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
  const toStr = addCalendarDays(dateFrom, 6);
  const to = new Date(`${toStr}T00:00:00`);
  return `${from.getDate()} ${MONTH_NAMES[from.getMonth()]} — ${to.getDate()} ${MONTH_NAMES[to.getMonth()]}`;
}

type DayGroup = { date: string; events: CalendarEvent[] };

export function ScheduleListView({ events, dateFrom, onPrevWeek, onNextWeek, onEventClick, isFetching }: Props) {
  const theme = useTheme();
  const todayStr = toDateStr(new Date());
  const weekMonday = useMemo(() => (dateFrom ? mondayOfCalendarWeek(dateFrom) : ''), [dateFrom]);

  const days = useMemo(() => {
    if (!weekMonday) return [];
    const weekEndStr = addCalendarDays(weekMonday, 6);

    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const date = ev.start.slice(0, 10);
      if (date < weekMonday || date > weekEndStr) continue;
      const list = map.get(date);
      if (list) {
        list.push(ev);
      } else {
        map.set(date, [ev]);
      }
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.start.localeCompare(b.start));
    }
    const groups: DayGroup[] = [];
    for (const [date, evs] of map) {
      groups.push({ date, events: evs });
    }
    groups.sort((a, b) => a.date.localeCompare(b.date));
    return groups;
  }, [events, weekMonday]);

  return (
    <div className={styles.container}>
      <Box className={styles.weekNav}>
        <IconButton onClick={onPrevWeek} size="small">
          <ChevronLeftIcon />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {weekMonday ? formatWeekRange(weekMonday) : ''}
          </Typography>
          {isFetching && <CircularProgress size={14} thickness={5} />}
        </Box>
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

      {days.map((day) => {
        const isToday = day.date === todayStr;
        const primary = theme.palette.primary.main;
        return (
          <Paper
            key={day.date}
            className={styles.dayCard}
            elevation={0}
            sx={
              isToday
                ? {
                    bgcolor: alpha(primary, 0.06),
                    border: `1px solid ${alpha(primary, 0.22)}`,
                  }
                : undefined
            }
          >
            <Typography
              className={styles.dayHeader}
              sx={isToday ? { color: 'primary.dark', borderBottomColor: alpha(primary, 0.22) } : undefined}
            >
              {formatDayHeader(day.date)}
            </Typography>

            {day.events.map((ev) => {
              const startTime = ev.start.slice(11, 16);
              const endTime = ev.end.slice(11, 16);
              const chipColor = getLessonChipColor(ev.extendedProps.lesson_type);

              return (
                <div
                  key={ev.id}
                  className={styles.lessonRow}
                  onClick={() => onEventClick(ev)}
                  role="button"
                  tabIndex={0}
                >
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
        );
      })}
    </div>
  );
}
