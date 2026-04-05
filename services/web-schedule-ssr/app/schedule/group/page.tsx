import {
  getGroupsProfileGroupsGet,
  getUserProfileUserGet,
} from '@supreme-int/api-client/src/generated/core-client-info';
import type { DaySchedule } from '@supreme-int/api-client/src/generated/core-schedule';
import {
  groupScheduleGroupsGroupNameScheduleGet,
  listGroupsWithScheduleGroupsGet,
} from '@supreme-int/api-client/src/generated/core-schedule';
import { decodeJwt, TOKEN_KEY } from '@supreme-int/authorization-lib/src/jwt/decodeJwt';
import { cookies } from 'next/headers';
import '../../../src/shared/api/clients';
import { scheduleToEvents } from '../../../src/entities/Lesson/model/Lesson';
import { getExtendedRange, getWeekRange } from '../../../src/shared/lib/schedule.utils';
import { mergeScheduleGroupOptions, parseGroupNameList } from '../../../src/shared/lib/schedule-group-list';
import { GroupCalendarPage } from '../../../src/views/GroupCalendarPage';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{
  date_from?: string;
  date_to?: string;
  group?: string;
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
  let groups: string[] = [];
  let initialGroup = '';

  if (decoded) {
    const [profileRes, groupsRes, scheduleGroupsRes] = await Promise.all([
      getUserProfileUserGet({ query: { user_id: decoded.sub } }),
      getGroupsProfileGroupsGet(),
      listGroupsWithScheduleGroupsGet(),
    ]);

    if (profileRes.data) {
      avatar = profileRes.data.avatar ?? null;
      userName = profileRes.data.name;
    } else {
      console.error('[schedule/group] Profile fetch failed:', profileRes.error);
    }

    groups = mergeScheduleGroupOptions(
      parseGroupNameList(groupsRes.data),
      parseGroupNameList(scheduleGroupsRes.data),
      profileRes.data?.group,
    );

    if (groups.length === 0) {
      error = 'Список групп пуст. Обратитесь в поддержку.';
    } else {
      const paramGroup = params.group;
      const profileGroup = profileRes.data?.group ?? null;
      if (paramGroup && groups.includes(paramGroup)) {
        initialGroup = paramGroup;
      } else if (profileGroup && groups.includes(profileGroup)) {
        initialGroup = profileGroup;
      } else {
        initialGroup = groups[0] ?? '';
      }

      const scheduleRes = await groupScheduleGroupsGroupNameScheduleGet({
        path: { group_name: initialGroup },
        query: { date_from: extendedFrom, date_to: extendedTo },
      });

      if (scheduleRes.error) {
        console.error('[schedule/group] Schedule API error:', scheduleRes.error);
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
    <GroupCalendarPage
      events={events}
      initialDate={dateFrom}
      loadedFrom={extendedFrom}
      loadedTo={extendedTo}
      avatar={avatar}
      userName={userName}
      error={error}
      initialViewMode={initialViewMode}
      initialCalType={initialCalType}
      groups={groups}
      initialGroup={initialGroup}
    />
  );
}
