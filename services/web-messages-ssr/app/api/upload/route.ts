import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { environment } from '../../../src/shared/lib/environment';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ detail: 'Authentication required' }, { status: 401 });
  }

  const formData = await request.formData();

  const res = await fetch(`${environment.filesStorageUrl}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
