import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import superjson from 'superjson';
import { Request, Response } from 'express';
import { logger, createChildLogger } from '../../src/lib/logging/logger';

export interface TrpcContext {
  req: Request;
  res: Response;
  userId?: string;
  sessionId?: string;
  logger: ReturnType<typeof createChildLogger>;
  startTime: number;
}

export function createContext(opts: { req: Request; res: Response }): TrpcContext {
  const startTime = Date.now();
  const { req, res } = opts;

  const requestLogger = createChildLogger({
    method: req.method,
    path: req.path,
    ip: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    requestId: req.headers['x-request-id']?.toString() || crypto.randomUUID(),
  });

  return {
    req,
    res,
    logger: requestLogger,
    startTime,
  };
}

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
    },
  }),
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

export const loggingMiddleware = middleware(async ({ ctx, next, path, type }) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;

  ctx.logger.info(
    {
      path,
      type,
      duration,
      ok: result.ok,
    },
    `tRPC ${type} ${path} ${result.ok ? 'OK' : 'ERROR'} (${duration}ms)`
  );

  return result;
});

export const authMiddleware = middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

export const rateLimitMiddleware = middleware(async ({ ctx, next }) => {
  return next();
});

export const protectedProcedure = t.procedure.use(loggingMiddleware).use(authMiddleware);
export const publicProcedureWithLogging = t.procedure.use(loggingMiddleware);

export { createContext };