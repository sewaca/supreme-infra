import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import AutoAwesomeMotionIcon from '@mui/icons-material/AutoAwesomeMotion';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import ImportContactsIcon from '@mui/icons-material/ImportContacts';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Box, Card, Divider, Typography } from '@mui/material';
import Coin from '@supreme-int/design-system/src/icons/Coin.png';
import House from '@supreme-int/design-system/src/icons/House.png';
import { i18n } from '@supreme-int/i18n/src/i18n';
import { ProfileData } from '../../entities/Profile/ProfileData';
import { ButtonCard } from '../../widgets/ButtonCard/ButtonCard';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';
import { LinkRow } from '../../widgets/LinkRow/LinkRow';
import { LogoutButton } from '../../widgets/LogoutButton/LogoutButton';
import styles from './ProfilePage.module.css';

type Props = { data: ProfileData };
export const ProfilePage = ({ data }: Props) => {
  return (
    <Box
      sx={{ minHeight: 'var(--user-screen-height)', display: 'flex', flexDirection: 'column', position: 'relative' }}
    >
      <DefaultNavbar rightSlot={<LogoutButton />} position="absolute" />

      <Box sx={{ flex: 1, overflow: 'auto', px: 2, pb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 8, pb: 3 }}>
          {data.avatar ? (
            <img src={data.avatar} alt="Фото" className={styles.avatar} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {data.lastName[0]}
              {data.name[0]}
            </div>
          )}
          <Typography variant="h2" textAlign="center" sx={{ mt: 1.5 }}>
            {data.lastName} {data.name}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <ButtonCard
            icon={<img src={Coin.src} alt="Coin" />}
            title={i18n('Стипендия')}
            subtitle={data.scholarship ? `${data.scholarship.value} ₽/мес.` : i18n('Вы не получаете стипендию')}
            status={data.scholarship ? 'success' : 'error'}
            notifications={data.scholarship?.notifications}
            href="/profile/scholarship"
          />
          <ButtonCard
            icon={<img src={House.src} alt="House" />}
            title={i18n('Общежитие')}
            subtitle={data.dormitory ? data.dormitory.value : i18n('Вы не проживаете в общежитии')}
            status={data.dormitory ? 'success' : 'error'}
            notifications={data.dormitory?.notifications}
            href="/profile/dormitory"
          />
        </Box>

        <Card elevation={0} sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
          <LinkRow
            href="/profile/references"
            icon={<FileCopyIcon fontSize="medium" color="inherit" />}
            title={i18n('Получить справку')}
          />
          <Divider sx={{ mx: 2 }} />
          <LinkRow
            href="/documents/gradebook"
            icon={<ImportContactsIcon fontSize="medium" color="inherit" />}
            title={i18n('Зачётка')}
          />
          <Divider sx={{ mx: 2 }} />
          <LinkRow
            href="/profile/settings"
            icon={<SettingsIcon fontSize="medium" color="inherit" />}
            title={i18n('Настройки')}
          />
          <Divider sx={{ mx: 2 }} />
          <LinkRow
            href="/profile/subjects-ranking"
            icon={<AutoAwesomeMotionIcon fontSize="medium" color="inherit" />}
            title={i18n('Дисциплины по выбору')}
          />
          <Divider sx={{ mx: 2 }} />
          <LinkRow
            href="/profile/rating"
            icon={<TrendingUpIcon fontSize="medium" color="inherit" />}
            title={i18n('Мой рейтинг')}
          />
          <Divider sx={{ mx: 2 }} />
          <LinkRow
            href="/profile/data"
            icon={<PersonIcon fontSize="medium" color="inherit" />}
            title={i18n('Личные данные')}
          />
          <Divider sx={{ mx: 2 }} />
          <LinkRow
            href="/documents/student-id-card"
            icon={<AssignmentIndIcon fontSize="medium" color="inherit" />}
            title={i18n('Электронный студенческий')}
          />
          <Divider sx={{ mx: 2 }} />
          <LinkRow
            href="/profile/orders"
            icon={<AccountBalanceIcon fontSize="medium" color="inherit" />}
            title={i18n('Приказы')}
          />
        </Card>
      </Box>
    </Box>
  );
};
