'use client';

import EventIcon from '@mui/icons-material/Event';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import Button from '@mui/material/Button';
import { useRouter } from 'next/navigation';

const btnSx = { borderRadius: '20px', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', px: 2 } as const;

export function ScheduleDestinationTabs() {
  const router = useRouter();

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<GroupsIcon />}
        onClick={() => router.push('/schedule/group')}
        sx={btnSx}
      >
        Группа
      </Button>
      <Button
        variant="outlined"
        size="small"
        startIcon={<PersonIcon />}
        onClick={() => router.push('/schedule/teacher')}
        sx={btnSx}
      >
        Преподаватель
      </Button>
      <Button
        variant="outlined"
        size="small"
        startIcon={<EventIcon />}
        onClick={() => router.push('/schedule/exams')}
        sx={btnSx}
      >
        Сессия
      </Button>
    </>
  );
}
