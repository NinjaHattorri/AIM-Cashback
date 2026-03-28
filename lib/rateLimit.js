// Simple in-memory rate limiting for Next.js API routes
import { LRUCache as LRU } from 'lru-cache';

const options = {
  max: 500, // Store 500 unique IPs
  ttl: 60 * 1000, // 1 minute window
};

const tokenCache = new LRU(options);

export default function rateLimit(options) {
  const { limit, windowMs } = options;

  return {
    check: (res, token) =>
      new Promise((resolve, reject) => {
        const tokenCount = tokenCache.get(token) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, [1]);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;
        res.headers.set('X-RateLimit-Limit', limit);
        res.headers.set(
          'X-RateLimit-Remaining',
          isRateLimited ? 0 : limit - currentUsage
        );

        return isRateLimited ? reject() : resolve();
      }),
  };
}
