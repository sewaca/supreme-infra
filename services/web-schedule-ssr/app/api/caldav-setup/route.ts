import { createCaldavTokenAuthCaldavTokensPost } from '@supreme-int/api-client/src/generated/core-auth';
import { getUserProfileUserGet } from '@supreme-int/api-client/src/generated/core-client-info';
import { getAuthInfo } from '@supreme-int/nextjs-shared/src/shared/auth/getAuthInfo';
import { NextResponse } from 'next/server';
import { environment } from '../../../src/shared/lib/environment';

export const dynamic = 'force-dynamic';

export async function POST() {
  const { userId, role, token } = await getAuthInfo();

  if (!userId || !token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    // Create CalDAV token via core-auth (needs Authorization header)
    const tokenRes = await createCaldavTokenAuthCaldavTokensPost({
      body: { device_name: 'Календарь (web)' },
      headers: { Authorization: `Bearer ${token}` },
    });

    if (tokenRes.error || !tokenRes.data) {
      console.error('[caldav-setup] Token creation failed:', tokenRes.error);
      return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
    }

    const caldavToken = tokenRes.data.token;
    const base = environment.caldavBaseUrl;

    // Build CalDAV URL based on user role
    let caldavUrl: string;
    if (role === 'teacher') {
      caldavUrl = `${base}/${caldavToken}/teachers/${userId}/calendar.ics`;
    } else {
      const profileRes = await getUserProfileUserGet({ query: { user_id: userId } });
      const group = profileRes.data?.group;
      if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 400 });
      }
      caldavUrl = `${base}/${caldavToken}/groups/${encodeURIComponent(group)}/calendar.ics`;
    }

    return NextResponse.json({ caldavUrl });
  } catch (err) {
    console.error('[caldav-setup] Error:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
