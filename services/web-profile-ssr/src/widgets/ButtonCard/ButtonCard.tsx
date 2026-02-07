import { ButtonBase, Typography } from '@mui/material';
import { ReactNode } from 'react';
import styles from './ButtonCard.module.css';

type Props = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  status: 'success' | 'warning' | 'error';
  href: string;
};

export const ButtonCard = ({ icon, title, subtitle, status, href }: Props) => {
  return (
    <ButtonBase sx={{ flex: 1, width: '50%', textAlign: 'center' }} href={href}>
      <div className={styles.buttonCard}>
        <div className={styles.statusBadge} style={{ background: `var(--color-${status})` }} />
        <div className={styles.icon}>{icon}</div>
        <Typography variant="title1">{title}</Typography>
        <Typography
          variant="body2"
          color={status}
          sx={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%' }}
        >
          {subtitle}
        </Typography>
      </div>
    </ButtonBase>
  );
};
