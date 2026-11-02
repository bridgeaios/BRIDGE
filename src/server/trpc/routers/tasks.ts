import { createContext } from './trpc';
import { router } from './trpc';
import { publicProcedureWithLogging, protectedProcedure } from './trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

const taskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  dueDate: z.string().date().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  category: z.string().default('General'),
  subtasks: z.array(z.object({ id: z.string(), title: z.string(), completed: z.boolean() })).default([]),
  recurring: z.enum(['none', 'daily', 'weekly', 'monthly']).default('none'),
  assignedProxyId: z.string().optional(),
  linkedBudgetId: z.string().optional(),
  linkedSlipId: z.string().optional(),
  linkedProposalId: z.string().optional(),
});

export const tasksRouter = router({
  getAll: publicProcedureWithLogging
    .input(z.object({ completed: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      let tasks = db.tasks;
      if (input?.completed !== undefined) {
        tasks = tasks.filter((t: any) => t.completed === input.completed);
      }
      return { success: true, data: tasks };
    }),

  getById: publicProcedureWithLogging
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const task = db.tasks.find((t: any) => t.id === input.id);
      if (!task) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found' });
      }
      return { success: true, data: task };
    }),

  create: protectedProcedure
    .input(taskSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const newTask = {
        ...input,
        id: input.id || `task-${Date.now()}`,
        createdAt: new Date().toISOString(),
        completedAt: input.completed ? new Date().toISOString() : undefined,
      };
      db.tasks.unshift(newTask);
      await ctx.req.app.locals.db.saveDatabase(db);
      return { success: true, data: newTask };
    }),

  update: protectedProcedure
    .input(taskSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const idx = db.tasks.findIndex((t: any) => t.id === input.id);
      if (idx === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found' });
      }
      const updated = {
        ...db.tasks[idx],
        ...input,
        completedAt: input.completed && !db.tasks[idx].completed ? new Date().toISOString() : db.tasks[idx].completedAt,
      };
      db.tasks[idx] = updated;
      await ctx.req.app.locals.db.saveDatabase(db);
      return { success: true, data: updated };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      db.tasks = db.tasks.filter((t: any) => t.id !== input.id);
      await ctx.req.app.locals.db.saveDatabase(db);
      return { success: true, message: 'Task deleted' };
    }),

  toggle: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const task = db.tasks.find((t: any) => t.id === input.id);
      if (!task) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found' });
      }
      task.completed = !task.completed;
      task.completedAt = task.completed ? new Date().toISOString() : undefined;
      await ctx.req.app.locals.db.saveDatabase(db);
      return { success: true, data: task };
    }),

  bulkUpdate: protectedProcedure
    .input(z.array(taskSchema.extend({ id: z.string() })))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      for (const task of input) {
        const idx = db.tasks.findIndex((t: any) => t.id === task.id);
        if (idx !== -1) {
          db.tasks[idx] = { ...db.tasks[idx], ...task };
        }
      }
      await ctx.req.app.locals.db.saveDatabase(db);
      return { success: true, count: input.length };
    }),
});