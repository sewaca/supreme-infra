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
  /** Количество непрочитанных сообщений — отображается бейджем на вкладке «Сообщения». */
  unreadMessagesCount?: number;
};

export function MainAppBottomTabBar({ homePath, unreadMessagesCount }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const currentPath = pathname === '/' ? homePath : pathname;

  const tabs: TabItem[] = MAIN_APP_TABS.map((tab) =>
    tab.value === '/messages' && unreadMessagesCount ? { ...tab, badge: unreadMessagesCount } : tab,
  );

  return <BottomTabBar tabs={tabs} currentPath={currentPath} onNavigate={router.push} />;
}
