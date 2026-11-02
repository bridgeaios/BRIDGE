import { Request, Response, NextFunction } from 'express';
import { logger, createChildLogger, logSecurityEvent } from '../logging/logger';

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute per IP

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function getClientIp(req: Request): string {
  return (
    req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
    req.headers['x-real-ip']?.toString() ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

export function rateLimitMiddleware(
  options: { windowMs?: number; maxRequests?: number } = {}
) {
  const windowMs = options.windowMs || RATE_LIMIT_WINDOW_MS;
  const maxRequests = options.maxRequests || RATE_LIMIT_MAX_REQUESTS;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIp(req);
    const now = Date.now();
    const key = `${ip}:${req.path}`;

    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      const log = createChildLogger({ ip, path: req.path, userAgent: req.headers['user-agent'] });
      logSecurityEvent(log, 'rate_limit', { ip, path: req.path });

      res.set('Retry-After', Math.ceil((entry.resetTime - now) / 1000).toString());
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
    }

    entry.count++;
    next();
  };
}

export function stricterRateLimit(maxRequests = 10, windowMs = 60_000) {
  return rateLimitMiddleware({ maxRequests, windowMs });
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60_000);

export { rateLimitStore };