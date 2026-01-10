import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';

type SubjectRankingProps = {
  name: string;
  teacher: string;
};

export const SubjectRanking = ({ name, teacher }: SubjectRankingProps) => {
  return (
    <Container>
      <Typography>{name}</Typography>
      <Spacer size={1} />
      <Typography color="secondary">{teacher}</Typography>
    </Container>
  );
};
