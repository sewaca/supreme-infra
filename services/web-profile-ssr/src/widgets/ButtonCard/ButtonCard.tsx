import { Badge, ButtonBase, Typography } from '@mui/material';
import { ReactNode } from 'react';
import styles from './ButtonCard.module.css';

type Props = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  status: 'success' | 'error';
  notifications?: number;
  href: string;
};

export const ButtonCard = ({ icon, title, subtitle, status, href, notifications }: Props) => {
  return (
    <Badge
      color="error"
      badgeContent={notifications || undefined}
      sx={{ flex: 1, width: '50%', maxWidth: '400px' }}
      component="div"
    >
      <ButtonBase sx={{ textAlign: 'center', width: '100%' }} href={href}>
        <div className={styles.buttonCard}>
          {!notifications && <div className={styles.statusBadge} style={{ background: `var(--color-${status})` }} />}
          <div className={styles.icon}>{icon}</div>
          <Typography variant="title1">{title}</Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%' }}
          >
            {subtitle}
          </Typography>
        </div>
      </ButtonBase>
    </Badge>
  );
};
