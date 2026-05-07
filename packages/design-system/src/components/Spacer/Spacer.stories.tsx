import { Box, Divider, Typography } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import { Spacer } from './Spacer';

const meta: Meta<typeof Spacer> = {
  title: 'Components/Spacer',
  component: Spacer,
  parameters: { layout: 'padded' },
  argTypes: {
    size: { control: { type: 'range', min: 1, max: 20, step: 1 } },
  },
};

export default meta;
type Story = StoryObj<typeof Spacer>;

export const Default: Story = {
  args: { size: 4 },
  render: (args) => (
    <Box>
      <Typography>Контент выше</Typography>
      <Box sx={{ position: 'relative', bgcolor: 'primary.light', opacity: 0.5 }}>
        <Spacer {...args} />
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 1,
            color: 'primary.dark',
          }}
        >
          {args.size * 2}px
        </Typography>
      </Box>
      <Typography>Контент ниже</Typography>
    </Box>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <Box>
      {[1, 2, 4, 6, 8, 12, 16].map((size) => (
        <Box key={size}>
          <Typography variant="caption" color="text.secondary">
            size={size} → {size * 2}px
          </Typography>
          <Box sx={{ position: 'relative', bgcolor: 'primary.light', opacity: 0.4 }}>
            <Spacer size={size} />
          </Box>
          <Divider />
        </Box>
      ))}
    </Box>
  ),
};
