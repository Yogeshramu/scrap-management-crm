import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  return NextResponse.json({ user: payload });
}
