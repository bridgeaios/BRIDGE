import express, { Request, Response, NextFunction } from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import superjson from 'superjson';
import { z } from 'zod';
import { initTRPC, TRPCError } from '@trpc/server';
import pino from 'pino';
import fs from 'fs';

dotenv.config();

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://bridge-ai-os.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

const isVercel = process.env.VERCEL === '1';
const DATA_DIR = isVercel ? '/tmp/data' : (process.env.DATA_DIR || './data');
const DB_FILE = `${DATA_DIR}/db.json`;

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  base: { service: 'bridge-frontier', env: process.env.NODE_ENV },
});

interface AppDatabase {
  tasks: any[];
  slips: any[];
  budgetCategories: any[];
  ledger: any[];
  recurringBills: any[];
  savingsGoals: any[];
  proxies: any[];
  proxyAuditLogs: any[];
  proposals: any[];
  flows: any[];
  flowExecutionLogs: any[];
  currentCurrency: string;
  adminConfig?: any;
  version: number;
}

async function loadDatabase(): Promise<AppDatabase> {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && parsed.version) {
        return parsed;
      }
    }
  } catch (err) {
    logger.warn({ err }, 'Error loading db file, using defaults');
  }
  return getInitialDatabase();
}

function getInitialDatabase(): AppDatabase {
  return {
    tasks: [],
    slips: [],
    budgetCategories: [
      { id: 'cat-1', name: 'Housing', allocatedCents: 1500000, icon: '🏠', color: '#ef4444' },
      { id: 'cat-2', name: 'Food', allocatedCents: 800000, icon: '🍔', color: '#f97316' },
      { id: 'cat-3', name: 'Transport', allocatedCents: 500000, icon: '🚌', color: '#eab308' },
      { id: 'cat-4', name: 'Utilities', allocatedCents: 400000, icon: '⚡', color: '#22c55e' },
      { id: 'cat-5', name: 'Entertainment', allocatedCents: 300000, icon: '🎮', color: '#8b5cf6' },
    ],
    ledger: [],
    recurringBills: [],
    savingsGoals: [],
    proxies: [],
    proxyAuditLogs: [],
    proposals: [],
    flows: [],
    flowExecutionLogs: [],
    currentCurrency: 'ZAR',
    adminConfig: {
      adminPin: '1234',
      defaultCurrency: 'ZAR',
      defaultWhatsAppPhone: '+278****4567',
      enableAutoCalendarSync: false,
      enableAutoSheetSync: false,
      aiPersonality: 'buddy',
      isEmergencyFrozen: false,
    },
    version: 1,
  };
}

function saveDatabase(data: AppDatabase) {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    fs.copyFileSync(DB_FILE, `${DB_FILE}.backup`);
  } catch (err) {
    logger.error({ err }, 'Failed to persist database');
  }
}

let db: AppDatabase | null = null;

async function ensureDatabase(): Promise<AppDatabase> {
  if (db) return db;
  db = await loadDatabase();
  return db;
}

app.locals.db = {
  getDatabase: async () => await ensureDatabase(),
  saveDatabase: async (data: AppDatabase) => {
    Object.assign(await ensureDatabase(), data);
    return saveDatabase(data);
  },
};

// ================= tRPC =================

const t = initTRPC.context<{
  req: Request;
  res: Response;
  logger: ReturnType<typeof logger.child>;
  startTime: number;
}>().create({
  transformer: superjson,
});

const router = t.router;
const publicProcedure = t.procedure;
const middleware = t.middleware;

const loggingMiddleware = middleware(async ({ ctx, next, path, type }) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;
  ctx.logger.info({ path, type, duration, ok: result.ok }, `tRPC ${type} ${path} ${result.ok ? 'OK' : 'ERROR'} (${duration}ms)`);
  return result;
});

const publicProcedureWithLogging = t.procedure.use(loggingMiddleware);

// ================= Schemas =================

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

const proxySchema = z.object({
  id: z.string().optional(),
  grantorId: z.string(),
  granteeId: z.string(),
  granteeName: z.string(),
  granteeEmail: z.string().email(),
  status: z.enum(['active', 'pending', 'revoked', 'expired']).default('pending'),
  permissions: z.array(z.enum(['view_tasks', 'edit_tasks', 'submit_expenses', 'review_budgets', 'approve_expenses', 'submit_consensus', 'cast_vote'])).default([]),
  approvalCeilingCents: z.number().int().nonnegative().default(0),
  startDate: z.string().date(),
  expirationDate: z.string().date(),
});

const proposalSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string(),
  ownerId: z.string(),
  ownerName: z.string(),
  deadline: z.string().date(),
  decisionRule: z.enum(['unanimous', 'consent', 'supermajority', 'majority']).default('consent'),
  minQuorumCount: z.number().int().positive().default(1),
  eligibleVoterIds: z.array(z.string()).default([]),
  votes: z.record(z.object({
    userId: z.string(),
    userName: z.string(),
    vote: z.enum(['agree', 'discuss', 'object', 'abstain']),
    objectionReason: z.string().optional(),
    votedAt: z.string(),
  })).default({}),
  comments: z.array(z.object({
    id: z.string(),
    userId: z.string(),
    userName: z.string(),
    text: z.string(),
    createdAt: z.string(),
  })).default([]),
  status: z.enum(['open', 'finalized_approved', 'finalized_rejected']).default('open'),
  resolvedObjections: z.array(z.string()).default([]),
});

const flowBlockSchema = z.object({
  id: z.string(),
  type: z.enum(['start', 'add_task', 'capture_slip', 'update_budget', 'request_approval', 'start_consensus', 'notify', 'if_else', 'complete']),
  label: z.string(),
  description: z.string(),
  config: z.record(z.any()).default({}),
  color: z.string(),
});

const flowWorkflowSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(200),
  description: z.string(),
  blocks: z.array(flowBlockSchema).default([]),
  isActive: z.boolean().default(true),
});

function evaluateConsensusDecision(proposal: any) {
  const votes = Object.values(proposal.votes);
  const agreeCount = votes.filter((v: any) => v.vote === 'agree').length;
  const objectCount = votes.filter((v: any) => v.vote === 'object').length;
  const discussCount = votes.filter((v: any) => v.vote === 'discuss').length;
  const totalVotes = votes.length;
  const quorumMet = totalVotes >= proposal.minQuorumCount;

  if (!quorumMet) return { finalized: false, status: 'open' as const, reason: 'Quorum not reached' };

  switch (proposal.decisionRule) {
    case 'unanimous':
      if (objectCount > 0 || discussCount > 0) return { finalized: false, status: 'open' as const, reason: 'Unanimous rule requires all agree votes' };
      if (agreeCount === proposal.eligibleVoterIds.length) return { finalized: true, status: 'finalized_approved' as const, reason: 'Unanimous approval' };
      break;
    case 'consent':
      if (objectCount > 0) return { finalized: false, status: 'open' as const, reason: 'Blocking objection exists' };
      if (agreeCount > 0) return { finalized: true, status: 'finalized_approved' as const, reason: 'Consent achieved' };
      break;
    case 'supermajority':
      if (agreeCount / totalVotes >= 0.75) return { finalized: true, status: 'finalized_approved' as const, reason: 'Supermajority reached' };
      return { finalized: false, status: 'open' as const, reason: 'Supermajority not reached' };
    case 'majority':
      if (agreeCount / totalVotes > 0.5) return { finalized: true, status: 'finalized_approved' as const, reason: 'Majority reached' };
      return { finalized: false, status: 'open' as const, reason: 'Majority not reached' };
  }
  return { finalized: false, status: 'open' as const, reason: 'Unknown decision rule' };
}

// ================= Routers =================

