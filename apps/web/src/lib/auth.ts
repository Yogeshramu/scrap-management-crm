import { SignJWT, jwtVerify } from 'jose';
import { randomBytes } from 'crypto';

const accessSecret = new TextEncoder().encode(process.env.JWT_SECRET || 'access-secret-dev-key-change-in-prod');
const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || 'refresh-secret-dev-key-change-in-prod');

export async function signAccessToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(accessSecret);
}

export async function signRefreshToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(refreshSecret);
}

export async function verifyAccessToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, accessSecret);
    return payload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, refreshSecret);
    return payload;
  } catch {
    return null;
  }
}

export function generateCsrfToken() {
  return randomBytes(32).toString('hex');
}

// Legacy — kept for middleware compatibility during transition
export async function signJWT(payload: Record<string, unknown>) {
  return signAccessToken(payload);
}

export async function verifyJWT(token: string) {
  return verifyAccessToken(token);
}
