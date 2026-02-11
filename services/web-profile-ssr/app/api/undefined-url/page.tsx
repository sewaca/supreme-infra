import { notFound } from 'next/navigation';
import { NextResponse } from 'next/server';

export default async function GET(): Promise<NextResponse> {
  notFound();
}
