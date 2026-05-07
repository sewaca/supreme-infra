import { getUserProfileUserGet } from '@supreme-int/api-client/src/generated/core-client-info';
import type { DaySchedule, TeacherCacheResponse } from '@supreme-int/api-client/src/generated/core-schedule';
import {
  listTeachersTeachersGet,
  teacherScheduleTeachersTeacherIdScheduleGet,
} from '@supreme-int/api-client/src/generated/core-schedule';
import { getAuthInfo } from '@supreme-int/nextjs-shared/src/shared/auth/getAuthInfo';
import { cookies } from 'next/headers';
import { scheduleToEvents } from '../../../src/entities/Lesson/model/Lesson';
import type { Teacher } from '../../../src/features/schedule-teacher-select/ui/TeacherScheduleSelect';
import { getExtendedRange, getWeekRange } from '../../../src/shared/lib/schedule.utils';
import { TeacherCalendarPage } from '../../../src/views/TeacherCalendarPage';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{
  date_from?: string;
  date_to?: string;
  teacher?: string;
}>;

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [auth, cookieStore] = await Promise.all([getAuthInfo(), cookies()]);

  const userSpecifiedDate = params.date_from && params.date_to ? params.date_from : null;
  const { dateFrom } = userSpecifiedDate ? { dateFrom: userSpecifiedDate } : getWeekRange(new Date());

  const { extendedFrom, extendedTo } = getExtendedRange(dateFrom);

  let schedule: DaySchedule[] = [];
  let avatar: string | null = null;
  let userName = '';
  let error: string | null = null;
  let teachers: Teacher[] = [];
  let initialTeacherId = '';

  if (auth.userId) {
    const [profileRes, teachersRes] = await Promise.all([
      getUserProfileUserGet({ query: { user_id: auth.userId } }),
      listTeachersTeachersGet(),
    ]);

    if (profileRes.data) {
      avatar = profileRes.data.avatar ?? null;
      userName = profileRes.data.name;
    } else {
      console.error('[schedule/teacher] Profile fetch failed:', profileRes.error);
    }

    if (teachersRes.data && teachersRes.data.length > 0) {
      teachers = (teachersRes.data as TeacherCacheResponse[])
        .map((t) => ({ id: t.id, name: t.name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    } else {
      console.error('[schedule/teacher] Teachers fetch failed:', teachersRes.error);
    }

    if (teachers.length === 0) {
      error = 'Список преподавателей пуст. Обратитесь в поддержку.';
    } else {
      const paramTeacher = params.teacher;
      const isCurrentUserTeacher = auth.role === 'teacher';

      if (paramTeacher && teachers.some((t) => t.id === paramTeacher)) {
        initialTeacherId = paramTeacher;
      } else if (isCurrentUserTeacher && auth.userId && teachers.some((t) => t.id === auth.userId)) {
        initialTeacherId = auth.userId;
      } else {
        initialTeacherId = teachers[0]?.id ?? '';
      }

      const scheduleRes = await teacherScheduleTeachersTeacherIdScheduleGet({
        path: { teacher_id: initialTeacherId },
        query: { date_from: extendedFrom, date_to: extendedTo },
      });

      if (scheduleRes.error) {
        console.error('[schedule/teacher] Schedule API error:', scheduleRes.error);
        error ??= 'Не удалось загрузить расписание. Попробуйте позже.';
      } else {
        schedule = scheduleRes.data ?? [];
      }
    }
  }

  const events = scheduleToEvents(schedule);

  const viewCookie = cookieStore.get('schedule_view')?.value;
  const initialViewMode: 'list' | 'calendar' = viewCookie === 'calendar' ? 'calendar' : 'list';

  const calTypeCookie = cookieStore.get('schedule_cal_type')?.value;
  const validCalTypes = ['timeGridWeek', 'timeGrid3Day', 'timeGridDay'] as const;
  const initialCalType = validCalTypes.includes(calTypeCookie as (typeof validCalTypes)[number])
    ? (calTypeCookie as (typeof validCalTypes)[number])
    : null;

  return (
    <TeacherCalendarPage
      events={events}
      initialDate={dateFrom}
      loadedFrom={extendedFrom}
      loadedTo={extendedTo}
      avatar={avatar}
      userName={userName}
      error={error}
      initialViewMode={initialViewMode}
      initialCalType={initialCalType}
      teachers={teachers}
      initialTeacherId={initialTeacherId}
    />
  );
}
