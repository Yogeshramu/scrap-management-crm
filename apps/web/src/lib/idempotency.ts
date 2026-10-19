import 'server-only';
import { redis } from './redis';

const TTL_S = 24 * 60 * 60;

export async function getIdempotencyResult(key: string): Promise<{ status: number; body: unknown } | null> {
  const val = await redis.get(`idem:${key}`);
  return val ? JSON.parse(val) : null;
}

export async function setIdempotencyResult(key: string, status: number, body: unknown) {
  await redis.set(`idem:${key}`, JSON.stringify({ status, body }), { EX: TTL_S });
}
