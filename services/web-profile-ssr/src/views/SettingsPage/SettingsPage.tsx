'use client';

import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Button, Container, Stack, Switch, Typography } from '@mui/material';
import { Row } from '@supreme-int/design-system/src/components/Row/Row';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';
import { i18n } from '@supreme-int/i18n';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useState } from 'react';
import { updateSettings } from 'services/web-profile-ssr/app/profile/settings/actions';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';
import { type SessionInfo, SessionsSection } from './SessionsSection';

type UserSettings = {
  isNewMessageNotificationsEnabled: boolean;
  isScheduleChangeNotificationsEnabled: boolean;
};

type Props = {
  initialSettings: UserSettings;
  sessions: SessionInfo[];
};

export const SettingsPage = ({ initialSettings, sessions }: Props) => {
  const router = useRouter();
  const [userSettings, setUserSettings] = useState<UserSettings>(initialSettings);

  const createOnSwitchChange = (key: keyof UserSettings) => async (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setUserSettings((prev) => ({ ...prev, [key]: newValue }));
    await updateSettings({ [key]: newValue });
  };

  return (
    <>
      <DefaultNavbar center={<Typography variant="title1">{i18n('Настройки')}</Typography>} />

      <Stack sx={{ paddingTop: 2, gap: 2 }}>
        <Container>
          <Typography variant="h3">{i18n('Уведомления')}</Typography>

          <Row justifyContent="space-between">
            <Typography variant="body2">{i18n('Уведомления о новом сообщении')}</Typography>
            <Switch
              checked={userSettings.isNewMessageNotificationsEnabled}
              onChange={createOnSwitchChange('isNewMessageNotificationsEnabled')}
            />
          </Row>

          <Row justifyContent="space-between">
            <Typography variant="body2">{i18n('Отправлять уведомления об изменениях расписания')}</Typography>
            <Switch
              checked={userSettings.isScheduleChangeNotificationsEnabled}
              onChange={createOnSwitchChange('isScheduleChangeNotificationsEnabled')}
            />
          </Row>
        </Container>

        <Container>
          <Typography variant="h3">{i18n('Безопасность')}</Typography>
          <Spacer size={4} />
          <Stack direction="row" gap={2}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<EmailOutlinedIcon />}
              onClick={() => router.push('/profile/settings/change-email')}
            >
              {i18n('Сменить email')}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<LockOutlinedIcon />}
              onClick={() => router.push('/profile/settings/change-password')}
            >
              {i18n('Сменить пароль')}
            </Button>
          </Stack>
          <Spacer size={7} />
        </Container>

        <Container>
          <SessionsSection sessions={sessions} />
        </Container>
      </Stack>
    </>
  );
};
