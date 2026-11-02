import { router } from '../trpc';
import { publicProcedureWithLogging, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

const proxySchema = z.object({
  id: z.string().optional(),
  grantorId: z.string(),
  granteeId: z.string(),
  granteeName: z.string(),
  granteeEmail: z.string().email(),
  status: z.enum(['active', 'pending', 'revoked', 'expired']).default('pending'),
  permissions: z.array(z.enum([
    'view_tasks', 'edit_tasks', 'submit_expenses', 'review_budgets',
    'approve_expenses', 'submit_consensus', 'cast_vote'
  ])).default([]),
  approvalCeilingCents: z.number().int().nonnegative().default(0),
  startDate: z.string().date(),
  expirationDate: z.string().date(),
});

const auditSchema = z.object({
  id: z.string().optional(),
  proxyId: z.string(),
  action: z.string(),
  details: z.string(),
  timestamp: z.string(),
  authorized: z.boolean(),
  reason: z.string().optional(),
});

export const proxyRouter = router({
  getAll: publicProcedureWithLogging.query(async ({ ctx }) => {
    const db = await ctx.req.app.locals.db.getDatabase();
    return { success: true, data: db.proxies };
  }),

  getById: publicProcedureWithLogging
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const proxy = db.proxies.find((p: any) => p.id === input.id);
      if (!proxy) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proxy not found' });
      }
      return { success: true, data: proxy };
    }),

  create: protectedProcedure
    .input(proxySchema)
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const newProxy = {
        ...input,
        id: input.id || `proxy-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      db.proxies.push(newProxy);
      await ctx.req.app.locals.db.saveDatabase(db);
      return { success: true, data: newProxy };
    }),

  update: protectedProcedure
    .input(proxySchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const idx = db.proxies.findIndex((p: any) => p.id === input.id);
      if (idx === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proxy not found' });
      }
      db.proxies[idx] = { ...db.proxies[idx], ...input };
      await ctx.req.app.locals.db.saveDatabase(db);
      return { success: true, data: db.proxies[idx] };
    }),

  revoke: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const proxy = db.proxies.find((p: any) => p.id === input.id);
      if (!proxy) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proxy not found' });
      }
      proxy.status = 'revoked';
      await ctx.req.app.locals.db.saveDatabase(db);
      return { success: true, data: proxy };
    }),

  getAuditLogs: publicProcedureWithLogging
    .input(z.object({ proxyId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      let logs = db.proxyAuditLogs;
      if (input?.proxyId) {
        logs = logs.filter((l: any) => l.proxyId === input.proxyId);
      }
      return { success: true, data: logs };
    }),

  checkPermission: protectedProcedure
    .input(z.object({ proxyId: z.string(), permission: z.string(), amountCents: z.number().int().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const proxy = db.proxies.find((p: any) => p.id === input.proxyId);
      if (!proxy || proxy.status !== 'active') {
        return { success: true, allowed: false, reason: 'Proxy not active' };
      }
      if (!proxy.permissions.includes(input.permission as any)) {
        return { success: true, allowed: false, reason: 'Permission not granted' };
      }
      if (input.amountCents && input.amountCents > proxy.approvalCeilingCents) {
        return { success: true, allowed: false, reason: 'Amount exceeds approval ceiling' };
      }
      return { success: true, allowed: true };
    }),
});