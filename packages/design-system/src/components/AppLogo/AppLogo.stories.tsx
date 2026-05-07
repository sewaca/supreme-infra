import { Box } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import { AppLogo } from './AppLogo';

const meta: Meta<typeof AppLogo> = {
  title: 'Components/AppLogo',
  component: AppLogo,
  parameters: { layout: 'centered' },
  argTypes: {
    light: { control: 'boolean' },
    href: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof AppLogo>;

export const Default: Story = {};

export const WithLink: Story = {
  args: { href: '/' },
};

export const Light: Story = {
  args: { light: true },
  parameters: { backgrounds: { default: 'white' } },
};

export const LightWithLink: Story = {
  args: { href: '/', light: true },
  parameters: { backgrounds: { default: 'white' } },
};

export const DarkBackground: Story = {
  render: () => (
    <Box sx={{ bgcolor: '#1a1a2e', p: 3, borderRadius: 2, display: 'flex', gap: 4, alignItems: 'center' }}>
      <AppLogo />
      <AppLogo light />
    </Box>
  ),
};
