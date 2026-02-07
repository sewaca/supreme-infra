import { ButtonBase, Container, IconButton, Paper, Typography } from '@mui/material';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';
import { LogoutOutlined } from '@mui/icons-material';
import styles from './ProfilePage.module.css';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';
import Coin from '@supreme-int/design-system/src/icons/Coin.png';
import House from '@supreme-int/design-system/src/icons/House.png';
import { Row } from '@supreme-int/design-system/src/components/Row/Row';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { LinkRow } from '../../widgets/LinkRow/LinkRow';
import ImportContactsIcon from '@mui/icons-material/ImportContacts';
import SettingsIcon from '@mui/icons-material/Settings';
import AutoAwesomeMotionIcon from '@mui/icons-material/AutoAwesomeMotion';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { ButtonCard } from '../../widgets/ButtonCard/ButtonCard';

type Props = {};
export const ProfilePage = ({}: Props) => {
  return (
    <Paper sx={{ minHeight: '100dvh' }} elevation={0}>
      <DefaultNavbar
        rightSlot={
          <IconButton color="inherit">
            <LogoutOutlined />
          </IconButton>
        }
        position="absolute"
      />

      <Spacer size={14} />
      <img src="https://placehold.co/600x600" className={styles.avatar} />
      <Spacer size={6} />
      <Typography variant="h2" textAlign="center">
        Булгаков Всеволод
      </Typography>

      <Spacer size={22} />

      <Row gap={2} direction="row" sx={{ padding: '0 16px' }}>
        <ButtonCard
          icon={<img src={Coin.src} alt="Coin" />}
          title="Стипендия"
          subtitle="100 000 P/м."
          status="success"
          href="/undefined-url"
        />

        <ButtonCard
          icon={<img src={House.src} alt="House" />}
          title="Общежитие"
          subtitle="ул. Караваевская, 34"
          status="success"
          href="/undefined-url"
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
          href="/undefined-url"
          icon={<FileCopyIcon fontSize="medium" color="inherit" />}
          title="Получить справку"
        />
        <LinkRow href="/undefined-url" icon={<ImportContactsIcon fontSize="medium" />} title="Зачётка" />
        <LinkRow href="/profile/settings" icon={<SettingsIcon fontSize="medium" />} title="Настройки" />
        <LinkRow
          href="/subjects/ranking"
          icon={<AutoAwesomeMotionIcon fontSize="medium" />}
          title="Дисциплины по выбору"
        />
        <LinkRow href="/undefined-url" icon={<TrendingUpIcon fontSize="medium" />} title="Мой рейтинг" />
        <LinkRow href="/undefined-url" icon={<PersonIcon fontSize="medium" />} title="Личные данные" />
        <LinkRow
          href="/undefined-url"
          icon={<AssignmentIndIcon fontSize="medium" />}
          title="Электронный студенческий"
        />
        <LinkRow href="/undefined-url" icon={<AccountBalanceIcon fontSize="medium" />} title="Приказы" />
      </Paper>
    </Paper>
  );
};
