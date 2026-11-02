import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { logger, createChildLogger, logSecurityEvent } from '../../src/lib/logging/logger';

export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const log = createChildLogger({
        path: req.path,
        method: req.method,
        ip: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress,
      });
      logSecurityEvent(log, 'suspicious_activity', {
        path: req.path,
        validationErrors: result.error.flatten(),
      });

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: result.error.flatten().fieldErrors,
      });
    }
    req.query = result.data as any;
    next();
  };
}

export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid route parameters',
        details: result.error.flatten().fieldErrors,
      });
    }
    req.params = result.data as any;
    next();
  };
}

export const commonSchemas = {
  uuid: z.string().uuid(),
  id: z.string().min(1).max(100),
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    cursor: z.string().optional(),
  }),
  dateRange: z.object({
    startDate: z.string().date().optional(),
    endDate: z.string().date().optional(),
  }),
  money: z.object({
    amountCents: z.number().int(),
    currency: z.string().length(3).default('ZAR'),
  }),
};

export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
}