export type AchievementType =
  | 'excellent_student'
  | 'unstoppable'
  | 'top_1_percent'
  | 'first_try'
  | 'perfectionist'
  | 'group_leader'
  | 'communicative'
  | 'early_bird'
  | 'iron_man';

export type Achievement = {
  id: AchievementType;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
  timesEarned?: number;
};

export type StudentLevel = 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master' | 'legend';

export type LevelInfo = {
  level: StudentLevel;
  title: string;
  currentXP: number;
  currentLevelMinXP: number;
  nextLevelXP: number;
  nextLevelTitle?: string;
  color: string;
};

export type RankingPosition = {
  position: number;
  total: number;
  percentile: number;
};

type StudentStats = {
  course: number;
  faculty: string;
  specialty: string;
  averageGrade: number;
  educationForm: 'budget' | 'contract';
};

export type Streak = {
  current: number;
  best: number;
  description: string;
};

export type RatingData = {
  studentStats: StudentStats;
  level: LevelInfo;
  rankings: {
    byCourse: RankingPosition;
    byFaculty: RankingPosition;
    byUniversity: RankingPosition;
    bySpecialty: RankingPosition;
    byAttendance: RankingPosition;
    byAttendanceCourse: RankingPosition;
    byAttendanceFaculty: RankingPosition;
    byAttendanceUniversity: RankingPosition;
    byAttendanceSpecialty: RankingPosition;
  };
  achievements: Achievement[];
  streak: Streak;
  recentImprovements: Array<{
    subject: string;
    oldGrade: number;
    newGrade: number;
    date: string;
  }>;
};
