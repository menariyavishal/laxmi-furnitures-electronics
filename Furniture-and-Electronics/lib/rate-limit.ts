/**
 * In-Memory Sliding-Window & Exponential Backoff Rate Limiter
 * Zero external dependencies (no Redis required).
 * Automatically cleans up stale entries to prevent memory leaks.
 */

interface RateLimitRecord {
  timestamps: number[];
  consecutiveAttempts: number;
  blockedUntil: number;
}

const store = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      // If no activity in the last 30 minutes, remove
      const lastActivity = record.timestamps[record.timestamps.length - 1] || 0;
      if (now - lastActivity > 30 * 60 * 1000 && now > record.blockedUntil) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  // Do not hold Node process open for cleanup timer
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}

/**
 * Extract client IP from Next.js request headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Standard sliding-window rate limit
 * @param key Unique identifier (e.g. "upload:192.168.1.1")
 * @param maxRequests Allowed requests in the window
 * @param windowSeconds Duration of window in seconds
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowSeconds: number = 60
): { success: boolean; remaining: number; resetSeconds: number } {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  let record = store.get(key);
  if (!record) {
    record = { timestamps: [], consecutiveAttempts: 0, blockedUntil: 0 };
    store.set(key, record);
  }

  // Remove timestamps outside window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldestTimestamp = record.timestamps[0];
    const resetSeconds = Math.ceil((oldestTimestamp + windowMs - now) / 1000);
    return { success: false, remaining: 0, resetSeconds: Math.max(resetSeconds, 1) };
  }

  record.timestamps.push(now);
  return {
    success: true,
    remaining: maxRequests - record.timestamps.length,
    resetSeconds: windowSeconds,
  };
}

/**
 * Exponential backoff rate limiter for sensitive endpoints (like Forgot Password).
 * Progressive delays:
 * Attempt 1-2: Instant
 * Attempt 3: 15s wait
 * Attempt 4: 1m wait
 * Attempt 5: 5m wait
 * Attempt 6+: 15m wait
 */
export function checkExponentialBackoff(
  key: string,
  action: "attempt" | "reset" = "attempt"
): { success: boolean; retryAfterSeconds: number; attemptCount: number } {
  const now = Date.now();

  let record = store.get(key);
  if (!record) {
    record = { timestamps: [], consecutiveAttempts: 0, blockedUntil: 0 };
    store.set(key, record);
  }

  if (action === "reset") {
    store.delete(key);
    return { success: true, retryAfterSeconds: 0, attemptCount: 0 };
  }

  // Check if currently blocked
  if (now < record.blockedUntil) {
    const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
    return { success: false, retryAfterSeconds: retryAfter, attemptCount: record.consecutiveAttempts };
  }

  record.consecutiveAttempts += 1;
  record.timestamps.push(now);

  // Calculate exponential cooldown based on attempts
  let cooldownSeconds = 0;
  if (record.consecutiveAttempts === 3) {
    cooldownSeconds = 15; // 15 seconds
  } else if (record.consecutiveAttempts === 4) {
    cooldownSeconds = 60; // 1 minute
  } else if (record.consecutiveAttempts === 5) {
    cooldownSeconds = 5 * 60; // 5 minutes
  } else if (record.consecutiveAttempts >= 6) {
    cooldownSeconds = 15 * 60; // 15 minutes
  }

  if (cooldownSeconds > 0) {
    record.blockedUntil = now + cooldownSeconds * 1000;
  }

  return {
    success: true,
    retryAfterSeconds: cooldownSeconds,
    attemptCount: record.consecutiveAttempts,
  };
}
