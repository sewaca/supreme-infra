import { ButtonBase, ButtonBaseProps, Typography } from '@mui/material';
import { Row } from '@supreme-int/design-system/src/components/Row/Row';
import { ReactNode } from 'react';
import styles from './LinkRow.module.css';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

type Props = { title: string; href: string; icon: ReactNode; sx?: ButtonBaseProps['sx'] };
export const LinkRow = ({ href, title, icon, sx }: Props) => {
  return (
    <ButtonBase href={href} sx={{ paddingY: 1, paddingX: 2, width: '100%', ...sx }}>
      <Row gap={2} alignItems="center" justifyContent="center" sx={{ width: '100%', justifyContent: 'flex-start' }}>
        <div className={styles.icon}>{icon}</div>
        <Typography variant="body1" color="textPrimary">
          {title}
        </Typography>
        <ArrowForwardIosIcon fontSize="small" color="action" sx={{ marginLeft: 'auto' }} />
      </Row>
    </ButtonBase>
  );
};
