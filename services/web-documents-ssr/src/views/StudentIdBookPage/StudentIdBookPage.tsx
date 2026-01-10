'use client';

import { NavBar } from '@supreme-int/design-system/src/components/NavBar/NavBar';
import { StudentIdBook } from '../../widgets/StudentIdBook/StudentIdBook';

export const StudentIdBookPage = () => {
  return (
    <>
      <NavBar onBack={() => {}} />

      <StudentIdBook />
    </>
  );
};
