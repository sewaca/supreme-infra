import Box from '@mui/material/Box';
import { getUniversityNews } from '../../src/shared/api/universityNews';
import { AuthForm } from '../../src/widgets/AuthForm/AuthForm';
import { NewsSidebar } from '../../src/widgets/NewsSidebar/NewsSidebar';

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const news = await getUniversityNews();

  return (
    <Box sx={{ height: '100dvh', display: 'flex', alignItems: 'stretch', overflow: 'hidden' }}>
      <NewsSidebar news={news} />
      <AuthForm mode="register" />
    </Box>
  );
}