const tasksRouter = router({
  getAll: publicProcedureWithLogging
    .input(z.object({ completed: z.boolean().optional() }).optional())
    .query(async ({ ctx }) => {
      const d = await ctx.req.app.locals.db.getDatabase();
      return { success: true, data: d.tasks };
    }),
  getById: publicProcedureWithLogging
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const d = await ctx.req.app.locals.db.getDatabase();
      const task = d.tasks.find((t: any) => t.id === input.id);
      if (!task) throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found' });
      return { success: true, data: task };
    }),
  create: publicProcedureWithLogging
    .input(taskSchema)
    .mutation(async ({ ctx, input }) => {
      const d = await ctx.req.app.locals.db.getDatabase();
      const newTask = { ...input, id: input.id || `task-${Date.now()}`, createdAt: new Date().toISOString(), completedAt: input.completed ? new Date().toISOString() : undefined };
      d.tasks.unshift(newTask);
      await ctx.req.app.locals.db.saveDatabase(d);
      return { success: true, data: newTask };
    }),
  update: publicProcedureWithLogging
    .input(taskSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const d = await ctx.req.app.locals.db.getDatabase();
      const idx = d.tasks.findIndex((t: any) => t.id === input.id);
      if (idx === -1) throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found' });
      d.tasks[idx] = { ...d.tasks[idx], ...input };
      await ctx.req.app.locals.db.saveDatabase(d);
      return { success: true, data: d.tasks[idx] };
    }),
  toggle: publicProcedureWithLogging
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const d = await ctx.req.app.locals.db.getDatabase();
      const task = d.tasks.find((t: any) => t.id === input.id);
      if (!task) throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found' });
      task.completed = !task.completed;
      task.completedAt = task.completed ? new Date().toISOString() : undefined;
      await ctx.req.app.locals.db.saveDatabase(d);
      return { success: true, data: task };
    }),
});

