'use client';

import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChatIcon from '@mui/icons-material/Chat';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import { usePathname } from 'next/navigation';
import type { TabItem } from './BottomTabBar';
import { BottomTabBar } from './BottomTabBar';

const MAIN_APP_TABS: TabItem[] = [
  { label: 'Главная', value: '/', icon: <HomeRoundedIcon /> },
  { label: 'Расписание', value: '/schedule', icon: <CalendarMonthIcon /> },
  { label: 'Сообщения', value: '/messages', icon: <ChatIcon /> },
  { label: 'Новости', value: '/news', icon: <NewspaperIcon /> },
];

type Props = {
  /** Количество непрочитанных сообщений — отображается бейджем на вкладке «Сообщения». */
  unreadMessagesCount?: number;
};

export function MainAppBottomTabBar({ unreadMessagesCount }: Props) {
  const pathname = usePathname();

  const tabs: TabItem[] = MAIN_APP_TABS.map((tab) =>
    tab.value === '/messages' && unreadMessagesCount ? { ...tab, badge: unreadMessagesCount } : tab,
  );

  return (
    <BottomTabBar
      tabs={tabs}
      currentPath={pathname}
      onNavigate={(value) => {
        window.location.href = value;
      }}
    />
  );
}
