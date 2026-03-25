import Box from '@mui/material/Box';
import { fetchUniversityNews } from '../../src/shared/api/universityNews';
import { AuthForm } from '../../src/widgets/AuthForm/AuthForm';
import { NewsSidebar } from '../../src/widgets/NewsSidebar/NewsSidebar';

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const news = await fetchUniversityNews();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'stretch' }}>
      <NewsSidebar news={news} />
      <AuthForm mode="register" />
    </Box>
  );
}
