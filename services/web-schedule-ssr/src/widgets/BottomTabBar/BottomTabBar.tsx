'use client';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChatIcon from '@mui/icons-material/Chat';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import { usePathname, useRouter } from 'next/navigation';

// TODO: вынести в design-system
export function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();

  const currentTab =
    ['/', '/calendar', '/messages', '/news'].find((p) => pathname === p || pathname.startsWith(`${p}/`)) ?? '/calendar';

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1300 }} elevation={3}>
      <BottomNavigation
        value={currentTab === '/' ? '/calendar' : currentTab}
        onChange={(_, newValue) => router.push(newValue)}
        showLabels
      >
        <BottomNavigationAction label="Расписание" value="/calendar" icon={<CalendarMonthIcon />} />
        <BottomNavigationAction label="Сообщения" value="/messages" icon={<ChatIcon />} />
        <BottomNavigationAction label="Новости" value="/news" icon={<NewspaperIcon />} />
      </BottomNavigation>
    </Paper>
  );
}
