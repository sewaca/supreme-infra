'use client';

import { Button, Container, Stack, Switch, Typography } from '@mui/material';
import { Row } from '@supreme-int/design-system/src/components/Row/Row';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';
import { i18n } from '@supreme-int/i18n';
import { ChangeEvent, useState } from 'react';
import { updateSettings } from 'services/web-profile-ssr/app/profile/settings/actions';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';
import { ChangeEmailModal } from './ChangeEmailModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { type SessionInfo, SessionsSection } from './SessionsSection';

export type UserSettings = {
  isNewMessageNotificationsEnabled: boolean;
  isScheduleChangeNotificationsEnabled: boolean;
};

type Props = {
  initialSettings: UserSettings;
  sessions: SessionInfo[];
};

export const SettingsPage = ({ initialSettings, sessions }: Props) => {
  const [userSettings, setUserSettings] = useState<UserSettings>(initialSettings);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

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
            <Button variant="contained" color="inherit" onClick={() => setIsEmailModalOpen(true)}>
              {i18n('Сменить email')}
            </Button>
            <Button variant="contained" color="inherit" onClick={() => setIsPasswordModalOpen(true)}>
              {i18n('Сменить пароль')}
            </Button>
          </Stack>
          <Spacer size={7} />
        </Container>

        <Container>
          <SessionsSection sessions={sessions} />
        </Container>
      </Stack>

      <ChangeEmailModal open={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} />
      <ChangePasswordModal open={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
    </>
  );
};
