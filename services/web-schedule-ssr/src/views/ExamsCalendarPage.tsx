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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16, flex: 1 }}>
          {dayGroups.length === 0 && !error && (
            <Paper
              elevation={0}
              sx={{
                background: 'var(--color-background-secondary)',
                borderRadius: '16px',
                padding: '32px 16px',
              }}
            >
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
                elevation={0}
                sx={{
                  background: 'var(--color-background-secondary)',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  ...(isToday ? { bgcolor: alpha(primary, 0.06), border: `1px solid ${alpha(primary, 0.22)}` } : {}),
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    textAlign: 'center',
                    paddingBottom: '12px',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    marginBottom: '4px',
                    ...(isToday ? { color: 'primary.dark', borderBottomColor: alpha(primary, 0.22) } : {}),
                  }}
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
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedEvent(ev)}
                      style={{
                        display: 'flex',
                        gap: 16,
                        padding: '10px 0',
                        borderBottom: '1px solid rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                        borderRadius: 8,
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 80, flexShrink: 0 }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {startTime}–{endTime}
                        </span>
                        {ev.extendedProps.classroom_name && (
                          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                            {ev.extendedProps.classroom_name}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: '1rem', fontWeight: 500, lineHeight: 1.3 }}>{ev.title}</span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: chipColor }}>
                          {ev.extendedProps.lesson_type}
                        </span>
                        {ev.extendedProps.teacher_name && (
                          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                            {ev.extendedProps.teacher_name}
                          </span>
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
