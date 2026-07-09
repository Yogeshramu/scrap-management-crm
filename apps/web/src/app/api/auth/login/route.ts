import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signAccessToken, signRefreshToken, generateCsrfToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const tokenPayload = { id: user.id, username: user.username, name: user.name, role: user.role };
    const [accessToken, refreshToken, csrfToken] = await Promise.all([
      signAccessToken(tokenPayload),
      signRefreshToken(tokenPayload),
      Promise.resolve(generateCsrfToken()),
    ]);

    const isProd = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, name: user.name, role: user.role },
      csrfToken,
    });

    // Access token — httpOnly, short-lived (15min)
    response.cookies.set({
      name: 'access_token',
      value: accessToken,
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 15,
    });

    // Refresh token — httpOnly, long-lived (7d)
    response.cookies.set({
      name: 'refresh_token',
      value: refreshToken,
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: '/api/auth',
      maxAge: 60 * 60 * 24 * 7,
    });

    // CSRF token — readable by JS (not httpOnly), same lifetime as access token
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
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
