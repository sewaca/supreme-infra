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
      <Avatar src={avatar ?? undefined} sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
        {!avatar && name ? name[0].toUpperCase() : null}
      </Avatar>
    </IconButton>
  );
}
