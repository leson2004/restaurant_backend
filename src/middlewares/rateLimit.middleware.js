/**
 * In-memory rate limiter for comment create/update to avoid spam and API abuse.
 * Uses IP (or X-Forwarded-For) as key. Window is 1 minute.
 */

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 15; // per window per IP

const store = new Map(); // key -> { count, resetAt }

const getClientKey = (req) => {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
};

/**
 * Rate limit middleware: max MAX_REQUESTS per WINDOW_MS per IP.
 */
const commentWriteRateLimit = (req, res, next) => {
  const key = getClientKey(req);
  const now = Date.now();

  let entry = store.get(key);
  if (!entry) {
    entry = { count: 1, resetAt: now + WINDOW_MS };
    store.set(key, entry);
    return next();
  }

  if (now >= entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + WINDOW_MS;
    return next();
  }

  entry.count += 1;
  if (entry.count > MAX_REQUESTS) {
    return res.status(429).json({
      error: "Quá nhiều thao tác. Vui lòng thử lại sau 1 phút.",
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    });
  }

  next();
};

module.exports = { commentWriteRateLimit };
