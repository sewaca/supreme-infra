import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Box, ButtonBase, ButtonBaseProps, Typography } from '@mui/material';
import { Row } from '@supreme-int/design-system/src/components/Row/Row';
import { ReactNode } from 'react';

type Props = { title: string; href: string; icon: ReactNode; sx?: ButtonBaseProps['sx'] };
export const LinkRow = ({ href, title, icon, sx }: Props) => {
  return (
    <ButtonBase href={href} sx={{ paddingY: 1, paddingX: 1.5, width: '100%', ...sx }}>
      <Row gap={2} alignItems="center" justifyContent="center" sx={{ width: '100%', justifyContent: 'flex-start' }}>
        <Box sx={{ color: '#3d3d3d', display: 'flex' }}>{icon}</Box>
        <Typography variant="body1" color="textPrimary">
          {title}
        </Typography>
        <ArrowForwardIosIcon fontSize="small" sx={{ marginLeft: 'auto', color: '#6e6e6e' }} />
      </Row>
    </ButtonBase>
  );
};
