import { getStatsRatingStatsGet } from '@supreme-int/api-client/src/generated/core-client-info';
import {
  groupScheduleGroupsGroupNameScheduleGet,
  teacherScheduleTeachersTeacherIdScheduleGet,
} from '@supreme-int/api-client/src/generated/core-schedule';
import { decodeJwt, TOKEN_KEY } from '@supreme-int/authorization-lib/src/jwt/decode-jwt';
import { cookies } from 'next/headers';
import { CalendarPage } from '../../src/views/CalendarPage/CalendarPage';
import '../../src/shared/api/clients';
import { getWeekRange, scheduleToEvents } from '../../src/shared/lib/schedule.utils';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{
  group?: string;
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

  let schedule = [];
  let currentGroup: string | null = params.group ?? null;

  try {
    if (params.group) {
      const res = await groupScheduleGroupsGroupNameScheduleGet({
        path: { group_name: params.group },
        query: { date_from: dateFrom, date_to: dateTo },
      });
      schedule = res.data ?? [];
    } else if (decoded?.role === 'teacher') {
      const res = await teacherScheduleTeachersTeacherIdScheduleGet({
        path: { teacher_id: decoded.sub },
        query: { date_from: dateFrom, date_to: dateTo },
      });
      schedule = res.data ?? [];
    } else if (decoded) {
      const statsRes = await getStatsRatingStatsGet({
        query: { user_id: decoded.sub },
      });
      const group = statsRes.data?.group ?? null;
      if (group) {
        currentGroup = group;
        const res = await groupScheduleGroupsGroupNameScheduleGet({
          path: { group_name: group },
          query: { date_from: dateFrom, date_to: dateTo },
        });
        schedule = res.data ?? [];
      }
    }
  } catch {
    // Return empty schedule on errors — auth middleware already guards access
  }

  const events = scheduleToEvents(schedule);

  return <CalendarPage events={events} currentGroup={currentGroup} initialDate={dateFrom} />;
}
