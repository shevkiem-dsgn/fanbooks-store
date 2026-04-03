type Entry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Entry>();

function cleanupExpired(now: number) {
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function consumeRateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  cleanupExpired(now);

  const entry = store.get(options.key);

  if (!entry || entry.resetAt <= now) {
    store.set(options.key, {
      count: 1,
      resetAt: now + options.windowMs,
    });

    return {
      allowed: true,
      remaining: Math.max(options.limit - 1, 0),
      retryAfterMs: 0,
    };
  }

  if (entry.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(entry.resetAt - now, 0),
    };
  }

  entry.count += 1;
  store.set(options.key, entry);

  return {
    allowed: true,
    remaining: Math.max(options.limit - entry.count, 0),
    retryAfterMs: 0,
  };
}
