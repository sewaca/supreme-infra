'use client';

import { i18n } from '@supreme-int/i18n/src';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { AlertMessage } from '../../widgets/AlertMessage/AlertMessage';

type HelpCenterType = 'profile_data' | 'dormitory_info' | 'unknown';

const HELP_MESSAGES: Record<HelpCenterType, string> = {
  profile_data: i18n('Обновить данные можно в деканате'),
  dormitory_info: i18n('Обновить данные можно в студгородке'),
  unknown: i18n('Что-то пошло не так. Попробуйте позже или обратитесь в деканат.'),
};

const getHelpTypeByPath = (pathname: string): HelpCenterType => {
  if (pathname.includes('/profile/dormitory')) {
    return 'dormitory_info';
  }
  if (pathname.includes('/profile/data')) {
    return 'profile_data';
  }
  return 'unknown';
};

export const useHelpCenter = () => {
  const [alert, setAlert] = useState<ReactNode>(null);
  const pathname = usePathname();

  const showHelpAlert = () => {
    const type = getHelpTypeByPath(pathname);
    setAlert(<AlertMessage setAlert={setAlert} severity="info" title={HELP_MESSAGES[type]} />);
  };

  return { alert, showHelpAlert };
};
