import { getUserProfileUserGet } from '@supreme-int/api-client/src/generated/core-client-info';
import type { SessionEventResponse } from '@supreme-int/api-client/src/generated/core-schedule';
import {
  groupExamsGroupsGroupNameExamsGet,
  teacherExamsTeachersTeacherIdExamsGet,
} from '@supreme-int/api-client/src/generated/core-schedule';
import { decodeJwt } from '@supreme-int/authorization-lib/src/jwt/decode-jwt';
import { TOKEN_KEY } from '@supreme-int/authorization-lib/src/constants/auth.model';
import { cookies } from 'next/headers';
import { examsToEvents } from '../../../src/entities/Lesson/model/Lesson';
import { ExamsCalendarPage } from '../../../src/views/ExamsCalendarPage';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_KEY)?.value ?? null;
  const decoded = token ? decodeJwt(token) : null;

  let exams: SessionEventResponse[] = [];
  let avatar: string | null = null;
  let userName = '';
  let error: string | null = null;

  if (decoded) {
    const profileRes = await getUserProfileUserGet({ query: { user_id: decoded.sub } });

    if (profileRes.data) {
      avatar = profileRes.data.avatar ?? null;
      userName = profileRes.data.name;
    } else {
      console.error('[schedule/exams] Profile fetch failed:', profileRes.error);
    }

    let examsRes: { data?: SessionEventResponse[]; error?: unknown };

    if (decoded.role === 'teacher') {
      examsRes = await teacherExamsTeachersTeacherIdExamsGet({
        path: { teacher_id: decoded.sub },
      });
    } else {
      const group = profileRes.data?.group;
      if (!group) {
        console.error('[schedule/exams] Failed to resolve student group: group is null in profile');
        error = 'Не удалось определить группу. Обратитесь в поддержку.';
        examsRes = { data: [] };
      } else {
        examsRes = await groupExamsGroupsGroupNameExamsGet({
          path: { group_name: group },
        });
      }
    }

    if (examsRes.error) {
      console.error('[schedule/exams] Exams API error:', examsRes.error);
      error ??= 'Не удалось загрузить расписание сессии. Попробуйте позже.';
    } else {
      exams = examsRes.data ?? [];
    }
  }

  const events = examsToEvents(exams);

  return <ExamsCalendarPage events={events} avatar={avatar} userName={userName} error={error} />;
}
