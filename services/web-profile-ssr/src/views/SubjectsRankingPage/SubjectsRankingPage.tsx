'use client';

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Alert, AlertColor, Button, IconButton, Snackbar } from '@mui/material';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { NavBar } from '@supreme-int/design-system/src/components/NavBar/NavBar';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';
import { i18n } from '@supreme-int/i18n';
import { Fragment, ReactNode, useEffect, useState } from 'react';
import { saveChoices } from 'services/web-profile-ssr/app/subjects/ranking/actions';
import { SubjectRanking } from '../../entities/SubjectRanking/SubjectRanking';
import { useProductTour } from '../../shared/hooks/useProductTour';
import { SortedList } from '../../widgets/SortedList/SortedList';
import type { SortableItem } from '../../widgets/SortedList/types';
import { getSubjectsRankingTourSteps } from './tour-config';

type Subject = SortableItem & { name: string; teacher: string };

// DATA:
const initialChoices: Subject[][] = [
  [
    { id: '1-1', name: i18n('Дисциплина 1'), priority: 1, teacher: i18n('Преподаватель 1') },
    { id: '1-2', name: i18n('Дисциплина 2'), priority: 2, teacher: i18n('Преподаватель 2') },
    { id: '1-3', name: i18n('Дисциплина 3'), priority: 3, teacher: i18n('Преподаватель 3') },
    { id: '1-4', name: i18n('Дисциплина 4'), priority: 4, teacher: i18n('Преподаватель 4') },
  ],
  [
    { id: '2-1', name: i18n('Дисциплина 1'), priority: 1, teacher: i18n('Преподаватель 1') },
    { id: '2-2', name: i18n('Дисциплина 2'), priority: 2, teacher: i18n('Преподаватель 2') },
  ],
  [
    { id: '3-1', name: i18n('Дисциплина 1'), priority: 1, teacher: i18n('Преподаватель 1') },
    { id: '3-2', name: i18n('Дисциплина 2'), priority: 2, teacher: i18n('Преподаватель 2') },
    { id: '3-3', name: i18n('Дисциплина 3'), priority: 3, teacher: i18n('Преподаватель 3') },
  ],
];
const deadlineDate = '17.01.2026';

const AlertMessage = ({ severity, children }: { severity: AlertColor; children: ReactNode }) => {
  return (
    <Snackbar open={true} autoHideDuration={5000} anchorOrigin={{ horizontal: 'center', vertical: 'top' }}>
      <Alert severity={severity} variant="filled">
        {children}
      </Alert>
    </Snackbar>
  );
};

const TOUR_COMPLETED_KEY = 'subjects-ranking-tour-completed';

export const SubjectsRankingPage = () => {
  const [choices, setChoices] = useState(initialChoices);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<ReactNode>(null);

  const { startTour } = useProductTour({
    steps: getSubjectsRankingTourSteps(deadlineDate),
    onComplete: () => localStorage.setItem(TOUR_COMPLETED_KEY, 'true'),
    onSkip: () => localStorage.setItem(TOUR_COMPLETED_KEY, 'true'),
    showProgress: true,
    allowClose: true,
  });

  useEffect(() => {
    const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
    if (!tourCompleted) {
      const timer = setTimeout(() => {
        startTour();
      }, 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [startTour]);

  const createListOnChange = (listIndex: number) => (newItems: Subject[]) => {
    const newChoices = [...choices];
    newChoices[listIndex] = newItems;
    setChoices(newChoices);
  };

  const handleSave = async () => {
    setAlert(null);
    setLoading(true);
    try {
      const result = await saveChoices(choices as { [key: string]: string | number }[][]);

      if (!result) {
        throw new Error('Failed to save choices');
      }

      setAlert(<AlertMessage severity="success">{i18n('Сохранено!')}</AlertMessage>);
    } catch {
      setAlert(<AlertMessage severity="error">{i18n('Что-то пошло не так')}</AlertMessage>);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavBar onBack={() => {}} />
      <Container>
        <Spacer size={8} />
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h5">{i18n('Дисциплины по выбору')}</Typography>
          <IconButton
            size="small"
            onClick={startTour}
            aria-label={i18n('Показать обучение')}
            sx={{ color: 'text.secondary' }}
          >
            <HelpOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
        <Spacer size={6} />
        <Typography variant="body2">
          {i18n('Отсортируйте дисциплины в порядке убывания приоритета, а затем нажмите сохранить.')}
        </Typography>

        <Spacer size={8} />
        <Divider />
        <Spacer size={8} />

        <Stack spacing={0}>
          {choices.map((choice, listIndex) => (
            <Fragment key={`${listIndex + 1} discipline choice`}>
              <SortedList
                items={choice}
                onItemsChange={createListOnChange(listIndex)}
                renderItem={(item) => <SubjectRanking name={item.name} teacher={item.teacher} />}
              />

              <Spacer size={8} />

              {listIndex < choices.length - 1 && (
                <>
                  <Divider sx={{ width: '80%', margin: '0 auto' }} />
                  <Spacer size={8} />
                </>
              )}
            </Fragment>
          ))}
        </Stack>

        <Spacer size={8} />
        <Container maxWidth="xs">
          <Button fullWidth variant="outlined" onClick={handleSave} loading={loading} data-tour="save-button">
            <Typography variant="button" component="div">
              {i18n('Сохранить')}
            </Typography>
          </Button>

          <Spacer size={2} />

          <Typography variant="caption" color="secondary" textAlign="center" component="p">
            {i18n('Выбор можно изменить до {{date}}', { date: deadlineDate })}
          </Typography>
        </Container>
        <Spacer size={16} />
      </Container>
      {alert}
    </>
  );
};
