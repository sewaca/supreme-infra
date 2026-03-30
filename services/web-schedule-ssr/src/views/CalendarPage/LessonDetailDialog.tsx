'use client';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PersonIcon from '@mui/icons-material/Person';
import RoomIcon from '@mui/icons-material/Room';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import type { CalendarEvent } from '../../shared/lib/schedule.utils';
import { getLessonChipColor } from '../../shared/lib/schedule.utils';

type Props = {
  event: CalendarEvent | null;
  onClose: () => void;
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

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

export function LessonDetailDialog({ event, onClose }: Props) {
  if (!event) return null;

  const date = event.start.slice(0, 10);
  const startTime = event.start.slice(11, 16);
  const endTime = event.end.slice(11, 16);
  const { teacher_name, classroom_name, classroom_building, lesson_type, is_override, override_comment, group_name } =
    event.extendedProps;
  const chipColor = getLessonChipColor(lesson_type);

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1,
          paddingBottom: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
          {event.title}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ marginTop: '-4px', marginRight: '-8px' }}>
          &times;
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: '0 !important' }}>
        <Typography variant="body2" sx={{ color: chipColor, fontWeight: 600 }}>
          {lesson_type}
        </Typography>

        <Divider />

        <InfoRow icon={<AccessTimeIcon fontSize="small" />} label="Время" value={`${startTime} – ${endTime}`} />
        <InfoRow icon={<MenuBookIcon fontSize="small" />} label="Дата" value={formatDate(date)} />
        {classroom_name && (
          <InfoRow
            icon={<RoomIcon fontSize="small" />}
            label="Аудитория"
            value={classroom_building ? `${classroom_building}, ${classroom_name}` : classroom_name}
          />
        )}
        {teacher_name && <InfoRow icon={<PersonIcon fontSize="small" />} label="Преподаватель" value={teacher_name} />}

        <InfoRow icon={null} label="Группа" value={group_name} />

        {is_override && (
          <Box
            sx={{
              backgroundColor: '#ffebee',
              borderRadius: '8px',
              padding: '8px 12px',
              marginTop: 1,
            }}
          >
            <Typography variant="body2" sx={{ color: '#c62828', fontWeight: 500 }}>
              Замена в расписании
            </Typography>
            {override_comment && (
              <Typography variant="body2" sx={{ color: '#c62828', marginTop: 0.5 }}>
                {override_comment}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {icon && <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>{icon}</Box>}
      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}
