'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { NavBar } from '@supreme-int/design-system/src/components/NavBar/NavBar';
import { ProfileButton } from '../../widgets/ProfileButton/ProfileButton';

interface Props {
  avatar: string | null;
  userName: string;
  children: React.ReactNode;
}

export function NewsLayout({ avatar, userName, children }: Props) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <NavBar
        leftSlot={null}
        center={
          <Typography variant="title1" fontWeight={600}>
            Новости
          </Typography>
        }
        rightSlot={<ProfileButton avatar={avatar} name={userName} />}
      />
      <Box sx={{ flex: 1, overflow: 'auto' }}>{children}</Box>
    </Box>
  );
}
