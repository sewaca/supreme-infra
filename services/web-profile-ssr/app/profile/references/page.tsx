import { ReferencesPage } from 'services/web-profile-ssr/src/views/ReferencesPage/ReferencesPage';
import { getReferenceOrderOptions, getReferences } from './actions';

export default async () => {
  const [references, orderOptions] = await Promise.all([getReferences(), getReferenceOrderOptions()]);
  return <ReferencesPage initialReferences={references} orderOptions={orderOptions} />;
};
