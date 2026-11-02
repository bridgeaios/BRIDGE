import { router } from '../trpc';
import { publicProcedureWithLogging, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

const adminConfigSchema = z.object({
  adminPin: z.string().length(4),
  defaultCurrency: z.string().length(3).default('ZAR'),
  defaultWhatsAppPhone: z.string().default('+278****4567'),
  enableAutoCalendarSync: z.boolean().default(false),
  enableAutoSheetSync: z.boolean().default(false),
  autoSyncIntervalMinutes: z.number().int().positive().optional(),
  lastSyncedAt: z.string().optional(),
  lastSyncedSpreadsheetUrl: z.string().url().optional(),
  lastSyncedDriveUrl: z.string().url().optional(),
  aiPersonality: z.enum(['buddy', 'coach', 'mediator']).default('buddy'),
  isEmergencyFrozen: z.boolean().default(false),
});

export const syncRouter = router({
  getAdminConfig: publicProcedureWithLogging.query(async ({ ctx }) => {
    const db = await ctx.req.app.locals.db.getDatabase();
    if (!db.adminConfig) {
      db.adminConfig = {
        adminPin: '1234',
        defaultCurrency: db.currentCurrency || 'ZAR',
        defaultWhatsAppPhone: '+278****4567',
        enableAutoCalendarSync: false,
        enableAutoSheetSync: false,
        aiPersonality: 'buddy',
        isEmergencyFrozen: false,
      };
      await ctx.req.app.locals.db.saveDatabase(db);
    }
    return { success: true, config: db.adminConfig };
  }),

  updateAdminConfig: protectedProcedure
    .input(adminConfigSchema.partial())
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      if (!db.adminConfig) {
        db.adminConfig = {
          adminPin: '1234',
          defaultCurrency: db.currentCurrency || 'ZAR',
          defaultWhatsAppPhone: '+278****4567',
          enableAutoCalendarSync: false,
          enableAutoSheetSync: false,
          aiPersonality: 'buddy',
          isEmergencyFrozen: false,
        };
      }
      db.adminConfig = { ...db.adminConfig, ...input };
      if (input.defaultCurrency) {
        db.currentCurrency = input.defaultCurrency;
      }
      await ctx.req.app.locals.db.saveDatabase(db);
      return { success: true, config: db.adminConfig };
    }),

  getFullState: publicProcedureWithLogging.query(async ({ ctx }) => {
    const db = await ctx.req.app.locals.db.getDatabase();
    return { success: true, data: db };
  }),

  saveFullState: protectedProcedure
    .input(z.object({
      tasks: z.array(z.any()),
      slips: z.array(z.any()),
      budgetCategories: z.array(z.any()),
      ledger: z.array(z.any()),
      recurringBills: z.array(z.any()),
      savingsGoals: z.array(z.any()),
      proxies: z.array(z.any()),
      proxyAuditLogs: z.array(z.any()),
      proposals: z.array(z.any()),
      flows: z.array(z.any()),
      flowExecutionLogs: z.array(z.any()),
      currentCurrency: z.string(),
      adminConfig: z.any().optional(),
      version: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.req.app.locals.db.saveDatabase(input);
      return { success: true, message: 'Database saved successfully' };
    }),

  exportData: publicProcedureWithLogging.query(async ({ ctx }) => {
    const db = await ctx.req.app.locals.db.getDatabase();
    const exportData = {
      ...db,
      exportedAt: new Date().toISOString(),
      exportedBy: 'bridge-frontier',
    };
    return { success: true, data: exportData };
  }),

  importData: protectedProcedure
    .input(z.object({
      data: z.any(),
      merge: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      if (input.merge) {
        Object.assign(db, input.data);
      } else {
        Object.keys(db).forEach(key => delete db[key]);
        Object.assign(db, input.data);
      }
      await ctx.req.app.locals.db.saveDatabase(db);
      return { success: true, message: 'Data imported successfully' };
    }),

  healthCheck: publicProcedureWithLogging.query(async ({ ctx }) => {
    const db = await ctx.req.app.locals.db.getDatabase();
    return {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        tasks: db.tasks.length,
        slips: db.slips.length,
        budgetCategories: db.budgetCategories.length,
        ledgerEntries: db.ledger.length,
        proposals: db.proposals.length,
        flows: db.flows.length,
      },
      version: db.version,
    };
  }),
});