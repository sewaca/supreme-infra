import { Box } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CodeInput } from './CodeInput';

const meta: Meta<typeof CodeInput> = {
  title: 'Components/CodeInput',
  component: CodeInput,
  parameters: { layout: 'centered' },
  argTypes: {
    disabled: { control: 'boolean' },
    error: { control: 'boolean' },
    value: { control: 'text' },
  },
  args: { value: '', onChange: () => {} },
};

export default meta;
type Story = StoryObj<typeof CodeInput>;

export const Empty: Story = {};

export const PartiallyFilled: Story = {
  args: { value: '123' },
};

export const Filled: Story = {
  args: { value: '654321' },
};

export const WithError: Story = {
  args: { value: '654321', error: true },
};

export const Disabled: Story = {
  args: { value: '654321', disabled: true },
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
        <CodeInput value={value} onChange={setValue} />
        <Box sx={{ fontSize: 12, color: 'text.secondary' }}>
          Значение: &quot;{value}&quot; ({value.length}/6)
        </Box>
      </Box>
    );
  },
};

export const InteractiveError: Story = {
  name: 'Interactive (error state)',
  render: () => {
    const [value, setValue] = useState('');
    const isError = value.length === 6 && value !== '123456';
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
        <CodeInput value={value} onChange={setValue} error={isError} />
        <Box sx={{ fontSize: 12, color: isError ? 'error.main' : 'text.secondary' }}>
          {isError ? 'Неверный код. Попробуйте 123456' : `Введите код (${value.length}/6)`}
        </Box>
      </Box>
    );
  },
};
