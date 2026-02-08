import { Button, Container, Divider, Stack, Typography } from '@mui/material';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';
import { i18n } from '@supreme-int/i18n/src';
import { Fragment, memo, ReactNode, useState } from 'react';
import { saveChoices } from 'services/web-profile-ssr/app/subjects/ranking/actions';
import { SubjectRanking } from '../../entities/SubjectRanking/SubjectRanking';
import { AlertMessage } from '../../widgets/AlertMessage/AlertMessage';
import { SortedList } from '../../widgets/SortedList/SortedList';
import { Subject } from './SubjectsRankingPage';

type Props = {
  subjects: { id: string; subjects: Subject[] }[];
  deadlineDate: string;
};
export const SubjectsRankingPageView = memo(({ subjects, deadlineDate }: Props) => {
  const [choices, setChoices] = useState(subjects);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<ReactNode>(null);

  const createListOnChange = (listIndex: number) => (newItems: Subject[]) => {
    const newChoices = [...choices];
    newChoices[listIndex].subjects = newItems;
    setChoices(newChoices);
  };

  const handleSave = async () => {
    setAlert(null);
    setLoading(true);
    try {
      const choicesToSave = choices.map((group) => ({
        id: group.id,
        priorities: group.subjects.map((subject) => subject.id),
      }));

      const result = await saveChoices(choicesToSave);

      if (!result) {
        throw new Error('Failed to save choices');
      }

      setAlert(<AlertMessage severity="success" title={i18n('Сохранено!')} setAlert={setAlert} />);
    } catch {
      setAlert(<AlertMessage severity="error" title={i18n('Что-то пошло не так')} setAlert={setAlert} />);
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
              items={choice.subjects}
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
