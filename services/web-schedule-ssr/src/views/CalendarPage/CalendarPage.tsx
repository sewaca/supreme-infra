'use client';

import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type { CalendarEvent } from '../../entities/Lesson/model/Lesson';
import { useScheduleCalendarPageState } from '../../features/schedule-calendar/model/useScheduleCalendarPageState';
import { ProfileButton } from '../../widgets/ProfileButton/ProfileButton';
import { LessonDetailDialog } from '../../widgets/schedule/LessonDetailDialog/LessonDetailDialog';
import { ScheduleCaldavPromo } from '../../widgets/schedule/ScheduleCaldavPromo/ScheduleCaldavPromo';
import type { CalType } from '../../widgets/schedule/ScheduleCalendarView/ScheduleCalendarView';
import { ScheduleCalendarView } from '../../widgets/schedule/ScheduleCalendarView/ScheduleCalendarView';
import { ScheduleDestinationTabs } from '../../widgets/schedule/ScheduleDestinationTabs/ScheduleDestinationTabs';
import { ScheduleListView } from '../../widgets/schedule/ScheduleListView/ScheduleListView';
import { SchedulePageContent, SchedulePageToolbar } from '../../widgets/schedule/SchedulePageLayout/SchedulePageLayout';
import { ScheduleViewModeToggle } from '../../widgets/schedule/ScheduleViewModeToggle/ScheduleViewModeToggle';
import { NavBar } from '@supreme-int/design-system/src/components/NavBar/NavBar';

type Props = {
  events: CalendarEvent[];
  /** Explicit date from URL params. Undefined = let the client use today (avoids server UTC mismatch). */
  initialDate: string | undefined;
  loadedFrom: string;
  loadedTo: string;
  avatar: string | null;
  userName: string;
  error: string | null;
  initialViewMode: 'list' | 'calendar';
  initialCalType: CalType | null;
};

export function CalendarPage({
  events: initialEvents,
  initialDate,
  loadedFrom: initialLoadedFrom,
  loadedTo: initialLoadedTo,
  avatar,
  userName,
  error,
  initialViewMode,
  initialCalType,
}: Props) {
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
      <NavBar
        center={<Typography variant="title1">Расписание</Typography>}
        rightSlot={<ProfileButton avatar={avatar} name={userName} />}
      />

      <SchedulePageContent>
        <ScheduleCaldavPromo />

        {error && (
          <Alert severity="error" sx={{ borderRadius: '12px', mb: 1 }}>
            {error}
          </Alert>
        )}

        <SchedulePageToolbar>
          <ScheduleDestinationTabs />
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
