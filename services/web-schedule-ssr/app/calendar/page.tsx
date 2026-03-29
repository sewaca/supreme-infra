import { getStatsRatingStatsGet, getUserProfileUserGet } from '@supreme-int/api-client/src/generated/core-client-info';
import type { DaySchedule } from '@supreme-int/api-client/src/generated/core-schedule';
import {
  groupScheduleGroupsGroupNameScheduleGet,
  teacherScheduleTeachersTeacherIdScheduleGet,
} from '@supreme-int/api-client/src/generated/core-schedule';
import { decodeJwt, TOKEN_KEY } from '@supreme-int/authorization-lib/src/jwt/decode-jwt';
import { cookies } from 'next/headers';
import '../../src/shared/api/clients';
import { getWeekRange, scheduleToEvents } from '../../src/shared/lib/schedule.utils';
import { CalendarPage } from '../../src/views/CalendarPage/CalendarPage';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{
  date_from?: string;
  date_to?: string;
}>;

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_KEY)?.value ?? null;
  const decoded = token ? decodeJwt(token) : null;

  const { dateFrom, dateTo } =
    params.date_from && params.date_to
      ? { dateFrom: params.date_from, dateTo: params.date_to }
      : getWeekRange(new Date());

  let schedule: DaySchedule[] = [];
  let avatar: string | null = null;
  let userName = '';
  let error: string | null = null;

  if (decoded) {
    // Fetch profile in parallel with schedule resolution
    const profilePromise = getUserProfileUserGet({ query: { user_id: decoded.sub } });

    let schedulePromise: Promise<{ data?: DaySchedule[]; error?: unknown }>;

    if (decoded.role === 'teacher') {
      schedulePromise = teacherScheduleTeachersTeacherIdScheduleGet({
        path: { teacher_id: decoded.sub },
        query: { date_from: dateFrom, date_to: dateTo },
      });
    } else {
      // For students: first resolve group name, then fetch schedule
      const statsRes = await getStatsRatingStatsGet({ query: { user_id: decoded.sub } });
      const group = statsRes.data?.group;

      if (!group) {
        console.error('[calendar] Failed to resolve student group:', statsRes.error ?? 'group is null');
        error = 'Не удалось определить группу. Обратитесь в поддержку.';
        schedulePromise = Promise.resolve({ data: [] });
      } else {
        schedulePromise = groupScheduleGroupsGroupNameScheduleGet({
          path: { group_name: group },
          query: { date_from: dateFrom, date_to: dateTo },
        });
      }
    }

    const [profileRes, scheduleRes] = await Promise.allSettled([profilePromise, schedulePromise]);

    if (profileRes.status === 'fulfilled') {
      avatar = profileRes.value.data?.avatar ?? null;
      userName = profileRes.value.data?.name ?? '';
    } else {
      console.error('[calendar] Profile fetch failed:', profileRes.reason);
    }

    if (scheduleRes.status === 'fulfilled') {
      if (scheduleRes.value.error) {
        console.error('[calendar] Schedule API error:', scheduleRes.value.error);
        error ??= 'Не удалось загрузить расписание. Попробуйте позже.';
      } else {
        schedule = scheduleRes.value.data ?? [];
      }
    } else {
      console.error('[calendar] Schedule fetch failed:', scheduleRes.reason);
      error ??= 'Не удалось загрузить расписание. Попробуйте позже.';
    }
  }

  const events = scheduleToEvents(schedule);

  return <CalendarPage events={events} initialDate={dateFrom} avatar={avatar} userName={userName} error={error} />;
}
