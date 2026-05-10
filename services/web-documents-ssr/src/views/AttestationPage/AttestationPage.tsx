import Typography from '@mui/material/Typography';
import type { AttestationResponse } from '@supreme-int/api-client/src/generated/core-client-info/types.gen';
import { Attestation } from '../../widgets/Attestation/Attestation';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';

interface Props {
  attestations: AttestationResponse[];
}

export const AttestationPage = ({ attestations }: Props) => {
  return (
    <>
      <DefaultNavbar backPath="/profile" center={<Typography fontWeight={600}>Промежуточная аттестация</Typography>} />
      <Attestation attestations={attestations} />
    </>
  );
};
