'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import type { NewsResponse } from '@supreme-int/api-client/src/generated/core-news/types.gen';

interface Props {
  news: NewsResponse[];
}

export function NewsPage({ news }: Props) {
  if (news.length === 0) {
    return (
      <Typography color="text.secondary" textAlign="center" mt={4}>
        Новости не найдены
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 1.5,
      }}
    >
      {news.map((item) => (
        <Card
          key={item.id}
          component="a"
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', color: 'inherit', height: '100%' }}
        >
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5, p: '12px !important' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 0.5 }}>
              <Chip
                label={item.category}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: '0.625rem', height: 20 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontSize: '0.625rem' }}>
                {item.date}
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5, lineHeight: 1.35 }}>
              {item.title}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
