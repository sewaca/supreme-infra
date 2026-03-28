import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export const dynamic = 'force-dynamic';

export default function NewsPage() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 2,
        color: 'text.secondary',
      }}
    >
      <Typography variant="h6">Новости</Typography>
      <Typography variant="body2">Скоро будет доступно</Typography>
    </Box>
  );
}
