import { getStatsRatingStatsGet } from '@supreme-int/api-client/src/generated/core-client-info';
import {
  groupScheduleGroupsGroupNameScheduleGet,
  teacherScheduleTeachersTeacherIdScheduleGet,
} from '@supreme-int/api-client/src/generated/core-schedule';
import { decodeJwt, TOKEN_KEY } from '@supreme-int/authorization-lib/src/jwt/decode-jwt';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import '../../../src/shared/api/clients';
import { scheduleToEvents } from '../../../src/shared/lib/schedule.utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const dateFrom = request.nextUrl.searchParams.get('date_from');
  const dateTo = request.nextUrl.searchParams.get('date_to');

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

    if (decoded.role === 'teacher') {
      scheduleRes = await teacherScheduleTeachersTeacherIdScheduleGet({
        path: { teacher_id: decoded.sub },
        query: { date_from: dateFrom, date_to: dateTo },
      });
    } else {
      const statsRes = await getStatsRatingStatsGet({ query: { user_id: decoded.sub } });
      const group = statsRes.data?.group;

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
