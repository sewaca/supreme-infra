import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  throw new Error('500 error');
}
