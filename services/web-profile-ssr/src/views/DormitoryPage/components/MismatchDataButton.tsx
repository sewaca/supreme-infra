'use client';
import Button from '@mui/material/Button';
import { i18n } from '@supreme-int/i18n/src';
import { ReactNode, useState } from 'react';
import { AlertMessage } from 'services/web-profile-ssr/src/widgets/AlertMessage/AlertMessage';

export const MismatchDataButton = () => {
  const [alert, setAlert] = useState<ReactNode>(null);

  return (
    <>
      <Button
        variant="contained"
        color="error"
        fullWidth
        sx={{ marginTop: 'auto' }}
        onClick={() =>
          // TODO: открывать в формате модалки с подробной информацией про студ городок (время работы, где находится, номер телефона и тд)
          // TODO: когда доделаем чаты – сделать ссылку на чат с поддержкой и id=студ городок
          setAlert(
            <AlertMessage setAlert={setAlert} severity="info" title={i18n('Обновить данные можно в студгородке')} />,
          )
        }
      >
        {i18n('Данные не актуальны')}
      </Button>
      {alert}
    </>
  );
};