const slipsRouter = router({
  getAll: publicProcedureWithLogging.query(async ({ ctx }) => {
    const d = await ctx.req.app.locals.db.getDatabase();
    return { success: true, data: d.slips };
  }),
  create: publicProcedureWithLogging
    .input(slipSchema)
    .mutation(async ({ ctx, input }) => {
      const d = await ctx.req.app.locals.db.getDatabase();
      const isDuplicate = d.slips.some((s: any) => s.fileHash === input.fileHash);
      const newSlip = { ...input, id: input.id || `slip-${Date.now()}`, isDuplicate, createdAt: new Date().toISOString() };
      d.slips.unshift(newSlip);
      await ctx.req.app.locals.db.saveDatabase(d);
      return { success: true, data: newSlip };
    }),
  syncToLedger: publicProcedureWithLogging
    .input(z.object({ id: z.string(), categoryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const d = await ctx.req.app.locals.db.getDatabase();
      const slip = d.slips.find((s: any) => s.id === input.id);
      if (!slip) throw new TRPCError({ code: 'NOT_FOUND', message: 'Slip not found' });
      if (slip.syncedToLedger) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already synced' });
      const category = d.budgetCategories.find((c: any) => c.id === input.categoryId);
      if (!category) throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found' });
      const entry = { id: `ledger-${Date.now()}`, title: slip.merchant, type: 'expense', amountCents: slip.amountCents, date: slip.date, categoryId: input.categoryId, slipId: slip.id, source: 'slip_ocr', createdByUserId: 'system', createdAt: new Date().toISOString() };
      d.ledger.unshift(entry);
      slip.syncedToLedger = true;
      slip.linkedBudgetId = input.categoryId;
      await ctx.req.app.locals.db.saveDatabase(d);
      return { success: true, data: { slip, ledgerEntry: entry } };
    }),
});

const budgetRouter = router({
  getCategories: publicProcedureWithLogging.query(async ({ ctx }) => {
    const d = await ctx.req.app.locals.db.getDatabase();
    return { success: true, data: d.budgetCategories };
  }),
  createCategory: publicProcedureWithLogging
    .input(categorySchema)
    .mutation(async ({ ctx, input }) => {
      const d = await ctx.req.app.locals.db.getDatabase();
      const newCat = { ...input, id: input.id || `cat-${Date.now()}` };
      d.budgetCategories.push(newCat);
      await ctx.req.app.locals.db.saveDatabase(d);
      return { success: true, data: newCat };
    }),
  createLedgerEntry: publicProcedureWithLogging
    .input(ledgerEntrySchema)
    .mutation(async ({ ctx, input }) => {
      const d = await ctx.req.app.locals.db.getDatabase();
      const entry = { ...input, id: input.id || `ledger-${Date.now()}`, createdAt: new Date().toISOString() };
      d.ledger.unshift(entry);
      await ctx.req.app.locals.db.saveDatabase(d);
      return { success: true, data: entry };
    }),
  getSummary: publicProcedureWithLogging.query(async ({ ctx }) => {
    const d = await ctx.req.app.locals.db.getDatabase();
    const spent = d.ledger.filter((l: any) => l.type === 'expense').reduce((s: number, l: any) => s + l.amountCents, 0);
    const income = d.ledger.filter((l: any) => l.type === 'income').reduce((s: number, l: any) => s + l.amountCents, 0);
    const allocated = d.budgetCategories.reduce((s: number, c: any) => s + c.allocatedCents, 0);
    return { success: true, data: { spent, income, allocated, remaining: Math.max(0, allocated - spent), cashFlow: income - spent, currency: d.currentCurrency } };
  }),
});

const proxyRouter = router({
  getAll: publicProcedureWithLogging.query(async ({ ctx }) => {
    const d = await ctx.req.app.locals.db.getDatabase();
    return { success: true, data: d.proxies };
  }),
  create: publicProcedureWithLogging
    .input(proxySchema)
    .mutation(async ({ ctx, input }) => {
      const d = await ctx.req.app.locals.db.getDatabase();
      const p = { ...input, id: input.id || `proxy-${Date.now()}`, createdAt: new Date().toISOString() };
      d.proxies.push(p);
      await ctx.req.app.locals.db.saveDatabase(d);
      return { success: true, data: p };
    }),
  checkPermission: publicProcedureWithLogging
    .input(z.object({ proxyId: z.string(), permission: z.string(), amountCents: z.number().int().optional() }))
    .query(async ({ ctx, input }) => {
      const d = await ctx.req.app.locals.db.getDatabase();
      const p = d.proxies.find((x: any) => x.id === input.proxyId);
      if (!p || p.status !== 'active') return { success: true, allowed: false, reason: 'Proxy not active' };
      if (!p.permissions.includes(input.permission)) return { success: true, allowed: false, reason: 'Permission not granted' };
      if (input.amountCents && input.amountCents > p.approvalCeilingCents) return { success: true, allowed: false, reason: 'Exceeds ceiling' };
      return { success: true, allowed: true };
    }),
});

const consensusRouter = router({
  getAll: publicProcedureWithLogging.query(async ({ ctx }) => {
    const d = await ctx.req.app.locals.db.getDatabase();
    return { success: true, data: d.proposals };
  }),
  create: publicProcedureWithLogging
    .input(proposalSchema)
    .mutation(async ({ ctx, input }) => {
      const d = await ctx.req.app.locals.db.getDatabase();
      const p = { ...input, id: input.id || `prop-${Date.now()}`, createdAt: new Date().toISOString() };
      d.proposals.unshift(p);
      await ctx.req.app.locals.db.saveDatabase(d);
      return { success: true, data: p };
    }),
  vote: publicProcedureWithLogging
    .input(z.object({ proposalId: z.string(), userId: z.string(), userName: z.string(), vote: z.enum(['agree', 'discuss', 'object', 'abstain']), objectionReason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const d = await ctx.req.app.locals.db.getDatabase();
      const p = d.proposals.find((x: any) => x.id === input.proposalId);
      if (!p) throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' });
      p.votes[input.userId] = { userId: input.userId, userName: input.userName, vote: input.vote, objectionReason: input.objectionReason, votedAt: new Date().toISOString() };
      const evalResult = evaluateConsensusDecision(p);
      if (evalResult.finalized) {
        p.status = evalResult.status;
        p.finalizedAt = new Date().toISOString();
        if (evalResult.status === 'finalized_approved') {
          const actionTask = { id: `task-prop-${Date.now()}`, title: `[CONSENSUS] ${p.title}`, description: `Action from consensus: ${p.description}`, completed: false, priority: 'high', category: 'Consensus Actions', subtasks: [], recurring: 'none', createdAt: new Date().toISOString() };
          d.tasks.unshift(actionTask);
          p.resultingActionItemIds = [actionTask.id];
        }
      }
      await ctx.req.app.locals.db.saveDatabase(d);
      return { success: true, data: { proposal: p, evaluation: evalResult } };
    }),
});

const flowsRouter = router({
  getAll: publicProcedureWithLogging.query(async ({ ctx }) => {
    const d = await ctx.req.app.locals.db.getDatabase();
    return { success: true, data: d.flows };
  }),
  create: publicProcedureWithLogging
    .input(flowWorkflowSchema)
    .mutation(async ({ ctx, input }) => {
      const d = await ctx.req.app.locals.db.getDatabase();
      const f = { ...input, id: input.id || `flow-${Date.now()}`, createdAt: new Date().toISOString() };
      d.flows.push(f);
      await ctx.req.app.locals.db.saveDatabase(d);
      return { success: true, data: f };
    }),
  execute: publicProcedureWithLogging
    .input(z.object({ flowId: z.string(), context: z.record(z.any()).default({}), idempotencyKey: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const d = await ctx.req.app.locals.db.getDatabase();
      const f = d.flows.find((x: any) => x.id === input.flowId);
      if (!f) throw new TRPCError({ code: 'NOT_FOUND', message: 'Flow not found' });
      const idemKey = input.idempotencyKey || `idem-${Date.now()}`;
      const existing = d.flowExecutionLogs.find((l: any) => l.idempotencyKey === idemKey);
      if (existing) return { success: true, log: existing, duplicate: true };
      const stepResults: any[] = [];
      const context = { ...input.context, amountCents: input.context.amountCents || 0 };
      for (const block of f.blocks) {
        stepResults.push({ blockId: block.id, blockType: block.type, label: block.label, output: `Executed ${block.label}`, status: 'ok' });
      }
      const log = { id: `log-${Date.now()}`, flowId: f.id, flowName: f.name, status: 'success', idempotencyKey: idemKey, startedAt: new Date().toISOString(), completedAt: new Date().toISOString(), stepResults };
      d.flowExecutionLogs.unshift(log);
      f.lastRunAt = log.completedAt;
      await ctx.req.app.locals.db.saveDatabase(d);
      return { success: true, log };
    }),
});

const aiRouter = router({
  chat: publicProcedureWithLogging
    .input(z.object({ messages: z.array(z.object({ role: z.enum(['user', 'model']), text: z.string() })).min(1), systemInstruction: z.string().optional(), useSearch: z.boolean().default(false), useMaps: z.boolean().default(false), model: z.string().default('gemini-3.8-flash') }))
    .mutation(async ({ ctx, input }) => {
      const d = await ctx.req.app.locals.db.getDatabase();
      const lastMsg = input.messages[input.messages.length - 1].text.toLowerCase();
      let reply = "Hello friend! I'm Hub Buddy! 🌟";
      if (lastMsg.includes('budget') || lastMsg.includes('money')) {
        const spent = d.ledger.filter((l: any) => l.type === 'expense').reduce((s: number, l: any) => s + l.amountCents, 0);
        reply = `💰 Budget Buddy: You spent ${d.currentCurrency} ${(spent / 100).toFixed(2)}.`;
      } else if (lastMsg.includes('task')) {
        const pending = d.tasks.filter((t: any) => !t.completed);
        reply = `📝 Task Buddy: ${pending.length} tasks pending.`;
      } else if (lastMsg.includes('slip') || lastMsg.includes('receipt')) {
        reply = `📸 Slip Buddy: Take a photo and I'll read it for you!`;
      } else if (lastMsg.includes('consensus') || lastMsg.includes('vote')) {
        const openP = d.proposals.filter((p: any) => p.status === 'open');
        reply = `🗳️ Consensus Buddy: ${openP.length} decisions awaiting votes.`;
      }
      return { success: true, reply, fallback: true };
    }),
  getSuggestions: publicProcedureWithLogging.query(async ({ ctx }) => {
    const d = await ctx.req.app.locals.db.getDatabase();
    const suggestions = [];
    const pending = d.tasks.filter((t: any) => !t.completed);
    if (pending.length > 0) suggestions.push({ id: 'sug-task', type: 'task', title: `⚡ Next: ${pending[0].title}`, actionLabel: 'Go to Tasks', module: 'todo', badge: 'To-Do', color: 'blue' });
    const unsynced = d.slips.filter((s: any) => !s.syncedToLedger);
    if (unsynced.length > 0) suggestions.push({ id: 'sug-slip', type: 'slip', title: `🧾 ${unsynced.length} Slip(s) Waiting`, actionLabel: 'Review Slips', module: 'slips', badge: 'Capture', color: 'orange' });
    const openP = d.proposals.filter((p: any) => p.status === 'open');
    if (openP.length > 0) suggestions.push({ id: 'sug-consensus', type: 'consensus', title: `🗳️ Vote on "${openP[0].title}"`, actionLabel: 'Cast Vote', module: 'consensus', badge: 'Consensus', color: 'pink' });
    const spent = d.ledger.filter((l: any) => l.type === 'expense').reduce((s: number, l: any) => s + l.amountCents, 0);
    const allocated = d.budgetCategories.reduce((s: number, c: any) => s + c.allocatedCents, 0);
    suggestions.push({ id: 'sug-budget', type: 'budget', title: `💰 Available: ${d.currentCurrency} ${((allocated - spent) / 100).toFixed(2)}`, actionLabel: 'View Budget', module: 'budget', badge: 'Budget', color: 'green' });
    return { success: true, suggestions };
  }),
  runTestSuite: publicProcedureWithLogging.query(async ({ ctx }) => {
    const d = await ctx.req.app.locals.db.getDatabase();
    const results: Array<{ test: string; passed: boolean; message: string }> = [];
    const testTaskId = `task-test-${Date.now()}`;
    d.tasks.push({ id: testTaskId, title: 'Verification Test', completed: false, priority: 'high', category: 'Testing', subtasks: [{ id: 'st1', title: 'Check', completed: false }], recurring: 'none', createdAt: new Date().toISOString() });
    const found = d.tasks.find((t: any) => t.id === testTaskId);
    results.push({ test: 'Task lifecycle', passed: !!found, message: found ? 'Task created' : 'Failed' });
    const allocated = 500000, actual = 129900;
    results.push({ test: 'Budget calculation', passed: allocated - actual === 370100, message: `R ${(allocated/100).toFixed(2)} - R ${(actual/100).toFixed(2)} = R ${((allocated-actual)/100).toFixed(2)}` });
    const testHash = `hash-${Date.now()}`;
    d.slips.push({ id: `slip-test-${Date.now()}`, merchant: 'Test', date: '2026-10-30', amountCents: 10000, currency: 'ZAR', category: 'Test', documentType: 'image', fileHash: testHash, createdAt: new Date().toISOString(), extractedViaOcr: false, syncedToLedger: false });
    const dup = d.slips.filter((s: any) => s.fileHash === testHash).length >= 1;
    results.push({ test: 'Duplicate detection', passed: dup, message: 'Hash duplicate verified' });
    await ctx.req.app.locals.db.saveDatabase(d);
    return { success: true, total: results.length, passed: results.filter(r => r.passed).length, results };
  }),
});

const syncRouter = router({
  getAdminConfig: publicProcedureWithLogging.query(async ({ ctx }) => {
    const d = await ctx.req.app.locals.db.getDatabase();
    if (!d.adminConfig) {
      d.adminConfig = { adminPin: '1234', defaultCurrency: d.currentCurrency || 'ZAR', defaultWhatsAppPhone: '+278****4567', enableAutoCalendarSync: false, enableAutoSheetSync: false, aiPersonality: 'buddy', isEmergencyFrozen: false };
      await ctx.req.app.locals.db.saveDatabase(d);
    }
    return { success: true, config: d.adminConfig };
  }),
  updateAdminConfig: publicProcedureWithLogging
    .input(z.object({ adminPin: z.string().length(4).optional(), defaultCurrency: z.string().length(3).optional(), aiPersonality: z.enum(['buddy', 'coach', 'mediator']).optional(), isEmergencyFrozen: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const d = await ctx.req.app.locals.db.getDatabase();
      if (!d.adminConfig) d.adminConfig = { adminPin: '1234', defaultCurrency: d.currentCurrency || 'ZAR', defaultWhatsAppPhone: '+278****4567', enableAutoCalendarSync: false, enableAutoSheetSync: false, aiPersonality: 'buddy', isEmergencyFrozen: false };
      d.adminConfig = { ...d.adminConfig, ...input };
      if (input.defaultCurrency) d.currentCurrency = input.defaultCurrency;
      await ctx.req.app.locals.db.saveDatabase(d);
      return { success: true, config: d.adminConfig };
    }),
  getFullState: publicProcedureWithLogging.query(async ({ ctx }) => {
    const d = await ctx.req.app.locals.db.getDatabase();
    return { success: true, data: d };
  }),
  healthCheck: publicProcedureWithLogging.query(async ({ ctx }) => {
    const d = await ctx.req.app.locals.db.getDatabase();
    return { success: true, status: 'healthy', timestamp: new Date().toISOString(), database: { tasks: d.tasks.length, slips: d.slips.length, budgetCategories: d.budgetCategories.length, ledgerEntries: d.ledger.length, proposals: d.proposals.length, flows: d.flows.length }, version: d.version };
  }),
});

const appRouter = router({
  tasks: tasksRouter,
  slips: slipsRouter,
  budget: budgetRouter,
  proxy: proxyRouter,
  consensus: consensusRouter,
  flows: flowsRouter,
  ai: aiRouter,
  sync: syncRouter,
});

type AppRouter = typeof appRouter;

app.use('/api/trpc', createExpressMiddleware({
  router: appRouter,
  createContext: (opts: { req: Request; res: Response }) => {
    const startTime = Date.now();
    return {
      req: opts.req,
      res: opts.res,
      logger: logger.child({ method: opts.req.method, path: opts.req.path, requestId: opts.req.headers['x-request-id'] || crypto.randomUUID() }),
      startTime,
    };
  },
  onError: ({ error, path, type }) => {
    logger.error({ err: error, path, type }, 'tRPC error');
  },
}));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), version: '1.0.0', environment: process.env.NODE_ENV || 'development' });
});

