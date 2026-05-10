import type { AcademicDebtResponse } from '@supreme-int/api-client/src/generated/core-client-info/types.gen';
import { Debts } from '../../widgets/Debts/Debts';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';

interface Props {
  debts: AcademicDebtResponse[];
  senderName: string;
}

export const DebtsPage = ({ debts, senderName }: Props) => {
  return (
    <>
      <DefaultNavbar backPath="/documents/gradebook" />
      <Debts debts={debts} senderName={senderName} />
    </>
  );
};
