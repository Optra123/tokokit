/**
 * Rate Limiting Middleware for Vercel Serverless Functions
 *
 * Prevents abuse by limiting requests per IP address
 * Uses in-memory store (consider Redis for production scaling)
 */

// Simple in-memory rate limit store
// In production, use Redis or Upstash for persistent storage
const rateLimitStore = new Map();

const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10); // 1 minute
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '60', 10); // 60 requests per window

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get client IP address from request
 */
function getClientIp(req) {
  // Vercel provides x-real-ip and x-forwarded-for headers
  return (
    req.headers['x-real-ip'] ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Check if request should be rate limited
 *
 * @param {Object} req - Request object
 * @returns {Object} { limited: boolean, remaining: number, resetTime: number }
 */
function checkRateLimit(req) {
  const ip = getClientIp(req);
  const now = Date.now();

  // Cleanup old entries periodically (every 100 requests)
  if (rateLimitStore.size > 100 && Math.random() < 0.01) {
    cleanupExpiredEntries();
  }

  let data = rateLimitStore.get(ip);

  // Initialize or reset if window expired
  if (!data || now > data.resetTime) {
    data = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW
    };
    rateLimitStore.set(ip, data);
  }

  data.count++;
  const remaining = Math.max(0, RATE_LIMIT_MAX - data.count);
  const limited = data.count > RATE_LIMIT_MAX;

  return {
    limited,
    remaining,
    resetTime: data.resetTime,
    retryAfter: Math.ceil((data.resetTime - now) / 1000)
  };
}

/**
 * Rate limit middleware for Vercel functions
 *
 * Usage:
 * const { rateLimit } = require('./middleware/rate-limit');
 *
 * module.exports = async function handler(req, res) {
 *   const rateLimitResult = rateLimit(req, res);
 *   if (rateLimitResult) return rateLimitResult;
 *
 *   // ... your handler code
 * }
 */
function rateLimit(req, res) {
  const result = checkRateLimit(req);

  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX.toString());
  res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
  res.setHeader('X-RateLimit-Reset', result.resetTime.toString());

  if (result.limited) {
    res.setHeader('Retry-After', result.retryAfter.toString());
    res.statusCode = 429;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter
      })
    );
    return true; // Indicates response was sent
  }

  return false; // Continue processing
}

/**
 * Create a custom rate limiter with different limits
 *
 * @param {Object} options - { max: number, windowMs: number }
 */
function createRateLimiter(options = {}) {
  const max = options.max || RATE_LIMIT_MAX;
  const windowMs = options.windowMs || RATE_LIMIT_WINDOW;
  const store = new Map();

  return function customRateLimit(req, res) {
    const ip = getClientIp(req);
    const now = Date.now();

    let data = store.get(ip);

    if (!data || now > data.resetTime) {
      data = {
        count: 0,
        resetTime: now + windowMs
      };
      store.set(ip, data);
    }

    data.count++;
    const remaining = Math.max(0, max - data.count);
    const limited = data.count > max;

    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', data.resetTime.toString());

    if (limited) {
      const retryAfter = Math.ceil((data.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      res.statusCode = 429;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
          retryAfter
        })
      );
      return true;
    }

    return false;
  };
}

module.exports = {
  rateLimit,
  createRateLimiter,
  getClientIp,
  checkRateLimit
};
