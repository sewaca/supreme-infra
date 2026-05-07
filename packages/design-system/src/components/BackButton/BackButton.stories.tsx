import type { Meta, StoryObj } from '@storybook/react';
import { BackButton } from './BackButton';

const meta: Meta<typeof BackButton> = {
  title: 'Components/BackButton',
  component: BackButton,
  parameters: { layout: 'centered' },
  args: { onBack: () => {} },
};

export default meta;
type Story = StoryObj<typeof BackButton>;

export const Default: Story = {};
