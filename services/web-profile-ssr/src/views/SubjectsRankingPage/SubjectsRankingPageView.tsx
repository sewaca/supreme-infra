import { Stack, Divider, Container, Button, Typography, Alert, AlertColor, Snackbar } from '@mui/material';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';
import { i18n } from '@supreme-int/i18n/src';
import { Fragment, memo, ReactNode, useState } from 'react';
import { SubjectRanking } from '../../entities/SubjectRanking/SubjectRanking';
import { SortedList } from '../../widgets/SortedList/SortedList';
import { Subject } from './SubjectsRankingPage';
import { saveChoices } from 'services/web-profile-ssr/app/subjects/ranking/actions';

type Props = {
  subjects: Subject[][];
  deadlineDate: string;
};
export const SubjectsRankingPageView = memo(({ subjects, deadlineDate }: Props) => {
  const [choices, setChoices] = useState(subjects);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<ReactNode>(null);

  const createListOnChange = (listIndex: number) => (newItems: Subject[]) => {
    const newChoices = [...choices];
    newChoices[listIndex] = newItems;
    setChoices(newChoices);
  };

  const AlertMessage = ({ severity, children }: { severity: AlertColor; children: ReactNode }) => {
    return (
      <Snackbar
        onClose={() => setAlert(null)}
        open={true}
        autoHideDuration={5000}
        anchorOrigin={{ horizontal: 'center', vertical: 'top' }}
      >
        <Alert severity={severity} variant="filled">
          {children}
        </Alert>
      </Snackbar>
    );
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
      <Container maxWidth="xs" data-tour="save-button">
        <Button fullWidth variant="outlined" onClick={handleSave} loading={loading}>
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
      {alert}
    </>
  );
});
