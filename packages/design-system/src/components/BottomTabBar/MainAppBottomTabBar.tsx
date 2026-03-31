'use client';

import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChatIcon from '@mui/icons-material/Chat';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import { usePathname, useRouter } from 'next/navigation';
import type { TabItem } from './BottomTabBar';
import { BottomTabBar } from './BottomTabBar';

const MAIN_APP_TABS: TabItem[] = [
  { label: 'Расписание', value: '/schedule', icon: <CalendarMonthIcon /> },
  { label: 'Сообщения', value: '/messages', icon: <ChatIcon /> },
  { label: 'Новости', value: '/news', icon: <NewspaperIcon /> },
];

type Props = {
  /** Путь для подсветки вкладки, когда приложение открыто с корня `/`. */
  homePath: string;
};

export function MainAppBottomTabBar({ homePath }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const currentPath = pathname === '/' ? homePath : pathname;

  return <BottomTabBar tabs={MAIN_APP_TABS} currentPath={currentPath} onNavigate={router.push} />;
}
