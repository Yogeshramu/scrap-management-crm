import 'server-only';
import { createClient } from 'redis';

const globalForRedis = global as unknown as { redis?: ReturnType<typeof createClient> };

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const hostname = new URL(redisUrl).hostname;

const client =
  globalForRedis.redis ??
  createClient({
    url: redisUrl,
    socket: {
      tls: redisUrl.startsWith('rediss://'),
      servername: hostname,
    },
  });

if (!globalForRedis.redis) {
  client.on('error', (err) => console.error('[Redis]', err));
  client.connect().catch(console.error);
  if (process.env.NODE_ENV !== 'production') globalForRedis.redis = client;
}

export const redis = client;