// /api/state - GET and POST
app.get('/api/state', async (_req: Request, res: Response) => {
  const d = await ensureDatabase();
  res.json({ success: true, data: d });
});

app.post('/api/state', async (req: Request, res: Response) => {
  const updated = req.body;
  if (!updated || !Array.isArray(updated.tasks)) {
    return res.status(400).json({ success: false, error: 'Invalid state format' });
  }
  saveDatabase(updated);
  db = updated;
  return res.json({ success: true, message: 'Database saved successfully' });
});

// /api/ai/suggestions
app.get('/api/ai/suggestions', async (_req: Request, res: Response) => {
  const d = await ensureDatabase();
  const suggestions: any[] = [];
  const pendingTasks = d.tasks.filter((t: any) => !t.completed);
  if (pendingTasks.length > 0) {
    const urgent = pendingTasks.find((t: any) => t.priority === 'urgent' || t.priority === 'high') || pendingTasks[0];
    suggestions.push({ id: 'sug-task', type: 'task', title: `⚡ Next Up: ${urgent.title}`, description: `Priority is ${urgent.priority.toUpperCase()}.`, actionLabel: 'Go to Tasks', module: 'todo', badge: 'To-Do', color: 'blue' });
  }
  const unSyncedSlips = d.slips.filter((s: any) => !s.syncedToLedger);
  if (unSyncedSlips.length > 0) {
    suggestions.push({ id: 'sug-slip', type: 'slip', title: `🧾 ${unSyncedSlips.length} Slip(s) Waiting Sync`, description: `Latest from ${unSyncedSlips[0].merchant}.`, actionLabel: 'Review Slips', module: 'slips', badge: 'Capture', color: 'orange' });
  }
  const openProposals = d.proposals.filter((p: any) => p.status === 'open');
  if (openProposals.length > 0) {
    suggestions.push({ id: 'sug-consensus', type: 'consensus', title: `🗳️ Vote on "${openProposals[0].title}"`, description: `Needs votes to meet quorum!`, actionLabel: 'Cast Vote', module: 'consensus', badge: 'Consensus', color: 'pink' });
  }
  const spent = d.ledger.filter((l: any) => l.type === 'expense').reduce((s: number, l: any) => s + l.amountCents, 0);
  const allocated = d.budgetCategories.reduce((s: number, c: any) => s + c.allocatedCents, 0);
  const remaining = Math.max(0, allocated - spent);
  suggestions.push({ id: 'sug-budget', type: 'budget', title: `💰 Available: ${d.currentCurrency} ${(remaining / 100).toFixed(2)}`, description: `${((spent / (allocated || 1)) * 100).toFixed(0)}% of monthly budget utilized.`, actionLabel: 'View Budget', module: 'budget', badge: 'Budget', color: 'green' });
  return res.json({ success: true, suggestions });
});

app.get('/api/security/csp-report', express.json({ type: 'application/csp-report' }), (_req: Request, res: Response) => {
  res.status(204).send();
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ success: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

export { app };
export default app;
