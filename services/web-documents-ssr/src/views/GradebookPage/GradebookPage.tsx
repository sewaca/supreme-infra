import type { UserGradeResponse } from '@supreme-int/api-client/src/core-client-info/types.gen';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';
import { Gradebook } from '../../widgets/GradeBook/Gradebook';

interface Props {
  grades: UserGradeResponse[];
}

export const GradebookPage = ({ grades }: Props) => {
  return (
    <>
      <DefaultNavbar center="Зачётная книжка" />
      <Gradebook grades={grades} />
    </>
  );
};
