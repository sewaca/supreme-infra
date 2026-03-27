import { StudentLevel } from './RatingData';

export const LEVEL_CONFIGS: Record<StudentLevel, { title: string; minXP: number; color: string }> = {
  novice: { title: 'Новичок', minXP: 0, color: '#9E9E9E' },
  beginner: { title: 'Начинающий', minXP: 100, color: '#8BC34A' },
  intermediate: { title: 'Продвинутый', minXP: 300, color: '#2196F3' },
  advanced: { title: 'Опытный', minXP: 600, color: '#9C27B0' },
  expert: { title: 'Эксперт', minXP: 1000, color: '#FF9800' },
  master: { title: 'Мастер', minXP: 1500, color: '#F44336' },
  legend: { title: 'Легенда', minXP: 2500, color: '#D4AF37' },
};
