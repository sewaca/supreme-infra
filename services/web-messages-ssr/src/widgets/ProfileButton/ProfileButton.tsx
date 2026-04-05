'use client';

import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Link from 'next/link';

type Props = {
  avatar: string | null;
  name: string;
};

export function ProfileButton({ avatar, name }: Props) {
  return (
    <IconButton component={Link} href="/profile" size="small">
      <Avatar
        src={avatar ?? undefined}
        sx={{
          width: 32,
          height: 32,
          fontSize: '0.875rem',
          fontWeight: 700,
          ...(!avatar && {
            background: 'linear-gradient(135deg, #2b4878 0%, #1a2e4a 100%)',
            color: 'rgba(255,255,255,0.9)',
          }),
        }}
      >
        {!avatar && name ? name[0].toUpperCase() : null}
      </Avatar>
    </IconButton>
  );
}
