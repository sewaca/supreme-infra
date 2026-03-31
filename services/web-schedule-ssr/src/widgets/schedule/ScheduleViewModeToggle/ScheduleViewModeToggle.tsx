'use client';

import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

type Props = {
  viewMode: 'list' | 'calendar';
  onToggle: () => void;
};

export function ScheduleViewModeToggle({ viewMode, onToggle }: Props) {
  return (
    <Box sx={{ marginLeft: 'auto' }}>
      <IconButton onClick={onToggle} size="small" title={viewMode === 'list' ? 'Календарь' : 'Список'}>
        {viewMode === 'list' ? <CalendarViewMonthIcon /> : <FormatListBulletedIcon />}
      </IconButton>
    </Box>
  );
}
