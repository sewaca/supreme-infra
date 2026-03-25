'use client';

import { Alert, Button, Container, TextField, Typography } from '@mui/material';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';
import { i18n } from '@supreme-int/i18n/src/i18n';
import { useActionState } from 'react';
import type { DormitoryApplicationFormState } from 'services/web-profile-ssr/app/profile/dormitory/actions';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';

type Props = {
  onSubmit: (prevState: DormitoryApplicationFormState, formData: FormData) => Promise<DormitoryApplicationFormState>;
};

export const DormitoryEmptyPage = ({ onSubmit }: Props) => {
  const [state, action, isPending] = useActionState(onSubmit, null);

  return (
    <>
      <DefaultNavbar position="absolute" center={<Typography variant="title1">{i18n('Общежитие')}</Typography>} />
      <Container
        sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 4 }}
      >
        <Spacer size={30} />

        <Typography fontSize={72} textAlign="center" lineHeight={1}>
          🏠
        </Typography>
        <Spacer size={5} />
        <Typography variant="title2" textAlign="center">
          {i18n('Вы не проживаете в общежитии')}
        </Typography>
        <Spacer size={2} />
        <Typography variant="body3" textAlign="center" color="secondary">
          {i18n('Подайте заявление — мы свяжемся с вами после рассмотрения')}
        </Typography>

        <Spacer size={8} />

        {state?.success ? (
          <Alert severity="success" sx={{ width: '100%' }}>
            {i18n('Заявление успешно подано! Мы свяжемся с вами в ближайшее время.')}
          </Alert>
        ) : (
          <form action={action} style={{ width: '100%' }}>
            {state?.error && (
              <>
                <Alert severity="error" sx={{ mb: 2 }}>
                  {state.error}
                </Alert>
              </>
            )}

            <TextField
              name="yearOfStudy"
              label={i18n('Курс обучения')}
              type="number"
              required
              fullWidth
              slotProps={{ htmlInput: { min: 1, max: 6 } }}
            />
            <Spacer size={3} />
            <TextField
              name="reason"
              label={i18n('Причина заселения')}
              placeholder={i18n('Например: иногородний студент')}
              multiline
              rows={3}
              required
              fullWidth
            />
            <Spacer size={5} />
            <Button type="submit" variant="contained" fullWidth size="large" disabled={isPending}>
              {isPending ? i18n('Отправка...') : i18n('Подать заявление')}
            </Button>
          </form>
        )}
      </Container>
    </>
  );
};
