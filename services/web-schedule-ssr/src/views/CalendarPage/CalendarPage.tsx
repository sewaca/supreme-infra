'use client';

import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import EventIcon from '@mui/icons-material/Event';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import SyncIcon from '@mui/icons-material/Sync';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { CalendarEvent } from '../../entities/Lesson/model/Lesson';
import { useScheduleRange } from '../../shared/hooks/useScheduleRange';
import { setCookie } from '../../shared/lib/cookies';
import { addCalendarDays, getWeekRange, mondayOfCalendarWeek, toDateStr } from '../../shared/lib/schedule.utils';
import { CaldavGuideDialog } from '../../widgets/CaldavGuideDialog/CaldavGuideDialog';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';
import { ProfileButton } from '../../widgets/ProfileButton/ProfileButton';
import { LessonDetailDialog } from '../../widgets/schedule/LessonDetailDialog/LessonDetailDialog';
import type { CalType } from '../../widgets/schedule/ScheduleCalendarView/ScheduleCalendarView';
import { ScheduleCalendarView } from '../../widgets/schedule/ScheduleCalendarView/ScheduleCalendarView';
import { ScheduleListView } from '../../widgets/schedule/ScheduleListView/ScheduleListView';
import styles from './CalendarPage.module.css';

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
  const router = useRouter();
  const { allEvents, isFetching, ensureRange } = useScheduleRange(initialEvents, initialLoadedFrom, initialLoadedTo);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(initialViewMode);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [caldavOpen, setCaldavOpen] = useState(false);
  // initialDate may be undefined (default load) or a server-UTC date that is wrong for the user's timezone.
  // Correct it client-side after mount so the list view shows the right week.
  const [listWeekStart, setListWeekStart] = useState(initialDate ?? '');
  useEffect(() => {
    if (!initialDate) {
      setListWeekStart(getWeekRange(new Date()).dateFrom);
    }
  }, [initialDate]);

  const toggleView = useCallback(() => {
    const next = viewMode === 'list' ? 'calendar' : 'list';
    setViewMode(next);
    setCookie('schedule_view', next);
  }, [viewMode]);

  const handleListPrevWeek = useCallback(() => {
    const anchor = listWeekStart ? mondayOfCalendarWeek(listWeekStart) : getWeekRange(new Date()).dateFrom;
    const d = new Date(`${anchor}T12:00:00`);
    d.setDate(d.getDate() - 7);
    const from = toDateStr(d);
    const to = addCalendarDays(from, 6);
    setListWeekStart(from);
    ensureRange(from, to);
  }, [listWeekStart, ensureRange]);

  const handleListNextWeek = useCallback(() => {
    const anchor = listWeekStart ? mondayOfCalendarWeek(listWeekStart) : getWeekRange(new Date()).dateFrom;
    const d = new Date(`${anchor}T12:00:00`);
    d.setDate(d.getDate() + 7);
    const from = toDateStr(d);
    const to = addCalendarDays(from, 6);
    setListWeekStart(from);
    ensureRange(from, to);
  }, [listWeekStart, ensureRange]);

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

      <Box className={styles.content}>
        <Alert
          icon={<SyncIcon fontSize="small" />}
          severity="info"
          onClick={() => setCaldavOpen(true)}
          sx={{ cursor: 'pointer', borderRadius: '12px', mb: 1, mt: 1 }}
        >
          <strong>Привяжите CalDAV-календарь</strong> — расписание прямо в вашем телефоне!
        </Alert>

        {error && (
          <Alert severity="error" sx={{ borderRadius: '12px', mb: 1 }}>
            {error}
          </Alert>
        )}

        <Box className={styles.topSection}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<GroupsIcon />}
            onClick={() => router.push('/schedule/group')}
            sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', px: 2 }}
          >
            Группа
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PersonIcon />}
            onClick={() => router.push('/schedule/teacher')}
            sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', px: 2 }}
          >
            Преподаватель
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EventIcon />}
            onClick={() => router.push('/schedule/exams')}
            sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', px: 2 }}
          >
            Сессия
          </Button>

          <Box sx={{ marginLeft: 'auto' }}>
            <IconButton onClick={toggleView} size="small" title={viewMode === 'list' ? 'Календарь' : 'Список'}>
              {viewMode === 'list' ? <CalendarViewMonthIcon /> : <FormatListBulletedIcon />}
            </IconButton>
          </Box>
        </Box>

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
      </Box>

      <LessonDetailDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      <CaldavGuideDialog open={caldavOpen} onClose={() => setCaldavOpen(false)} />
    </Paper>
  );
}
