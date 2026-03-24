import type {
  PersonalDataResponse,
  StudentStatsResponse,
} from '@supreme-int/api-client/src/core-client-info/types.gen';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';
import { StudentIdBook } from '../../widgets/StudentIdBook/StudentIdBook';

interface Props {
  user: PersonalDataResponse['user'] | null;
  stats: StudentStatsResponse | null;
}

export const StudentIdBookPage = ({ user, stats }: Props) => {
  return (
    <>
      <DefaultNavbar center="Студенческий билет" backPath="/profile" />
      <StudentIdBook user={user} stats={stats} />
    </>
  );
};
