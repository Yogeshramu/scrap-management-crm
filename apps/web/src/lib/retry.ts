// Transient Prisma error codes that are safe to retry
const RETRYABLE_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017']);

function isRetryable(err: any): boolean {
  if (RETRYABLE_CODES.has(err?.code)) return true;
  if (RETRYABLE_CODES.has(err?.errorCode)) return true;
  const msg: string = err?.message ?? '';
  return (
    msg.includes("Can't reach database") ||
    msg.includes('Connection refused') ||
    msg.includes('connect_timeout') ||
    msg.includes('connection pool timeout') ||
    msg.includes('ECONNRESET')
  );
}

export async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 300): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      if (!isRetryable(err) || i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastError;
}
