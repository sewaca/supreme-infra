import { Box, Chip, Divider, Typography } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import { Row } from './Row';

const meta: Meta<typeof Row> = {
  title: 'Components/Row',
  component: Row,
  parameters: { layout: 'padded' },
  argTypes: {
    gap: { control: { type: 'range', min: 0, max: 8, step: 0.5 } },
    alignItems: { control: 'select', options: ['flex-start', 'center', 'flex-end', 'stretch', 'baseline'] },
    justifyContent: {
      control: 'select',
      options: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Row>;

export const Default: Story = {
  args: {
    children: (
      <>
        <Chip label="Элемент 1" />
        <Chip label="Элемент 2" />
        <Chip label="Элемент 3" />
      </>
    ),
  },
};

export const SpaceBetween: Story = {
  args: {
    justifyContent: 'space-between',
    sx: { width: '100%' },
    children: (
      <>
        <Typography fontWeight={600}>Заголовок раздела</Typography>
        <Chip label="Активен" color="primary" size="small" />
      </>
    ),
  },
};

export const AlignStart: Story = {
  args: {
    alignItems: 'flex-start',
    gap: 2,
    children: (
      <>
        <Box sx={{ width: 40, height: 60, bgcolor: 'primary.main', borderRadius: 1 }} />
        <Box>
          <Typography fontWeight={600}>Заголовок</Typography>
          <Typography variant="body2" color="text.secondary">
            Подзаголовок
          </Typography>
        </Box>
      </>
    ),
  },
};

export const LargeGap: Story = {
  args: {
    gap: 4,
    children: (
      <>
        <Box sx={{ width: 40, height: 40, bgcolor: 'primary.main', borderRadius: 1 }} />
        <Box sx={{ width: 40, height: 40, bgcolor: 'secondary.main', borderRadius: 1 }} />
        <Box sx={{ width: 40, height: 40, bgcolor: 'error.main', borderRadius: 1 }} />
      </>
    ),
  },
};

export const WithDivider: Story = {
  render: () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Row justifyContent="space-between">
        <Typography>Строка 1</Typography>
        <Typography color="text.secondary">Значение</Typography>
      </Row>
      <Divider />
      <Row justifyContent="space-between">
        <Typography>Строка 2</Typography>
        <Typography color="text.secondary">Значение</Typography>
      </Row>
      <Divider />
      <Row justifyContent="space-between">
        <Typography>Строка 3</Typography>
        <Typography color="text.secondary">Значение</Typography>
      </Row>
    </Box>
  ),
};
