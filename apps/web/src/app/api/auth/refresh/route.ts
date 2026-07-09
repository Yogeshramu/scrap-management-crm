import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, signAccessToken, signRefreshToken, generateCsrfToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refresh_token')?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
  }

  const tokenPayload = { id: payload.id, username: payload.username, name: payload.name, role: payload.role };
  const [newAccessToken, newRefreshToken, csrfToken] = await Promise.all([
    signAccessToken(tokenPayload),
    signRefreshToken(tokenPayload), // rotate refresh token
    Promise.resolve(generateCsrfToken()),
  ]);

  const isProd = process.env.NODE_ENV === 'production';
  const response = NextResponse.json({ success: true, csrfToken });

  response.cookies.set({
    name: 'access_token',
    value: newAccessToken,
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 15,
  });

  response.cookies.set({
    name: 'refresh_token',
    value: newRefreshToken,
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 60 * 60 * 24 * 7,
  });

  response.cookies.set({
    name: 'csrf_token',
    value: csrfToken,
    httpOnly: false,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 15,
  });

  return response;
}
