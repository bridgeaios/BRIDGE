import { createContext } from '../trpc';
import { router } from '../trpc';
import { publicProcedureWithLogging, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

const slipSchema = z.object({
  id: z.string().optional(),
  merchant: z.string().min(1).max(200),
  date: z.string().date(),
  amountCents: z.number().int().positive(),
  currency: z.string().length(3).default('ZAR'),
  taxCents: z.number().int().optional(),
  category: z.string().default('Uncategorized'),
  description: z.string().optional(),
  documentDataUrl: z.string().optional(),
  documentType: z.enum(['image', 'pdf']).default('image'),
  fileHash: z.string(),
  isDuplicate: z.boolean().default(false),
  linkedTaskId: z.string().optional(),
  linkedBudgetId: z.string().optional(),
  extractedViaOcr: z.boolean().default(false),
  syncedToLedger: z.boolean().default(false),
});

export const slipsRouter = router({
  getAll: publicProcedureWithLogging
    .input(z.object({ syncedToLedger: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      let slips = db.slips;
      if (input?.syncedToLedger !== undefined) {
        slips = slips.filter((s: any) => s.syncedToLedger === input.syncedToLedger);
      }
      return { success: true, data: slips };
    }),

  getById: publicProcedureWithLogging
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const slip = db.slips.find((s: any) => s.id === input.id);
      if (!slip) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Slip not found' });
      }
      return { success: true, data: slip };
    }),

  create: protectedProcedure
    .input(slipSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const isDuplicate = db.slips.some((s: any) => s.fileHash === input.fileHash);
      const newSlip = {
        ...input,
        id: input.id || `slip-${Date.now()}`,
        isDuplicate,
        createdAt: new Date().toISOString(),
      };
      db.slips.unshift(newSlip);
      await ctx.req.app.locals.db.saveDatabase(db);
      return { success: true, data: newSlip };
    }),

  update: protectedProcedure
    .input(slipSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const idx = db.slips.findIndex((s: any) => s.id === input.id);
      if (idx === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Slip not found' });
      }
      db.slips[idx] = { ...db.slips[idx], ...input };
      await ctx.req.app.locals.db.saveDatabase(db);
      return { success: true, data: db.slips[idx] };
    }),

  syncToLedger: protectedProcedure
    .input(z.object({ id: z.string(), categoryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const slip = db.slips.find((s: any) => s.id === input.id);
      if (!slip) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Slip not found' });
      }
      if (slip.syncedToLedger) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already synced to ledger' });
      }

      const category = db.budgetCategories.find((c: any) => c.id === input.categoryId);
      if (!category) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Budget category not found' });
      }

      const ledgerEntry = {
        id: `ledger-${Date.now()}`,
        title: slip.merchant,
        type: 'expense' as const,
        amountCents: slip.amountCents,
        date: slip.date,
        categoryId: input.categoryId,
        slipId: slip.id,
        source: 'slip_ocr' as const,
        createdByUserId: ctx.userId || 'system',
        createdAt: new Date().toISOString(),
      };

      db.ledger.unshift(ledgerEntry);
      slip.syncedToLedger = true;
      slip.linkedBudgetId = input.categoryId;
      await ctx.req.app.locals.db.saveDatabase(db);

      return { success: true, data: { slip, ledgerEntry } };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      db.slips = db.slips.filter((s: any) => s.id !== input.id);
      await ctx.req.app.locals.db.saveDatabase(db);
      return { success: true, message: 'Slip deleted' };
    }),
});