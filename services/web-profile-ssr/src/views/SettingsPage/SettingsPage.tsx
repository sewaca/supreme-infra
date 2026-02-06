'use client';

import { Box, Container, Paper, Stack, Switch, Typography } from '@mui/material';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';
import { Row } from '@supreme-int/design-system/src/components/Row/Row';
import { ChangeEvent, useState } from 'react';

type UserSettings = {
  isNewMessageNotificationsEnabled: boolean;
  isScheduleChangeNotificationsEnabled: boolean;
};

const mockedUserSettings: UserSettings = {
  isNewMessageNotificationsEnabled: true,
  isScheduleChangeNotificationsEnabled: true,
};

export const SettingsPage = () => {
  const [userSettings, setUserSettings] = useState<UserSettings>(mockedUserSettings);

  const createOnSwitchChange = (key: keyof UserSettings) => (event: ChangeEvent<HTMLInputElement>) => {
    setUserSettings((prev) => ({ ...prev, [key]: event.target.checked }));
  };

  return (
    <>
      <DefaultNavbar center={<Typography variant="title1">Настройки</Typography>} />

      <Container sx={{ paddingTop: 2 }}>
        <Typography variant="h3">Уведомления</Typography>

        <Row justifyContent="space-between">
          <Typography variant="body2">Уведомления о новом сообщении</Typography>
          <Switch
            checked={userSettings.isNewMessageNotificationsEnabled}
            onChange={createOnSwitchChange('isNewMessageNotificationsEnabled')}
          />
        </Row>

        <Row justifyContent="space-between">
          <Typography variant="body2">Отправлять уведомления об изменениях расписания</Typography>
          <Switch
            checked={userSettings.isScheduleChangeNotificationsEnabled}
            onChange={createOnSwitchChange('isScheduleChangeNotificationsEnabled')}
          />
        </Row>
      </Container>

      <Container sx={{ paddingTop: 2 }}>
        <Typography variant="h3">Безопасность</Typography>

        <Row justifyContent="space-between">
          <Typography variant="body2">Сменить пароль</Typography>
          <Switch
            checked={userSettings.isNewMessageNotificationsEnabled}
            onChange={createOnSwitchChange('isNewMessageNotificationsEnabled')}
          />
        </Row>
      </Container>
    </>
  );
};
