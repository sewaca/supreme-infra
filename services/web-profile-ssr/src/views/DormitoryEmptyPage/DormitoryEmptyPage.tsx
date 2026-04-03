import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';
import { i18n } from '@supreme-int/i18n/src/i18n';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';

export const DormitoryEmptyPage = () => {
  return (
    <>
      <DefaultNavbar position="absolute" center={<Typography variant="title1">{i18n('Общежитие')}</Typography>} />
      <Container
        sx={{
          minHeight: 'var(--user-screen-height)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: 4,
        }}
      >
        <Typography fontSize={96} textAlign="center" lineHeight={1}>
          😿
        </Typography>
        <Spacer size={6} />
        <Typography variant="title2" textAlign="center">
          {i18n('Вы пока не проживаете в общежитии')}
        </Typography>
        <Spacer size={3} />
        <Typography variant="body3" textAlign="center" color="secondary">
          {i18n('Подать заявление на заселение в общежитие можно в студ.\u00a0городке')}
        </Typography>
      </Container>
    </>
  );
};
