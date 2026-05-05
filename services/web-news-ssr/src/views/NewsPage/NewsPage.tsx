'use client';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
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
  return dateStr.replace(/\s+\d{4}$/, '');
}

function FeaturedCard({ item }: { item: NewsResponse }) {
  const color = getCategoryColor(item.category);
  const domain = getDomain(item.url);

  return (
    <Card
      component="a"
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
        background: `linear-gradient(135deg, ${color}22 0%, ${color}08 100%)`,
        border: `1px solid ${color}30`,
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${color} 0%, ${color}88 100%)`,
        },
      }}
    >
      <Box sx={{ p: 2.5, pt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
          <Chip
            label={item.category}
            size="small"
            sx={{
              fontSize: '0.7rem',
              height: 22,
              fontWeight: 700,
              backgroundColor: `${color}20`,
              color,
              border: `1px solid ${color}50`,
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {formatDate(item.date)}
          </Typography>
        </Box>

        <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.4, mb: 1.5 }}>
          {item.title}
        </Typography>

        {domain && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
              {domain}
            </Typography>
            <OpenInNewIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
          </Box>
        )}
      </Box>
    </Card>
  );
}

function CompactCard({ item, isLast }: { item: NewsResponse; isLast: boolean }) {
  const color = getCategoryColor(item.category);
  const domain = getDomain(item.url);

  return (
    <>
      <Box
        component="a"
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          display: 'flex',
          gap: 1.5,
          px: 2,
          py: 1.5,
          textDecoration: 'none',
          color: 'inherit',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 8,
            bottom: 8,
            width: 3,
            borderRadius: '0 2px 2px 0',
            backgroundColor: color,
          },
          '&:hover': { backgroundColor: 'action.hover' },
          transition: 'background-color 0.15s ease',
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              lineHeight: 1.4,
              mb: 0.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={item.category}
              size="small"
              sx={{
                height: 16,
                fontSize: '0.6rem',
                fontWeight: 600,
                backgroundColor: `${color}1a`,
                color,
                border: `1px solid ${color}40`,
              }}
            />
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
              {formatDate(item.date)}
            </Typography>
            {domain && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                  {domain}
                </Typography>
                <OpenInNewIcon sx={{ fontSize: 9, color: 'text.disabled' }} />
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      {!isLast && <Divider sx={{ mx: 2 }} />}
    </>
  );
}

export function NewsPage({ news }: Props) {
  if (news.length === 0) {
    return (
      <Typography color="text.secondary" textAlign="center" mt={4}>
        Новости не найдены
      </Typography>
    );
  }

  const [featured, ...rest] = news;

  return (
    <Box sx={{ pb: 2 }}>
      {/* Featured */}
      <Box sx={{ px: 2, pt: 2, pb: rest.length > 0 ? 2 : 0 }}>
        <FeaturedCard item={featured} />
      </Box>

      {/* Rest as compact list */}
      {rest.length > 0 && (
        <Card elevation={0} sx={{ mx: 2, borderRadius: 2.5, overflow: 'hidden', boxShadow: 'none' }}>
          {rest.map((item, idx) => (
            <CompactCard key={item.id} item={item} isLast={idx === rest.length - 1} />
          ))}
        </Card>
      )}
    </Box>
  );
}
