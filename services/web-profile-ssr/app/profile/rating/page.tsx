import { RatingPage } from 'services/web-profile-ssr/src/views/RatingPage/RatingPage';
import { RatingData } from 'services/web-profile-ssr/src/entities/Rating/RatingData';
import { calculateLevel, calculateXPFromGrades } from 'services/web-profile-ssr/src/entities/Rating/levelConfig';
import { ACHIEVEMENT_CONFIGS } from 'services/web-profile-ssr/src/entities/Rating/achievementsConfig';

const getMockRatingData = async (): Promise<RatingData> => {
  const studentStats = {course: 3, faculty: 'ИТПИ', specialty: 'Программная инженерия', averageGrade: 4.67, educationForm: 'budget' as const};
  const unlockedAchievementsWithCounts: Record<string, number> = {excellent_student: 3, unstoppable: 1, early_bird: 4, group_leader: 2};
  const achievements = Object.values(ACHIEVEMENT_CONFIGS).map((config) => {
    const isUnlocked = config.id in unlockedAchievementsWithCounts;
    const timesEarned = isUnlocked ? unlockedAchievementsWithCounts[config.id] : undefined;
    return {...config, unlocked: isUnlocked, unlockedAt: isUnlocked ? '2025-12-15T10:30:00Z' : undefined, progress: isUnlocked ? undefined : Math.floor(Math.random() * 80), maxProgress: isUnlocked ? undefined : 100, timesEarned};
  });
  const xp = calculateXPFromGrades(studentStats.averageGrade, Object.keys(unlockedAchievementsWithCounts).length, 15);
  const level = calculateLevel(xp);
  return {studentStats, level, rankings: {byCourse: {position: 3, total: 120, percentile: 97.5}, byFaculty: {position: 15, total: 450, percentile: 96.7}, byUniversity: {position: 45, total: 2500, percentile: 98.2}, bySpecialty: {position: 8, total: 200, percentile: 96.0}, byAttendance: {position: 12, total: 120, percentile: 90.0}}, achievements, streak: {current: 15, best: 28, description: 'Дней без пропусков'}, recentImprovements: [{subject: 'Алгоритмы и структуры данных', oldGrade: 4.0, newGrade: 5.0, date: '2026-01-20T00:00:00Z'}, {subject: 'Базы данных', oldGrade: 4.5, newGrade: 5.0, date: '2026-01-15T00:00:00Z'}, {subject: 'Веб-разработка', oldGrade: 3.5, newGrade: 4.5, date: '2026-01-10T00:00:00Z'}]};
};

export default async () => {
  const ratingData = await getMockRatingData();
  return <RatingPage data={ratingData} />;
};
