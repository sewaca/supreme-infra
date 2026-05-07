import { Box, Typography } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import { GradientCard } from './GradientCard';

const meta: Meta<typeof GradientCard> = {
  title: 'Components/GradientCard',
  component: GradientCard,
  parameters: { layout: 'padded' },
  argTypes: {
    variant: { control: 'select', options: ['blue', 'green', 'yellow', 'orange', 'red', 'purple'] },
    size: { control: 'radio', options: ['large', 'small'] },
  },
};

export default meta;
type Story = StoryObj<typeof GradientCard>;

const VARIANTS = ['blue', 'green', 'yellow', 'orange', 'red', 'purple'] as const;

const LargeContent = () => (
  <>
    <Typography
      sx={{
        color: 'rgba(255,255,255,0.6)',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        fontSize: '0.75rem',
        display: 'block',
      }}
    >
      Ежемесячная выплата
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.75 }}>
      <Typography sx={{ fontSize: 48, fontWeight: 700, lineHeight: 1.1, color: 'white' }}>30 000</Typography>
      <Typography sx={{ fontSize: 22, fontWeight: 400, color: 'rgba(255,255,255,0.75)' }}>₽/мес</Typography>
    </Box>
    <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', mt: 2 }}>Иванов Иван Иванович</Typography>
  </>
);

const SmallContent = ({ label, value }: { label: string; value: string }) => (
  <>
    <Typography
      sx={{
        color: 'rgba(255,255,255,0.6)',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        fontSize: '0.6rem',
        display: 'block',
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        fontSize: '1rem',
        fontWeight: 700,
        lineHeight: 1.2,
        color: 'white',
        mt: 0.5,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {value}
    </Typography>
  </>
);

export const Default: Story = {
  args: { variant: 'blue', size: 'large' },
  render: (args) => (
    <Box sx={{ maxWidth: 480 }}>
      <GradientCard {...args}>
        <LargeContent />
      </GradientCard>
    </Box>
  ),
};

export const AllVariants: Story = {
  name: 'All Variants (large)',
  render: () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, maxWidth: 700 }}>
      {VARIANTS.map((v) => (
        <GradientCard key={v} variant={v} size="large">
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.6)',
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              fontSize: '0.7rem',
              display: 'block',
              mb: 0.5,
            }}
          >
            {v}
          </Typography>
          <LargeContent />
        </GradientCard>
      ))}
    </Box>
  ),
};

export const Sizes: Story = {
  name: 'Sizes (blue)',
  render: () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}>
      <GradientCard variant="blue" size="large">
        <LargeContent />
      </GradientCard>
      <GradientCard variant="blue" size="small">
        <SmallContent label="Стипендия" value="30 000 ₽/мес" />
      </GradientCard>
    </Box>
  ),
};

export const SmallVariants: Story = {
  name: 'All Variants (small)',
  render: () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, maxWidth: 400 }}>
      {VARIANTS.map((v) => (
        <GradientCard key={v} variant={v} size="small">
          <SmallContent label={v} value="30 000 ₽/мес" />
        </GradientCard>
      ))}
    </Box>
  ),
};

export const WithLongContent: Story = {
  name: 'Long content (overflow)',
  render: () => (
    <Box sx={{ maxWidth: 480 }}>
      <GradientCard variant="green" size="large">
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.6)',
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            fontSize: '0.75rem',
            display: 'block',
          }}
        >
          Место проживания
        </Typography>
        <Typography
          sx={{
            fontSize: 36,
            fontWeight: 700,
            lineHeight: 1.2,
            color: 'white',
            mt: 0.75,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          Общежитие №8 корпус 4
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 2 }}>
          <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
            ул. Зелёная, д. 15, Санкт-Петербург, 190000
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Комната № 412</Typography>
        </Box>
      </GradientCard>
    </Box>
  ),
};
