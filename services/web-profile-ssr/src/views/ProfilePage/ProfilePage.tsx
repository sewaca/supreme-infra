import { LogoutOutlined } from '@mui/icons-material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import AutoAwesomeMotionIcon from '@mui/icons-material/AutoAwesomeMotion';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import ImportContactsIcon from '@mui/icons-material/ImportContacts';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { IconButton, Paper, Typography } from '@mui/material';
import { Row } from '@supreme-int/design-system/src/components/Row/Row';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';
import Coin from '@supreme-int/design-system/src/icons/Coin.png';
import House from '@supreme-int/design-system/src/icons/House.png';
import { i18n } from '@supreme-int/i18n/src/i18n';
import { ProfileData } from '../../entities/Profile/ProfileData';
import { ButtonCard } from '../../widgets/ButtonCard/ButtonCard';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';
import { LinkRow } from '../../widgets/LinkRow/LinkRow';
import styles from './ProfilePage.module.css';

type Props = { data: ProfileData };
export const ProfilePage = ({ data }: Props) => {
  return (
    <Paper sx={{ minHeight: '100dvh', background: '#edeff2' }} elevation={0}>
      <DefaultNavbar
        rightSlot={
          // TODO: add logout action
          // TODO: move logout button into another component
          <IconButton color="inherit">
            <LogoutOutlined />
          </IconButton>
        }
        position="absolute"
      />

      <Spacer size={14} />
      <img src={data.avatar} className={styles.avatar} />
      <Spacer size={6} />

      <Typography variant="h2" textAlign="center">
        {data.lastName} {data.name}
      </Typography>

      <Spacer size={22} />

      <Row gap={2} direction="row" justifyContent="center" sx={{ padding: '0 24px' }}>
        <ButtonCard
          icon={<img src={Coin.src} alt="Coin" />}
          title={i18n('Стипендия')}
          subtitle={data.scholarship ? `${data.scholarship.value} ₽/м.` : i18n('Вы не получаете стипендию')}
          status={data.scholarship ? 'success' : 'error'}
          notifications={data.scholarship?.notifications}
          href="/api/undefined-url"
        />

        <ButtonCard
          icon={<img src={House.src} alt="House" />}
          title={i18n('Общежитие')}
          subtitle={data.dormitory ? data.dormitory.value : i18n('Вы не проживаете в общежитии')}
          status={data.dormitory ? 'success' : 'error'}
          notifications={data.dormitory?.notifications}
          href="/profile/dormitory"
        />
      </Row>

      <Spacer size={12} />

      <Paper
        elevation={5}
        sx={{
          height: '100%',
          padding: '12px 0 16px 0',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          background: 'var(--color-background-secondary)',
          overflow: 'hidden',
        }}
      >
        <LinkRow
          href="/profile/references"
          icon={<FileCopyIcon fontSize="medium" color="inherit" />}
          title={i18n('Получить справку')}
        />
        <LinkRow href="/api/undefined-url" icon={<ImportContactsIcon fontSize="medium" />} title={i18n('Зачётка')} />
        <LinkRow href="/profile/settings" icon={<SettingsIcon fontSize="medium" />} title={i18n('Настройки')} />
        <LinkRow
          href="/profile/subjects-ranking"
          icon={<AutoAwesomeMotionIcon fontSize="medium" />}
          title={i18n('Дисциплины по выбору')}
        />
        <LinkRow href="/profile/rating" icon={<TrendingUpIcon fontSize="medium" />} title={i18n('Мой рейтинг')} />
        <LinkRow href="/profile/data" icon={<PersonIcon fontSize="medium" />} title={i18n('Личные данные')} />
        <LinkRow
          href="/api/undefined-url"
          icon={<AssignmentIndIcon fontSize="medium" />}
          title={i18n('Электронный студенческий')}
        />
        <LinkRow href="/profile/orders" icon={<AccountBalanceIcon fontSize="medium" />} title={i18n('Приказы')} />
      </Paper>
    </Paper>
  );
};
