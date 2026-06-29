// Request rate limiter for sensitive endpoints
// Keeps tracking of IPs in memory with automatic cleanup.

interface RateLimitRecord {
  timestamps: number[];
}

const limiterMap = new Map<string, RateLimitRecord>();

// Cleanup stale entries older than 5 minutes every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of limiterMap.entries()) {
      const activeTimestamps = record.timestamps.filter(t => now - t < 5 * 60 * 1000);
      if (activeTimestamps.length === 0) {
        limiterMap.delete(key);
      } else {
        record.timestamps = activeTimestamps;
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Checks if a request should be rate-limited.
 * @param key Unique key for the client (e.g. combination of IP, user ID and endpoint name)
 * @param maxRequests Maximum allowed requests in the time window
 * @param windowMs Time window in milliseconds (e.g. 60000 for 1 minute)
 * @returns Object with isLimited (boolean), current (number), and resetTime (number)
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number) {
  const now = Date.now();
  let record = limiterMap.get(key);

  if (!record) {
    record = { timestamps: [] };
    limiterMap.set(key, record);
  }

  // Filter timestamps to only keep ones in the current window
  record.timestamps = record.timestamps.filter(t => now - t < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldestTimestamp = record.timestamps[0];
    const resetTime = oldestTimestamp + windowMs;
    return {
      isLimited: true,
      current: record.timestamps.length,
      resetTime,
      remaining: 0
    };
  }

  record.timestamps.push(now);
  return {
    isLimited: false,
    current: record.timestamps.length,
    resetTime: now + windowMs,
    remaining: maxRequests - record.timestamps.length
  };
}

/**
 * Utility to extract a reliable client identifier (IP) from an Astro request
 */
export function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // Take the first IP if there is a list of proxies
    return xForwardedFor.split(',')[0].trim();
  }
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}
