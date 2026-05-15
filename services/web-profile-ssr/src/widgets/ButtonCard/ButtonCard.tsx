import { Badge, ButtonBase, Typography } from '@mui/material';
import Link from 'next/link';
import {
  GradientCard,
  type GradientCardVariant,
} from '@supreme-int/design-system/src/components/GradientCard/GradientCard';

type Props = {
  title: string;
  subtitle: string;
  variant: GradientCardVariant;
  notifications?: number;
  href: string;
};

export const ButtonCard = ({ title, subtitle, variant, href, notifications }: Props) => {
  return (
    <Badge
      color="error"
      badgeContent={notifications || undefined}
      sx={{ flex: 1, width: '50%', maxWidth: '400px', minWidth: 0 }}
      component="div"
    >
      <ButtonBase component={Link} sx={{ width: '100%', borderRadius: 2.5, overflow: 'hidden' }} href={href}>
        <GradientCard variant={variant} size="small" sx={{ width: '100%', textAlign: 'left' }}>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.6)',
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              fontSize: '0.6rem',
              display: 'block',
            }}
          >
            {title}
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
            {subtitle}
          </Typography>
        </GradientCard>
      </ButtonBase>
    </Badge>
  );
};
