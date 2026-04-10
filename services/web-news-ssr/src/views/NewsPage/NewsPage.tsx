'use client';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import type { NewsResponse } from '@supreme-int/api-client/src/generated/core-news/types.gen';

interface Props {
  news: NewsResponse[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Спорт: '#ed824c',
  Образование: '#24a8e0',
  Политика: '#534bae',
  Культура: '#56c776',
  Экономика: '#1a237e',
  Происшествия: '#ff4c52',
  Технологии: '#188fc7',
  Общество: '#2c9e56',
  Здоровье: '#56c776',
  Наука: '#24a8e0',
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#777a85';
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
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
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 2,
      }}
    >
      {news.map((item) => {
        const color = getCategoryColor(item.category);
        const domain = getDomain(item.url);
        return (
          <Card
            key={item.id}
            component="a"
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              color: 'inherit',
              height: '100%',
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4,
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                backgroundColor: color,
              },
            }}
          >
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, p: 2, pt: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={item.category}
                  size="small"
                  sx={{
                    fontSize: '0.65rem',
                    height: 20,
                    fontWeight: 600,
                    backgroundColor: `${color}1a`,
                    color: color,
                    border: `1px solid ${color}40`,
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontSize: '0.65rem' }}>
                  {formatDate(item.date)}
                </Typography>
              </Box>

              <Typography
                variant="body2"
                fontWeight={600}
                sx={{
                  flex: 1,
                  lineHeight: 1.45,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {item.title}
              </Typography>

              {domain && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pt: 0.5 }}>
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.625rem' }}>
                    {domain}
                  </Typography>
                  <OpenInNewIcon sx={{ fontSize: 10, color: 'text.disabled' }} />
                </Box>
              )}
            </Box>
          </Card>
        );
      })}
    </Box>
  );
}
