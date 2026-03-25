import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import type { NewsItem } from '../../shared/api/universityNews';
import { getNewsUrl } from '../../shared/api/universityNews';

interface NewsSidebarProps {
  news: NewsItem[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Образование: 'rgba(129,212,250,0.25)',
  Наука: 'rgba(165,214,167,0.25)',
  Индустрия: 'rgba(255,204,128,0.25)',
  Международное: 'rgba(206,147,216,0.25)',
};

export function NewsSidebar({ news }: NewsSidebarProps) {
  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        flex: '0 0 44%',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(160deg, #0d1b4b 0%, #1a237e 60%, #283593 100%)',
        p: 4,
      }}
    >
      {/* Decorative blobs */}
      {[
        { top: '-8%', right: '-6%', size: 280, opacity: 0.06 },
        { bottom: '-6%', left: '-8%', size: 240, opacity: 0.05 },
        { top: '45%', right: '-4%', size: 140, opacity: 0.04 },
      ].map((blob, i) => (
        <Box
          // biome-ignore lint/suspicious/noArrayIndexKey: decorative static blobs
          key={i}
          sx={{
            position: 'absolute',
            width: blob.size,
            height: blob.size,
            borderRadius: '50%',
            bgcolor: `rgba(255,255,255,${blob.opacity})`,
            top: blob.top,
            bottom: blob.bottom,
            left: blob.left,
            right: blob.right,
          }}
        />
      ))}

      {/* University header */}
      <Box sx={{ position: 'relative', zIndex: 1, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              bgcolor: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            🎓
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', lineHeight: 1.2 }}>
              Личный кабинет студента
            </Typography>
            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.02em' }}>
              СПбГУТ им. проф. М.А. Бонч-Бруевича
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2.5 }} />

      {/* News header */}
      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: '#64b5f6',
            boxShadow: '0 0 6px #64b5f6',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.4 },
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}
        >
          Новости университета
        </Typography>
      </Box>

      {/* News list */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          overflowY: 'auto',
          pr: 0.5,
          '&::-webkit-scrollbar': { width: 3 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 },
        }}
      >
        {news.map((item, idx) => (
          <Box
            key={item.url}
            component="a"
            href={getNewsUrl(item)}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: 'block',
              textDecoration: 'none',
              mb: 1.5,
              p: 1.5,
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.07)',
              bgcolor: 'rgba(255,255,255,0.04)',
              transition: 'all 0.18s ease',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.09)',
                border: '1px solid rgba(255,255,255,0.15)',
                transform: 'translateX(2px)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              {item.category && (
                <Chip
                  label={item.category}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    bgcolor: CATEGORY_COLORS[item.category] ?? 'rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.85)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              )}
              {item.date && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>
                  {item.date}
                </Typography>
              )}
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.88)',
                lineHeight: 1.45,
                fontSize: '0.78rem',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {idx === 0 && (
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    bgcolor: '#64b5f6',
                    color: '#0d1b4b',
                    fontSize: '0.55rem',
                    fontWeight: 800,
                    px: 0.5,
                    py: 0.1,
                    borderRadius: 0.5,
                    mr: 0.75,
                    verticalAlign: 'middle',
                    letterSpacing: '0.04em',
                  }}
                >
                  NEW
                </Box>
              )}
              {item.title}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Footer link */}
      <Box sx={{ position: 'relative', zIndex: 1, mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Typography
          component="a"
          href="https://www.sut.ru/bonchnews"
          target="_blank"
          rel="noopener noreferrer"
          variant="caption"
          sx={{
            color: 'rgba(255,255,255,0.45)',
            textDecoration: 'none',
            fontSize: '0.7rem',
            '&:hover': { color: 'rgba(255,255,255,0.7)' },
          }}
        >
          Все новости → sut.ru
        </Typography>
      </Box>
    </Box>
  );
}
