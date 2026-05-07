import { getServerAuthToken } from '@supreme-int/nextjs-shared/src/shared/auth/getServerAuthToken';
import { NextRequest, NextResponse } from 'next/server';
import { environment } from '../../../../src/shared/lib/environment';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversation_id');
  const cursor = searchParams.get('cursor');
  const limit = searchParams.get('limit') || '30';

  if (!conversationId) {
    return NextResponse.json({ error: 'conversation_id required' }, { status: 400 });
  }

  const token = await getServerAuthToken();

  const url = new URL(`${environment.coreMessagesUrl}/conversations/${conversationId}/messages`);
  url.searchParams.set('limit', limit);
  if (cursor) url.searchParams.set('cursor', cursor);

  const res = await fetch(url.toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
