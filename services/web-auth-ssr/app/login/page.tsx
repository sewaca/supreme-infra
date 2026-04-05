import Box from '@mui/material/Box';
import { getUniversityNews } from '../../src/shared/api/universityNews';
import { AuthForm } from '../../src/widgets/AuthForm/AuthForm';
import { NewsSidebar } from '../../src/widgets/NewsSidebar/NewsSidebar';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const news = await getUniversityNews();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'stretch' }}>
      <NewsSidebar news={news} />
      <AuthForm mode="login" />
    </Box>
  );
}
