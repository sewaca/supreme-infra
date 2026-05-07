import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChatIcon from '@mui/icons-material/Chat';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import { Box } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import type { TabItem } from './BottomTabBar';
import { BottomTabBar } from './BottomTabBar';

const TABS: TabItem[] = [
  { label: 'Главная', value: '/', icon: <HomeRoundedIcon /> },
  { label: 'Расписание', value: '/schedule', icon: <CalendarMonthIcon /> },
  { label: 'Сообщения', value: '/messages', icon: <ChatIcon /> },
  { label: 'Новости', value: '/news', icon: <NewspaperIcon /> },
];

const meta: Meta<typeof BottomTabBar> = {
  title: 'Components/BottomTabBar',
  component: BottomTabBar,
  parameters: { layout: 'fullscreen', backgrounds: { default: 'white' } },
  decorators: [
    (Story) => (
      <Box sx={{ height: 120, position: 'relative' }}>
        <Story />
      </Box>
    ),
  ],
  args: {
    tabs: TABS,
    currentPath: '/',
    onNavigate: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof BottomTabBar>;

export const Default: Story = {};

export const ScheduleActive: Story = {
  args: { currentPath: '/schedule' },
};

export const MessagesActive: Story = {
  args: { currentPath: '/messages' },
};

export const WithBadge: Story = {
  args: {
    tabs: TABS.map((t) => (t.value === '/messages' ? { ...t, badge: 3 } : t)),
  },
};

export const WithLargeBadge: Story = {
  args: {
    tabs: TABS.map((t) => (t.value === '/messages' ? { ...t, badge: 100 } : t)),
    currentPath: '/messages',
  },
};

export const NestedPath: Story = {
  args: { currentPath: '/schedule/week' },
};
