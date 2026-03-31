import { getUserProfileUserGet } from '@supreme-int/api-client/src/generated/core-client-info';
import type { DaySchedule } from '@supreme-int/api-client/src/generated/core-schedule';
import {
  groupScheduleGroupsGroupNameScheduleGet,
  teacherScheduleTeachersTeacherIdScheduleGet,
} from '@supreme-int/api-client/src/generated/core-schedule';
import { decodeJwt, TOKEN_KEY } from '@supreme-int/authorization-lib/src/jwt/decode-jwt';
import { cookies } from 'next/headers';
import '../../src/shared/api/clients';
import { scheduleToEvents } from '../../src/entities/Lesson/model/Lesson';
import { getExtendedRange, getWeekRange } from '../../src/shared/lib/schedule.utils';
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

  const userSpecifiedDate = params.date_from && params.date_to ? params.date_from : null;
  const { dateFrom } = userSpecifiedDate ? { dateFrom: userSpecifiedDate } : getWeekRange(new Date());

  const { extendedFrom, extendedTo } = getExtendedRange(dateFrom);

  let schedule: DaySchedule[] = [];
  let avatar: string | null = null;
  let userName = '';
  let error: string | null = null;

  if (decoded) {
    const profileRes = await getUserProfileUserGet({ query: { user_id: decoded.sub } });

    if (profileRes.data) {
      avatar = profileRes.data.avatar ?? null;
      userName = profileRes.data.name;
    } else {
      console.error('[calendar] Profile fetch failed:', profileRes.error);
    }

    let schedulePromise: Promise<{ data?: DaySchedule[]; error?: unknown }>;

    if (decoded.role === 'teacher') {
      schedulePromise = teacherScheduleTeachersTeacherIdScheduleGet({
        path: { teacher_id: decoded.sub },
        query: { date_from: extendedFrom, date_to: extendedTo },
      });
    } else {
      const group = profileRes.data?.group;

      if (!group) {
        console.error('[calendar] Failed to resolve student group: group is null in profile');
        error = 'Не удалось определить группу. Обратитесь в поддержку.';
        schedulePromise = Promise.resolve({ data: [] });
      } else {
        schedulePromise = groupScheduleGroupsGroupNameScheduleGet({
          path: { group_name: group },
          query: { date_from: extendedFrom, date_to: extendedTo },
        });
      }
    }

    const scheduleRes = await schedulePromise;
    if (scheduleRes.error) {
      console.error('[calendar] Schedule API error:', scheduleRes.error);
      error ??= 'Не удалось загрузить расписание. Попробуйте позже.';
    } else {
      schedule = scheduleRes.data ?? [];
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
    <CalendarPage
      events={events}
      // initialDate={userSpecifiedDate ?? undefined}
      initialDate={dateFrom}
      loadedFrom={extendedFrom}
      loadedTo={extendedTo}
      avatar={avatar}
      userName={userName}
      error={error}
      initialViewMode={initialViewMode}
      initialCalType={initialCalType}
    />
  );
}
