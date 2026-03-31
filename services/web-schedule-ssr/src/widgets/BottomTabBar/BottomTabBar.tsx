'use client';

import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChatIcon from '@mui/icons-material/Chat';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import { BottomTabBar as BottomTabBarBase } from '@supreme-int/design-system/src/components/BottomTabBar/BottomTabBar';
import { usePathname, useRouter } from 'next/navigation';

const TABS = [
  { label: 'Расписание', value: '/schedule', icon: <CalendarMonthIcon /> },
  { label: 'Сообщения', value: '/messages', icon: <ChatIcon /> },
  { label: 'Новости', value: '/news', icon: <NewspaperIcon /> },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <BottomTabBarBase tabs={TABS} currentPath={pathname === '/' ? '/calendar' : pathname} onNavigate={router.push} />
  );
}
