import { LevelInfo, StudentLevel } from './RatingData';

export const LEVEL_CONFIGS: Record<StudentLevel, {title: string; minXP: number; color: string}> = {
  novice: {title: 'Новичок', minXP: 0, color: '#9E9E9E'},
  beginner: {title: 'Начинающий', minXP: 100, color: '#8BC34A'},
  intermediate: {title: 'Продвинутый', minXP: 300, color: '#2196F3'},
  advanced: {title: 'Опытный', minXP: 600, color: '#9C27B0'},
  expert: {title: 'Эксперт', minXP: 1000, color: '#FF9800'},
  master: {title: 'Мастер', minXP: 1500, color: '#F44336'},
  legend: {title: 'Легенда', minXP: 2500, color: '#D4AF37'},
};

export const calculateLevel = (xp: number): LevelInfo => {
  const levels: StudentLevel[] = ['novice', 'beginner', 'intermediate', 'advanced', 'expert', 'master', 'legend'];
  let currentLevel: StudentLevel = 'novice';
  for (const level of levels) {
    if (xp >= LEVEL_CONFIGS[level].minXP) {
      currentLevel = level;
    } else {
      break;
    }
  }
  const currentConfig = LEVEL_CONFIGS[currentLevel];
  const currentIndex = levels.indexOf(currentLevel);
  const nextLevel = levels[currentIndex + 1];
  const nextLevelXP = nextLevel ? LEVEL_CONFIGS[nextLevel].minXP : currentConfig.minXP;
  return {level: currentLevel, title: currentConfig.title, currentXP: xp, nextLevelXP, color: currentConfig.color};
};

export const calculateXPFromGrades = (averageGrade: number, achievements: number, streak: number): number => {
  const gradeXP = Math.round(averageGrade * 200);
  const achievementXP = achievements * 50;
  const streakXP = streak * 10;
  return gradeXP + achievementXP + streakXP;
};
