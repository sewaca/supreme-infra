'use client';

import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import { alpha, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { useMemo, useState } from 'react';
import type { CalendarEvent } from '../entities/Lesson/model/Lesson';
import { getLessonChipColor } from '../entities/Lesson/model/Lesson';
import { toDateStr } from '../shared/lib/schedule.utils';
import { DefaultNavbar } from '../widgets/DefaultNavbar/DefaultNavbar';
import { ProfileButton } from '../widgets/ProfileButton/ProfileButton';
import { LessonDetailDialog } from '../widgets/schedule/LessonDetailDialog/LessonDetailDialog';
import { SchedulePageContent } from '../widgets/schedule/SchedulePageLayout/SchedulePageLayout';
import styles from './ExamsCalendarPage.module.css';

export type ExamsCalendarPageProps = {
  events: CalendarEvent[];
  avatar: string | null;
  userName: string;
  error: string | null;
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
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

export function ExamsCalendarPage({ events, avatar, userName, error }: ExamsCalendarPageProps) {
  const theme = useTheme();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const todayStr = toDateStr(new Date());

  const dayGroups = useMemo(() => {
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
    for (const list of map.values()) {
      list.sort((a, b) => a.start.localeCompare(b.start));
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  return (
    <Paper
      sx={{
        backgroundColor: 'var(--color-background-primary)',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}
      elevation={0}
    >
      <DefaultNavbar
        backPath="/schedule"
        center={<Typography variant="title1">Расписание сессии</Typography>}
        rightSlot={<ProfileButton avatar={avatar} name={userName} />}
      />

      <SchedulePageContent>
        {error && (
          <Alert severity="error" sx={{ borderRadius: '12px', mb: 1 }}>
            {error}
          </Alert>
        )}

        <div className={styles.container}>
          {dayGroups.length === 0 && !error && (
            <Paper className={styles.emptyCard} elevation={0}>
              <Typography variant="body1" color="text.secondary" textAlign="center">
                Экзаменов не найдено
              </Typography>
            </Paper>
          )}

          {dayGroups.map(([date, dayEvents]) => {
            const isToday = date === todayStr;
            const primary = theme.palette.primary.main;
            return (
              <Paper
                key={date}
                className={styles.dayCard}
                elevation={0}
                sx={isToday ? { bgcolor: alpha(primary, 0.06), border: `1px solid ${alpha(primary, 0.22)}` } : undefined}
              >
                <Typography
                  className={styles.dayHeader}
                  sx={isToday ? { color: 'primary.dark', borderBottomColor: alpha(primary, 0.22) } : undefined}
                >
                  {formatDayHeader(date)}
                </Typography>

                {dayEvents.map((ev) => {
                  const startTime = ev.start.slice(11, 16);
                  const endTime = ev.end.slice(11, 16);
                  const chipColor = getLessonChipColor(ev.extendedProps.lesson_type);
                  return (
                    <div
                      key={ev.id}
                      className={styles.lessonRow}
                      onClick={() => setSelectedEvent(ev)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className={styles.lessonLeft}>
                        <span className={styles.lessonTime}>{startTime}–{endTime}</span>
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
      </SchedulePageContent>

      <LessonDetailDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </Paper>
  );
}
