import { CoreClientInfo } from '@supreme-int/api-client/src/index';
import { ACHIEVEMENT_CONFIGS } from 'services/web-profile-ssr/src/entities/Rating/achievementsConfig';
import { LEVEL_CONFIGS } from 'services/web-profile-ssr/src/entities/Rating/levelConfig';
import type {
  Achievement,
  RankingPosition,
  RatingData,
  StudentLevel,
} from 'services/web-profile-ssr/src/entities/Rating/RatingData';
import { coreClientInfoClient } from 'services/web-profile-ssr/src/shared/api/clients';
import { getUserId } from 'services/web-profile-ssr/src/shared/api/getUserId';
import { RatingPage } from 'services/web-profile-ssr/src/views/RatingPage/RatingPage';

export const dynamic = 'force-dynamic';

export default async () => {
  const userId = getUserId();

  const [statsRes, levelRes, rankingsRes, achievementsRes, streakRes, improvementsRes] = await Promise.all([
    CoreClientInfo.getStatsRatingStatsGet({ client: coreClientInfoClient, query: { user_id: userId } }),
    CoreClientInfo.getLevelRatingLevelGet({ client: coreClientInfoClient, query: { user_id: userId } }),
    CoreClientInfo.getRankingsRatingRankingsGet({ client: coreClientInfoClient, query: { user_id: userId } }),
    CoreClientInfo.getAchievementsRatingAchievementsGet({ client: coreClientInfoClient, query: { user_id: userId } }),
    CoreClientInfo.getStreakRatingStreakGet({ client: coreClientInfoClient, query: { user_id: userId } }),
    CoreClientInfo.getGradeImprovementsRatingGradeImprovementsGet({
      client: coreClientInfoClient,
      query: { user_id: userId },
    }),
  ]);

  // biome-ignore lint/style/noNonNullAssertion: TODO: non-null-assertion
  const stats = statsRes.data!;
  // biome-ignore lint/style/noNonNullAssertion: TODO: non-null-assertion
  const level = levelRes.data!;
  const rankings = rankingsRes.data ?? [];
  const apiAchievements = achievementsRes.data ?? [];
  // biome-ignore lint/style/noNonNullAssertion: TODO: non-null-assertion
  const streak = streakRes.data!;
  const improvements = improvementsRes.data ?? [];

  // Map API achievements to local Achievement type, merging with config
  const achievementMap = new Map(apiAchievements.map((a) => [a.achievement_id, a]));
  const achievements: Achievement[] = Object.values(ACHIEVEMENT_CONFIGS).map((config) => {
    const apiData = achievementMap.get(config.id);
    if (apiData) {
      return {
        ...config,
        unlocked: apiData.unlocked,
        unlockedAt: apiData.unlocked_at ?? undefined,
        progress: apiData.unlocked ? undefined : apiData.progress,
        maxProgress: apiData.unlocked ? undefined : apiData.max_progress,
        timesEarned: apiData.times_earned || undefined,
      };
    }
    return {
      ...config,
      unlocked: false,
      progress: 0,
      maxProgress: 100,
    };
  });

  // Map rankings to the expected shape
  const rankingsByType: Record<string, RankingPosition> = {};
  for (const r of rankings) {
    rankingsByType[r.ranking_type] = {
      position: r.position,
      total: r.total,
      percentile: Number(r.percentile),
    };
  }

  const emptyRanking: RankingPosition = { position: 0, total: 0, percentile: 0 };

  // Map level to local LevelInfo
  const levelKey = level.level as StudentLevel;
  const levelConfig = LEVEL_CONFIGS[levelKey] ?? LEVEL_CONFIGS.novice;
  const levels = Object.keys(LEVEL_CONFIGS) as StudentLevel[];
  const nextLevelKey = levels[levels.indexOf(levelKey) + 1] as StudentLevel | undefined;
  const nextLevelXP = level.next_level_xp ?? (nextLevelKey ? LEVEL_CONFIGS[nextLevelKey].minXP : levelConfig.minXP);

  const ratingData: RatingData = {
    studentStats: {
      course: stats.course ?? 0,
      faculty: stats.faculty ?? '',
      specialty: stats.specialty ?? '',
      averageGrade: Number(stats.average_grade ?? 0),
      educationForm:
        stats.education_form === 'full_time' ? 'budget' : ((stats.education_form as 'budget' | 'contract') ?? 'budget'),
    },
    level: {
      level: levelKey,
      title: level.title ?? levelConfig.title,
      currentXP: level.current_xp,
      currentLevelMinXP: levelConfig.minXP,
      nextLevelXP,
      nextLevelTitle: nextLevelKey ? LEVEL_CONFIGS[nextLevelKey].title : undefined,
      color: level.color ?? levelConfig.color,
    },
    rankings: {
      byCourse: rankingsByType.byCourse ?? emptyRanking,
      byFaculty: rankingsByType.byFaculty ?? emptyRanking,
      byUniversity: rankingsByType.byUniversity ?? emptyRanking,
      bySpecialty: rankingsByType.bySpecialty ?? emptyRanking,
      byAttendance: rankingsByType.byAttendance ?? emptyRanking,
    },
    achievements,
    streak: {
      current: streak.current,
      best: streak.best,
      description: 'Дней без пропусков',
    },
    recentImprovements: improvements.map((imp) => ({
      subject: imp.subject,
      oldGrade: Number(imp.old_grade),
      newGrade: Number(imp.new_grade),
      date: imp.grade_date,
    })),
  };

  return <RatingPage data={ratingData} />;
};
