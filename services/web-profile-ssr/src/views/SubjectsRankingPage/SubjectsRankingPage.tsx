'use client';

import { Typography } from '@mui/material';
import { NavBar } from '@supreme-int/design-system/src/components/NavBar/NavBar';

export const SubjectsRankingPage = () => {
  return (
    <>
      <NavBar onBack={() => {}} center={<Typography variant="title1">Дисциплины по выбору</Typography>} />
      <div></div>
    </>
  );
};
