'use client';

import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import type { CalendarEvent } from '../entities/Lesson/model/Lesson';
import { useScheduleCalendarPageState } from '../features/schedule-calendar/model/useScheduleCalendarPageState';
import type { Teacher } from '../features/schedule-teacher-select/ui/TeacherScheduleSelect';
import { TeacherScheduleSelect } from '../features/schedule-teacher-select/ui/TeacherScheduleSelect';
import { DefaultNavbar } from '../widgets/DefaultNavbar/DefaultNavbar';
import { ProfileButton } from '../widgets/ProfileButton/ProfileButton';
import { LessonDetailDialog } from '../widgets/schedule/LessonDetailDialog/LessonDetailDialog';
import type { CalType } from '../widgets/schedule/ScheduleCalendarView/ScheduleCalendarView';
import { ScheduleCalendarView } from '../widgets/schedule/ScheduleCalendarView/ScheduleCalendarView';
import { ScheduleListView } from '../widgets/schedule/ScheduleListView/ScheduleListView';
import { SchedulePageContent, SchedulePageToolbar } from '../widgets/schedule/SchedulePageLayout/SchedulePageLayout';
import { ScheduleViewModeToggle } from '../widgets/schedule/ScheduleViewModeToggle/ScheduleViewModeToggle';

export type TeacherCalendarPageProps = {
  events: CalendarEvent[];
  initialDate: string | undefined;
  loadedFrom: string;
  loadedTo: string;
  avatar: string | null;
  userName: string;
  error: string | null;
  initialViewMode: 'list' | 'calendar';
  initialCalType: CalType | null;
  teachers: Teacher[];
  initialTeacherId: string;
};

export function TeacherCalendarPage({
  events: initialEvents,
  initialDate,
  loadedFrom: initialLoadedFrom,
  loadedTo: initialLoadedTo,
  avatar,
  userName,
  error,
  initialViewMode,
  initialCalType,
  teachers,
  initialTeacherId,
}: TeacherCalendarPageProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState(initialTeacherId);
  const scheduleTeacherId = teachers.length > 0 ? selectedTeacherId : undefined;

  const {
    allEvents,
    isFetching,
    ensureRange,
    viewMode,
    toggleView,
    listWeekStart,
    selectedEvent,
    setSelectedEvent,
    handleListPrevWeek,
    handleListNextWeek,
  } = useScheduleCalendarPageState({
    initialEvents,
    initialLoadedFrom,
    initialLoadedTo,
    initialDate,
    initialViewMode,
    scheduleTeacherId,
  });

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
        center={<Typography variant="title1">Расписание преподавателя</Typography>}
        rightSlot={<ProfileButton avatar={avatar} name={userName} />}
      />

      <SchedulePageContent>
        {error && (
          <Alert severity="error" sx={{ borderRadius: '12px', mb: 1 }}>
            {error}
          </Alert>
        )}

        <SchedulePageToolbar>
          {teachers.length > 0 ? (
            <TeacherScheduleSelect teachers={teachers} value={selectedTeacherId} onChange={setSelectedTeacherId} />
          ) : null}
          <ScheduleViewModeToggle viewMode={viewMode} onToggle={toggleView} />
        </SchedulePageToolbar>

        {viewMode === 'list' ? (
          <ScheduleListView
            events={allEvents}
            dateFrom={listWeekStart}
            onPrevWeek={handleListPrevWeek}
            onNextWeek={handleListNextWeek}
            onEventClick={setSelectedEvent}
            isFetching={isFetching}
          />
        ) : (
          <ScheduleCalendarView
            events={allEvents}
            initialDate={initialDate}
            initialCalType={initialCalType}
            isFetching={isFetching}
            onRangeChange={ensureRange}
            onEventClick={setSelectedEvent}
          />
        )}
      </SchedulePageContent>

      <LessonDetailDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </Paper>
  );
}
