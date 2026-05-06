'use client';

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { AppLogo } from '@supreme-int/design-system/src/components/AppLogo/AppLogo';
import { NavBar } from '@supreme-int/design-system/src/components/NavBar/NavBar';
import { i18n } from '@supreme-int/i18n/src/i18n';
import { usePageTour } from '@supreme-int/user-tours/src/usePageTour';
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
  const { startTour } = usePageTour({ page: 'schedule' });

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
        leftSlot={<AppLogo href="/" />}
        center={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Typography variant="title1">Расписание</Typography>
            <IconButton onClick={startTour} aria-label={i18n('Показать обучение')} size="small">
              <HelpOutlineIcon fontSize="small" color="inherit" />
            </IconButton>
          </Box>
        }
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
          <Box data-tour="schedule-destination-tabs" sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ScheduleDestinationTabs />
          </Box>
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
