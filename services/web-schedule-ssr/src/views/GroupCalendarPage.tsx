'use client';

import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import type { CalendarEvent } from '../entities/Lesson/model/Lesson';
import { useScheduleCalendarPageState } from '../features/schedule-calendar/model/useScheduleCalendarPageState';
import { GroupScheduleSelect } from '../features/schedule-group-select/ui/GroupScheduleSelect';
import { DefaultNavbar } from '../widgets/DefaultNavbar/DefaultNavbar';
import { ProfileButton } from '../widgets/ProfileButton/ProfileButton';
import { LessonDetailDialog } from '../widgets/schedule/LessonDetailDialog/LessonDetailDialog';
import type { CalType } from '../widgets/schedule/ScheduleCalendarView/ScheduleCalendarView';
import { ScheduleCalendarView } from '../widgets/schedule/ScheduleCalendarView/ScheduleCalendarView';
import { ScheduleListView } from '../widgets/schedule/ScheduleListView/ScheduleListView';
import { SchedulePageContent, SchedulePageToolbar } from '../widgets/schedule/SchedulePageLayout/SchedulePageLayout';
import { ScheduleViewModeToggle } from '../widgets/schedule/ScheduleViewModeToggle/ScheduleViewModeToggle';

export type GroupCalendarPageProps = {
  events: CalendarEvent[];
  initialDate: string | undefined;
  loadedFrom: string;
  loadedTo: string;
  avatar: string | null;
  userName: string;
  error: string | null;
  initialViewMode: 'list' | 'calendar';
  initialCalType: CalType | null;
  groups: string[];
  initialGroup: string;
};

export function GroupCalendarPage({
  events: initialEvents,
  initialDate,
  loadedFrom: initialLoadedFrom,
  loadedTo: initialLoadedTo,
  avatar,
  userName,
  error,
  initialViewMode,
  initialCalType,
  groups,
  initialGroup,
}: GroupCalendarPageProps) {
  const [selectedGroup, setSelectedGroup] = useState(initialGroup);
  const scheduleGroupName = groups.length > 0 ? selectedGroup : undefined;

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
    scheduleGroupName,
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
        // biome-ignore lint/complexity/noUselessFragments: нужен для того чтобы не показывать кнопку назад в навбаре
        leftSlot={<></>}
        center={<Typography variant="title2">Расписание</Typography>}
        rightSlot={<ProfileButton avatar={avatar} name={userName} />}
      />

      <SchedulePageContent>
        {error && (
          <Alert severity="error" sx={{ borderRadius: '12px', mb: 1 }}>
            {error}
          </Alert>
        )}

        <SchedulePageToolbar>
          {groups.length > 0 ? (
            <GroupScheduleSelect groups={groups} value={selectedGroup} onChange={setSelectedGroup} />
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
