'use client';

import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useState } from 'react';
import type { CalendarEvent } from '../entities/Lesson/model/Lesson';
import { addCalendarDays, getWeekRange, mondayOfCalendarWeek, toDateStr } from '../shared/lib/schedule.utils';
import { DefaultNavbar } from '../widgets/DefaultNavbar/DefaultNavbar';
import { ProfileButton } from '../widgets/ProfileButton/ProfileButton';
import { LessonDetailDialog } from '../widgets/schedule/LessonDetailDialog/LessonDetailDialog';
import { ScheduleListView } from '../widgets/schedule/ScheduleListView/ScheduleListView';
import { SchedulePageContent } from '../widgets/schedule/SchedulePageLayout/SchedulePageLayout';

export type ExamsCalendarPageProps = {
  events: CalendarEvent[];
  avatar: string | null;
  userName: string;
  error: string | null;
};

export function ExamsCalendarPage({ events, avatar, userName, error }: ExamsCalendarPageProps) {
  const [listWeekStart, setListWeekStart] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    setListWeekStart(getWeekRange(new Date()).dateFrom);
  }, []);

  const handleListPrevWeek = useCallback(() => {
    const anchor = listWeekStart ? mondayOfCalendarWeek(listWeekStart) : getWeekRange(new Date()).dateFrom;
    const d = new Date(`${anchor}T12:00:00`);
    d.setDate(d.getDate() - 7);
    const from = toDateStr(d);
    setListWeekStart(from);
  }, [listWeekStart]);

  const handleListNextWeek = useCallback(() => {
    const anchor = listWeekStart ? mondayOfCalendarWeek(listWeekStart) : getWeekRange(new Date()).dateFrom;
    const d = new Date(`${anchor}T12:00:00`);
    d.setDate(d.getDate() + 7);
    const from = toDateStr(d);
    setListWeekStart(from);
  }, [listWeekStart]);

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

        <ScheduleListView
          events={events}
          dateFrom={listWeekStart}
          onPrevWeek={handleListPrevWeek}
          onNextWeek={handleListNextWeek}
          onEventClick={setSelectedEvent}
        />
      </SchedulePageContent>

      <LessonDetailDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </Paper>
  );
}
