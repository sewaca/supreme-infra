import { Achievement, AchievementType } from './RatingData';

export const ACHIEVEMENT_CONFIGS: Record<
  AchievementType,
  Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress' | 'maxProgress' | 'timesEarned'>
> = {
  excellent_student: { id: 'excellent_student', title: 'Отличник', description: 'Средний балл 4.6 и выше', icon: '🏆' },
  unstoppable: {
    id: 'unstoppable',
    title: 'Неудержимый',
    description: 'Вошёл в топ 10% по посещаемости за всё время',
    icon: '🔥',
  },
  top_1_percent: { id: 'top_1_percent', title: 'Топ 1%', description: 'Вошёл в топ 1% по университету', icon: '👑' },
  first_try: { id: 'first_try', title: 'С первого раза', description: 'Сдал все экзамены с первого раза', icon: '🎯' },
  perfectionist: { id: 'perfectionist', title: 'Перфекционист', description: 'Средний балл 5.0 за сессию', icon: '💎' },
  group_leader: { id: 'group_leader', title: 'Староста', description: 'Является старостой группы', icon: '⭐' },
  communicative: {
    id: 'communicative',
    title: 'Коммуникабельный',
    description: 'Вошёл в топ 5% по сообщениям в ЛК',
    icon: '💬',
  },
  early_bird: {
    id: 'early_bird',
    title: 'Ранняя пташка',
    description: 'Ни разу не пропустил первую пару за семестр',
    icon: '🌅',
  },
  iron_man: { id: 'iron_man', title: 'Железный человек', description: 'Посещаемость 100% за семестр', icon: '🦾' },
};

export const getAchievementProgress = (achievement: Achievement): string => {
  if (achievement.unlocked) return '100%';
  if (!achievement.progress || !achievement.maxProgress) return '0%';
  return `${Math.round((achievement.progress / achievement.maxProgress) * 100)}%`;
};
