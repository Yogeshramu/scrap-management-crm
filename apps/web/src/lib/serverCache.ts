import 'server-only';
import { redis } from './redis';

const TTL_S = 60;

export const serverCache = {
  async get(key: string): Promise<any | null> {
    const val = await redis.get(`cache:${key}`);
    return val ? JSON.parse(val) : null;
  },
  async set(key: string, data: any, ttl = TTL_S) {
    await redis.set(`cache:${key}`, JSON.stringify(data), 'EX', ttl);
  },
  async invalidate(...keys: string[]) {
    if (keys.length) await redis.del(...keys.map(k => `cache:${k}`));
  },
  async invalidatePrefix(prefix: string) {
    const keys = await redis.keys(`cache:${prefix}*`);
    if (keys.length) await redis.del(...keys);
  },
};
