import { Chip, Typography } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import { NavBar } from './NavBar';

const meta: Meta<typeof NavBar> = {
  title: 'Components/NavBar',
  component: NavBar,
  parameters: { layout: 'fullscreen', backgrounds: { default: 'white' } },
  argTypes: {
    color: { control: 'select', options: ['transparent', 'default', 'primary', 'secondary', 'inherit'] },
    position: { control: 'select', options: ['static', 'fixed', 'absolute', 'sticky', 'relative'] },
  },
};

export default meta;
type Story = StoryObj<typeof NavBar>;

export const WithBack: Story = {
  args: {
    onBack: () => {},
    center: <Typography fontWeight={600}>Заголовок страницы</Typography>,
  },
};

export const WithClose: Story = {
  args: {
    onClose: () => {},
    center: <Typography fontWeight={600}>Модальный экран</Typography>,
  },
};

export const BackAndClose: Story = {
  args: {
    onBack: () => {},
    onClose: () => {},
    center: <Typography fontWeight={600}>Оба слота</Typography>,
  },
};

export const CenterOnly: Story = {
  args: {
    center: <Typography fontWeight={600}>Только заголовок</Typography>,
  },
};

export const WithCustomSlots: Story = {
  args: {
    leftSlot: <Chip label="Отмена" size="small" />,
    center: <Typography fontWeight={600}>Редактирование</Typography>,
    rightSlot: <Chip label="Сохранить" size="small" color="primary" />,
  },
};

export const Empty: Story = {};
