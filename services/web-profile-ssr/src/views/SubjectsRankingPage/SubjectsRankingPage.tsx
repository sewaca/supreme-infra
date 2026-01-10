'use client';

import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';

import { NavBar } from '@supreme-int/design-system/src/components/NavBar/NavBar';
import Stack from '@mui/material/Stack';
import { List, ListItem, ListItemAvatar, ListItemIcon } from '@mui/material';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import styles from './SubjectsRankingPage.module.css';

const choices: { name: string; priority: number; teacher: string }[][] = [
  [
    { name: 'Дисциплина 1', priority: 1, teacher: 'Преподаватель 1' },
    { name: 'Дисциплина 2', priority: 2, teacher: 'Преподаватель 2' },
    { name: 'Дисциплина 3', priority: 3, teacher: 'Преподаватель 3' },
    { name: 'Дисциплина 4', priority: 4, teacher: 'Преподаватель 4' },
  ],
  [
    { name: 'Дисциплина 1', priority: 1, teacher: 'Преподаватель 1' },
    { name: 'Дисциплина 2', priority: 2, teacher: 'Преподаватель 2' },
  ],
  [
    { name: 'Дисциплина 1', priority: 1, teacher: 'Преподаватель 1' },
    { name: 'Дисциплина 2', priority: 2, teacher: 'Преподаватель 2' },
    { name: 'Дисциплина 3', priority: 3, teacher: 'Преподаватель 3' },
  ],
];

export const SubjectsRankingPage = () => {
  return (
    <>
      <NavBar onBack={() => {}} />
      <Container>
        <Typography variant="h4">Дисциплины по выбору</Typography>
        <Spacer size={4} />
        <Typography variant="body1">
          Отсортируйте дисциплины в порядке убывания приоритета, а затем нажмите сохранить.
        </Typography>
        <Spacer size={4} />
        <Divider />
        <Spacer size={16} />
        <Stack spacing={4}>
          {choices.map((choice, index) => (
            <List key={`${index + 1} discipline choice`}>
              {choice.map((subject) => (
                <ListItem key={subject.name}>
                  <div className={styles.number}>
                    <Typography>{subject.priority}</Typography>
                  </div>
                  <Container>
                    <Typography>{subject.name}</Typography>
                    <Spacer size={1} />
                    <Typography color="secondary">{subject.teacher}</Typography>
                  </Container>
                  <div className={styles.dragHandle}>
                    <DragHandleIcon />
                  </div>
                </ListItem>
              ))}
            </List>
          ))}
        </Stack>
      </Container>
    </>
  );
};
