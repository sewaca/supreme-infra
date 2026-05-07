import type { Meta, StoryObj } from '@storybook/react';
import { NotFound } from './NotFound';

const meta: Meta<typeof NotFound> = {
  title: 'Components/NotFound',
  component: NotFound,
  parameters: { layout: 'fullscreen', backgrounds: { default: 'dark' } },
  argTypes: {
    homeHref: { control: 'text' },
    title: { control: 'text' },
    description: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof NotFound>;

export const Default: Story = {};

export const CustomText: Story = {
  args: {
    title: 'Здесь ничего нет',
    description: 'Эта страница была удалена или никогда не существовала',
  },
};

export const CustomHref: Story = {
  args: {
    homeHref: '/dashboard',
  },
};
