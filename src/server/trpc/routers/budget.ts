import { router } from '../trpc';
import { publicProcedureWithLogging, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  allocatedCents: z.number().int().nonnegative(),
  icon: z.string().default('📦'),
  color: z.string().default('#6366f1'),
  spendingLimitCents: z.number().int().nonnegative().optional(),
});

const ledgerEntrySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(200),
  type: z.enum(['expense', 'income', 'transfer']),
  amountCents: z.number().int().positive(),
  date: z.string().date(),
  categoryId: z.string(),
  toCategoryId: z.string().optional(),
  slipId: z.string().optional(),
  source: z.string().default('manual'),
  notes: z.string().optional(),
  createdByUserId: z.string(),
  approvedByProxyId: z.string().optional(),
});

const recurringBillSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(200),
  amountCents: z.number().int().positive(),
  frequency: z.enum(['monthly', 'weekly']),
  dueDay: z.number().int().min(1).max(31),
  categoryId: z.string(),
  isAutoPaid: z.boolean().default(false),
});

const savingsGoalSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(200),
  targetCents: z.number().int().positive(),
  currentCents: z.number().int().nonnegative().default(0),
  targetDate: z.string().date(),
  icon: z.string().default('🎯'),
});

export const budgetRouter = router({
  getCategories: publicProcedureWithLogging.query(async ({ ctx }) => {
    const db = await ctx.req.app.locals.db.getDatabase();
    return { success: true, data: db.budgetCategories };
  }),

  getCategoryById: publicProcedureWithLogging
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const category = db.budgetCategories.find((c: any) => c.id === input.id);
      if (!category) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found' });
      }
      return { success: true, data: category };
    }),

  createCategory: protectedProcedure
    .input(categorySchema)
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const newCategory = {
        ...input,
        id: input.id || `cat-${Date.now()}`,
      };
      db.budgetCategories.push(newCategory);
      await ctx.req.app.locals.db.saveDatabase(db);
      return { success: true, data: newCategory };
    }),

  updateCategory: protectedProcedure
    .input(categorySchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const idx = db.budgetCategories.findIndex((c: any) => c.id === input.id);
      if (idx === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found' });
      }
      db.budgetCategories[idx] = { ...db.budgetCategories[idx], ...input };
      await ctx.req.app.locals.db.saveDatabase(db);
      return { success: true, data: db.budgetCategories[idx] };
    }),

  deleteCategory: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      db.budgetCategories = db.budgetCategories.filter((c: any) => c.id !== input.id);
      await ctx.req.app.locals.db.saveDatabase(db);
      return { success: true, message: 'Category deleted' };
    }),

  getLedger: publicProcedureWithLogging
    .input(z.object({
      type: z.enum(['expense', 'income', 'transfer']).optional(),
      categoryId: z.string().optional(),
      startDate: z.string().date().optional(),
      endDate: z.string().date().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      let ledger = db.ledger;
      if (input?.type) {
        ledger = ledger.filter((l: any) => l.type === input.type);
      }
      if (input?.categoryId) {
        ledger = ledger.filter((l: any) => l.categoryId === input.categoryId);
      }
      if (input?.startDate) {
        ledger = ledger.filter((l: any) => l.date >= input.startDate);
      }
      if (input?.endDate) {
        ledger = ledger.filter((l: any) => l.date <= input.endDate);
      }
      return { success: true, data: ledger };
    }),

  createLedgerEntry: protectedProcedure
    .input(ledgerEntrySchema)
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const newEntry = {
        ...input,
        id: input.id || `ledger-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      db.ledger.unshift(newEntry);
      await ctx.req.app.locals.db.saveDatabase(db);
      return { success: true, data: newEntry };
    }),

  getRecurringBills: publicProcedureWithLogging.query(async ({ ctx }) => {
    const db = await ctx.req.app.locals.db.getDatabase();
    return { success: true, data: db.recurringBills };
  }),

  createRecurringBill: protectedProcedure
    .input(recurringBillSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const newBill = {
        ...input,
        id: input.id || `bill-${Date.now()}`,
      };
      db.recurringBills.push(newBill);
      await ctx.req.app.locals.db.saveDatabase(db);
      return { success: true, data: newBill };
    }),

  getSavingsGoals: publicProcedureWithLogging.query(async ({ ctx }) => {
    const db = await ctx.req.app.locals.db.getDatabase();
    return { success: true, data: db.savingsGoals };
  }),

  createSavingsGoal: protectedProcedure
    .input(savingsGoalSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const newGoal = {
        ...input,
        id: input.id || `goal-${Date.now()}`,
      };
      db.savingsGoals.push(newGoal);
      await ctx.req.app.locals.db.saveDatabase(db);
      return { success: true, data: newGoal };
    }),

  updateSavingsGoal: protectedProcedure
    .input(savingsGoalSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const idx = db.savingsGoals.findIndex((g: any) => g.id === input.id);
      if (idx === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Savings goal not found' });
      }
      db.savingsGoals[idx] = { ...db.savingsGoals[idx], ...input };
      await ctx.req.app.locals.db.saveDatabase(db);
      return { success: true, data: db.savingsGoals[idx] };
    }),

  getSummary: publicProcedureWithLogging.query(async ({ ctx }) => {
    const db = await ctx.req.app.locals.db.getDatabase();
    const spent = db.ledger
      .filter((l: any) => l.type === 'expense')
      .reduce((sum: number, l: any) => sum + l.amountCents, 0);
    const income = db.ledger
      .filter((l: any) => l.type === 'income')
      .reduce((sum: number, l: any) => sum + l.amountCents, 0);
    const allocated = db.budgetCategories.reduce((sum: number, c: any) => sum + c.allocatedCents, 0);
    const remaining = Math.max(0, allocated - spent);

    return {
      success: true,
      data: {
        spent,
        income,
        allocated,
        remaining,
        cashFlow: income - spent,
        utilizationPercent: allocated > 0 ? (spent / allocated) * 100 : 0,
        currency: db.currentCurrency,
      },
    };
  }),
});