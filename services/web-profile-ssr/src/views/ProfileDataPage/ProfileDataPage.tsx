import { Container, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';
import { i18n } from '@supreme-int/i18n/src/i18n';
import { Suspense } from 'react';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';
import { MismatchDataButton } from '../DormitoryPage/components/MismatchDataButton';
import styles from './ProfileDataPage.module.css';

type Props = {
  avatar: string;
  lastName: string;
  name: string;
  middleName?: string;
  data: Array<{ label: string; value: string }>;
};

export const ProfileDataPage = ({ avatar, lastName, name, middleName, data }: Props) => {
  return (
    <Paper sx={{ minHeight: '100dvh', background: '#edeff2', display: 'flex', flexDirection: 'column' }}>
      <DefaultNavbar center={<Typography variant="title1">{i18n('Личные данные')}</Typography>} />
      <Container>
        <Spacer size={3} />
        <img src={avatar} className={styles.avatar} />
        <Spacer size={8} />
        <Typography variant="h2" textAlign="center" whiteSpace="pre-wrap" lineHeight={1.2}>
          {lastName} {'\n'}
          {name} {'\n'}
          {middleName}
        </Typography>
        <Spacer size={14} />

        <Paper elevation={1} sx={{ padding: '16px', borderRadius: 3 }}>
          <Stack direction="column" spacing={1}>
            {data.map((item) => (
              <div key={item.label}>
                <Typography variant="caption" color="secondary" component="p">
                  {item.label}
                </Typography>
                <Typography variant="body2" component="p">
                  {item.value}
                </Typography>
              </div>
            ))}
          </Stack>
        </Paper>

        <Spacer size={12} />
        <Suspense fallback={<Skeleton variant="rectangular" height={36} width="100%" />}>
          <MismatchDataButton />
        </Suspense>
        <Spacer size={12} />
      </Container>
    </Paper>
  );
};
