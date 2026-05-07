'use client';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SchoolIcon from '@mui/icons-material/School';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import type { ApplicationNotificationResponse } from '@supreme-int/api-client/src/generated/core-applications/types.gen';
import type { NewsResponse } from '@supreme-int/api-client/src/generated/core-news/types.gen';
import type { LessonSlot } from '@supreme-int/api-client/src/generated/core-schedule/types.gen';
import { AppLogo } from '@supreme-int/design-system/src/components/AppLogo/AppLogo';
import {
  GradientCard,
  type GradientCardVariant,
} from '@supreme-int/design-system/src/components/GradientCard/GradientCard';
import { NavBar } from '@supreme-int/design-system/src/components/NavBar/NavBar';
import { ProfileButton } from '../../widgets/ProfileButton/ProfileButton';

// TODO: прибраться + декомпозировать

const LESSON_TYPE_COLORS: Record<string, string> = {
  лекция: '#2196f3',
  лек: '#2196f3',
  практика: '#4caf50',
  пр: '#4caf50',
  лабораторная: '#ff9800',
  лаб: '#ff9800',
  семинар: '#9c27b0',
  сем: '#9c27b0',
};

function getLessonTypeColor(type: string): string {
  const lower = type.toLowerCase();
  for (const [key, color] of Object.entries(LESSON_TYPE_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return '#757575';
}

function formatTime(t: string): string {
  return t.slice(0, 5);
}

type AlertSeverity = 'info' | 'warning' | 'error' | 'success';

function toAlertSeverity(s: string): AlertSeverity {
  if (s === 'warning' || s === 'error' || s === 'success') return s;
  return 'info';
}

const NEWS_CATEGORY_COLORS: Record<string, string> = {
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

function getCategoryColor(cat: string): string {
  return NEWS_CATEGORY_COLORS[cat] ?? '#777a85';
}

interface Props {
  avatar: string | null;
  userName: string;
  lessons: LessonSlot[];
  currentLesson: LessonSlot | null;
  nextLesson: LessonSlot | null;
  greeting: string;
  dateLabel: string;
  unreadMessagesCount: number;
  appNotifications: ApplicationNotificationResponse[];
  greetingVariant: GradientCardVariant;
  news: NewsResponse[];
}

export function HomePage({
  avatar,
  userName,
  lessons,
  currentLesson,
  nextLesson,
  greeting,
  dateLabel,
  unreadMessagesCount,
  appNotifications,
  greetingVariant,
  news,
}: Props) {
  const firstName = userName.split(' ')[0] ?? userName;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <NavBar leftSlot={<AppLogo href="/" />} rightSlot={<ProfileButton avatar={avatar} name={userName} />} />

      <Box sx={{ flex: 1, overflow: 'auto', px: 2, pb: 2 }}>
        {/* Greeting hero */}
        <GradientCard
          variant={greetingVariant}
          sx={{ mt: 2, mb: 2.5, px: 2.5, py: 2, borderRadius: 3, ...fadeSlideUp(0) }}
        >
          <Typography variant="caption" sx={{ opacity: 0.7, textTransform: 'capitalize', letterSpacing: 0.3 }}>
            {dateLabel}
          </Typography>
          <Typography variant="h6" fontWeight={700} sx={{ mt: 0.25, lineHeight: 1.2 }}>
            {greeting}
            {firstName ? `, ${firstName}` : ''}!
          </Typography>

          {currentLesson ? (
            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SchoolIcon sx={{ fontSize: 14, opacity: 0.8 }} />
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                Идёт сейчас: {currentLesson.subject_name} — до {formatTime(currentLesson.end_time)}
              </Typography>
            </Box>
          ) : nextLesson ? (
            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeIcon sx={{ fontSize: 14, opacity: 0.8 }} />
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                Следующая пара в {formatTime(nextLesson.start_time)} — {nextLesson.subject_name}
              </Typography>
            </Box>
          ) : lessons.length > 0 ? (
            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SchoolIcon sx={{ fontSize: 14, opacity: 0.8 }} />
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                Пары на сегодня завершены
              </Typography>
            </Box>
          ) : (
            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SchoolIcon sx={{ fontSize: 14, opacity: 0.8 }} />
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                Сегодня пар нет — отдыхай!
              </Typography>
            </Box>
          )}
        </GradientCard>

        {/* Quick stats */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, ...fadeSlideUp(1) }}>
          <QuickStatCard
            href="/schedule"
            icon={<CalendarTodayIcon sx={{ fontSize: 20 }} />}
            label="Расписание"
            value={lessons.length > 0 ? `${lessons.length} ${pluralPairs(lessons.length)}` : 'Нет пар'}
            color="#2b4878"
          />
          <QuickStatCard
            href="/messages"
            icon={<ChatBubbleOutlineIcon sx={{ fontSize: 20 }} />}
            label="Сообщения"
            value={unreadMessagesCount > 0 ? `${unreadMessagesCount} новых` : 'Нет новых'}
            color={unreadMessagesCount > 0 ? '#c62828' : '#424242'}
          />
          <QuickStatCard
            href="/profile/orders?retpath=%2F"
            icon={<NotificationsNoneIcon sx={{ fontSize: 20 }} />}
            label="Уведомления"
            value={appNotifications.length > 0 ? `${appNotifications.length} шт.` : 'Нет'}
            color={appNotifications.length > 0 ? '#e65100' : '#424242'}
          />
        </Box>

        {/* App notifications */}
        {appNotifications.length > 0 && (
          <Box sx={{ mb: 2.5, ...fadeSlideUp(2) }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary', mb: 1.25 }}>
              <NotificationsNoneIcon sx={{ fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                Уведомления
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {appNotifications.map((n) => {
                const href = n.action ?? `/profile/orders?orderId=${n.application_id}&retpath=%2F`;
                return (
                  <Box key={n.id} component="a" href={href} sx={{ display: 'block', textDecoration: 'none' }}>
                    <Alert
                      severity={toAlertSeverity(n.severity)}
                      sx={{
                        borderRadius: 2,
                        fontSize: '0.75rem',
                        '& .MuiAlert-message': { fontSize: '0.75rem', lineHeight: '1.75' },
                      }}
                    >
                      {n.message}
                    </Alert>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Today's schedule */}
        <Section
          animIndex={appNotifications.length > 0 ? 3 : 2}
          title="Расписание на сегодня"
          icon={<CalendarTodayIcon sx={{ fontSize: 18 }} />}
          action={{ label: 'Все', href: '/schedule' }}
        >
          {lessons.length === 0 ? (
            <Box
              sx={{
                py: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                color: 'text.secondary',
              }}
            >
              <SchoolIcon sx={{ fontSize: 36, opacity: 0.3 }} />
              <Typography variant="body2">Пар сегодня нет</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {lessons.map((lesson, idx) => (
                <LessonRow
                  key={`${lesson.teacher_id}${lesson.start_time}${lesson.slot_number}`}
                  lesson={lesson}
                  isLast={idx === lessons.length - 1}
                />
              ))}
            </Box>
          )}
        </Section>

        {/* Latest news */}
        {news.length > 0 && (
          <Section
            animIndex={appNotifications.length > 0 ? 4 : 3}
            title="Последние новости"
            icon={<MenuBookIcon sx={{ fontSize: 18 }} />}
            action={{ label: 'Все новости', href: '/news' }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {news.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </Box>
          </Section>
        )}
      </Box>
    </Box>
  );
}

const ANIM_STEP_MS = 80;

function fadeSlideUp(index: number): object {
  return {
    '@keyframes fadeSlideUp': {
      from: { opacity: 0, transform: 'translateY(14px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
    animation: `fadeSlideUp 0.38s ease both`,
    animationDelay: `${index * ANIM_STEP_MS}ms`,
  };
}

function pluralPairs(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'пара';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'пары';
  return 'пар';
}

interface QuickStatCardProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

function QuickStatCard({ href, icon, label, value, color }: QuickStatCardProps) {
  return (
    <Card
      component="a"
      href={href}
      sx={{
        flex: 1,
        textDecoration: 'none',
        color: 'inherit',
        borderRadius: 2.5,
        '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
        '&:active': { transform: 'scale(0.97)' },
        transition: 'box-shadow 0.18s ease, transform 0.18s ease',
      }}
    >
      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75, alignItems: 'flex-start' }}>
        <Box sx={{ color }}>{icon}</Box>
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, fontSize: '0.65rem' }}>
          {label}
        </Typography>
        <Typography variant="caption" fontWeight={700} sx={{ lineHeight: 1.2, fontSize: '0.7rem', color }}>
          {value}
        </Typography>
      </Box>
    </Card>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  action?: { label: string; href: string };
  children: React.ReactNode;
  animIndex?: number;
}

function Section({ title, icon, action, children, animIndex }: SectionProps) {
  return (
    <Box sx={{ mb: 2.5, ...(animIndex !== undefined ? fadeSlideUp(animIndex) : {}) }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
          {icon}
          <Typography variant="subtitle2" fontWeight={700} color="text.primary">
            {title}
          </Typography>
        </Box>
        {action && (
          <Typography
            component="a"
            href={action.href}
            variant="caption"
            sx={{ color: 'primary.main', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 0.25 }}
          >
            {action.label}
            <ArrowForwardIosIcon sx={{ fontSize: 10 }} />
          </Typography>
        )}
      </Box>
      <Card elevation={0} sx={{ borderRadius: 2.5, overflow: 'hidden', boxShadow: 'none' }}>
        {children}
      </Card>
    </Box>
  );
}

function LessonRow({ lesson, isLast }: { lesson: LessonSlot; isLast: boolean }) {
  const typeColor = getLessonTypeColor(lesson.lesson_type);
  return (
    <>
      <Box sx={{ px: 2, py: 1.5, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Box sx={{ minWidth: 52, textAlign: 'center', pt: 0.25 }}>
          <Typography
            variant="caption"
            fontWeight={700}
            color="text.primary"
            sx={{ display: 'block', fontSize: '0.75rem' }}
          >
            {formatTime(lesson.start_time)}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
            {formatTime(lesson.end_time)}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.4, flexWrap: 'wrap' }}>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
            >
              {lesson.subject_name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <Chip
              label={lesson.lesson_type}
              size="small"
              sx={{
                height: 16,
                fontSize: '0.6rem',
                fontWeight: 600,
                backgroundColor: `${typeColor}1a`,
                color: typeColor,
                border: `1px solid ${typeColor}40`,
              }}
            />
            {lesson.classroom_name && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                ауд. {lesson.classroom_name}
                {lesson.classroom_building ? ` (${lesson.classroom_building})` : ''}
              </Typography>
            )}
            {lesson.teacher_name && (
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', fontStyle: 'italic' }}>
                {lesson.teacher_name}
              </Typography>
            )}
          </Box>
        </Box>
        {lesson.slot_number != null && (
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ fontSize: '0.65rem', minWidth: 16, textAlign: 'right', pt: 0.25 }}
          >
            #{lesson.slot_number}
          </Typography>
        )}
      </Box>
      {!isLast && <Divider sx={{ mx: 2 }} />}
    </>
  );
}

function NewsCard({ item }: { item: NewsResponse }) {
  const color = getCategoryColor(item.category);
  return (
    <CardActionArea
      component="a"
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      sx={{ borderRadius: 2, overflow: 'hidden' }}
    >
      <Card
        sx={{
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: 3,
            backgroundColor: color,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, pl: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Chip
              label={item.category}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.6rem',
                fontWeight: 600,
                backgroundColor: `${color}1a`,
                color,
                border: `1px solid ${color}40`,
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                {item.date.replace(/\s+\d{4}$/, '')}
              </Typography>
              <OpenInNewIcon sx={{ fontSize: 10, color: 'text.disabled' }} />
            </Box>
          </Box>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.title}
          </Typography>
        </Box>
      </Card>
    </CardActionArea>
  );
}
