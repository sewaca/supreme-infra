import {
  getGroupsProfileGroupsGet,
  getUserProfileUserGet,
} from '@supreme-int/api-client/src/generated/core-client-info';
import {
  groupScheduleGroupsGroupNameScheduleGet,
  teacherScheduleTeachersTeacherIdScheduleGet,
} from '@supreme-int/api-client/src/generated/core-schedule';
import { decodeJwt, TOKEN_KEY } from '@supreme-int/authorization-lib/src/jwt/decode-jwt';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import '../../../src/shared/api/clients';
import { scheduleToEvents } from '../../../src/entities/Lesson/model/Lesson';

export const dynamic = 'force-dynamic';

function parseAllowedGroups(payload: unknown): string[] {
  if (!Array.isArray(payload)) return [];
  return payload.filter((g): g is string => typeof g === 'string');
}

export async function GET(request: NextRequest) {
  const dateFrom = request.nextUrl.searchParams.get('date_from');
  const dateTo = request.nextUrl.searchParams.get('date_to');
  const explicitGroupName = request.nextUrl.searchParams.get('group_name');

  if (!dateFrom || !dateTo) {
    return NextResponse.json({ error: 'date_from and date_to required' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_KEY)?.value ?? null;
  const decoded = token ? decodeJwt(token) : null;

  if (!decoded) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    let scheduleRes: { data?: unknown[]; error?: unknown };

    if (explicitGroupName) {
      const groupsRes = await getGroupsProfileGroupsGet();
      const allowed = parseAllowedGroups(groupsRes.data);
      if (!allowed.includes(explicitGroupName)) {
        return NextResponse.json({ error: 'invalid group' }, { status: 403 });
      }

      scheduleRes = await groupScheduleGroupsGroupNameScheduleGet({
        path: { group_name: explicitGroupName },
        query: { date_from: dateFrom, date_to: dateTo },
      });
    } else if (decoded.role === 'teacher') {
      scheduleRes = await teacherScheduleTeachersTeacherIdScheduleGet({
        path: { teacher_id: decoded.sub },
        query: { date_from: dateFrom, date_to: dateTo },
      });
    } else {
      const profileRes = await getUserProfileUserGet({ query: { user_id: decoded.sub } });
      const group = profileRes.data?.group;

      if (!group) {
        return NextResponse.json({ events: [], error: 'group not found' });
      }

      scheduleRes = await groupScheduleGroupsGroupNameScheduleGet({
        path: { group_name: group },
        query: { date_from: dateFrom, date_to: dateTo },
      });
    }

    if (scheduleRes.error) {
      return NextResponse.json({ events: [], error: String(scheduleRes.error) });
    }

    const events = scheduleToEvents((scheduleRes.data as Parameters<typeof scheduleToEvents>[0]) ?? []);
    return NextResponse.json({ events });
  } catch (err) {
    console.error('[api/schedule] Error:', err);
    return NextResponse.json({ events: [], error: 'internal error' }, { status: 500 });
  }
}
