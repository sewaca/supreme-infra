import { Box } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import { PasswordInput } from './PasswordInput';

const meta: Meta<typeof PasswordInput> = {
  title: 'Components/PasswordInput',
  component: PasswordInput,
  parameters: { layout: 'centered' },
  argTypes: {
    disabled: { control: 'boolean' },
    error: { control: 'boolean' },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    helperText: { control: 'text' },
    fullWidth: { control: 'boolean' },
    size: { control: 'radio', options: ['small', 'medium'] },
  },
  args: { label: 'Пароль', onChange: () => {} },
  decorators: [
    (Story) => (
      <Box sx={{ minWidth: 300 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PasswordInput>;

export const Default: Story = {};

export const WithPlaceholder: Story = {
  args: { placeholder: 'Введите пароль' },
};

export const WithError: Story = {
  args: { error: true, helperText: 'Неверный пароль' },
};

export const Disabled: Story = {
  args: { disabled: true, value: 'password123' },
};

export const Small: Story = {
  args: { size: 'small', label: 'Пароль', placeholder: 'Введите пароль' },
};

export const FullWidth: Story = {
  args: { fullWidth: true },
  decorators: [
    (Story) => (
      <Box sx={{ width: 400 }}>
        <Story />
      </Box>
    ),
  ],
};

export const NewPassword: Story = {
  args: {
    label: 'Новый пароль',
    autoComplete: 'new-password',
    helperText: 'Минимум 8 символов',
  },
};
