import { router } from '../trpc';
import { publicProcedureWithLogging, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

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
    isDelegatedVote: z.boolean().optional(),
    delegatedFromUserId: z.string().optional(),
    votedAt: z.string(),
  })).default({}),
  comments: z.array(z.object({
    id: z.string(),
    userId: z.string(),
    userName: z.string(),
    text: z.string(),
    createdAt: z.string(),
    isAmendmentProposal: z.boolean().optional(),
  })).default([]),
  status: z.enum(['open', 'finalized_approved', 'finalized_rejected']).default('open'),
  resolvedObjections: z.array(z.string()).default([]),
  resultingActionItemIds: z.array(z.string()).optional(),
});

function evaluateConsensusDecision(proposal: any) {
  const votes = Object.values(proposal.votes);
  const agreeCount = votes.filter((v: any) => v.vote === 'agree').length;
  const objectCount = votes.filter((v: any) => v.vote === 'object').length;
  const discussCount = votes.filter((v: any) => v.vote === 'discuss').length;
  const totalVotes = votes.length;
  const quorumMet = totalVotes >= proposal.minQuorumCount;

  let finalized = false;
  let status: 'open' | 'finalized_approved' | 'finalized_rejected' = 'open';
  let reason = '';

  if (!quorumMet) {
    return { finalized: false, status: 'open', reason: 'Quorum not reached' };
  }

  switch (proposal.decisionRule) {
    case 'unanimous':
      if (objectCount > 0 || discussCount > 0) {
        reason = 'Unanimous rule requires all agree votes';
      } else if (agreeCount === proposal.eligibleVoterIds.length) {
        finalized = true;
        status = 'finalized_approved';
        reason = 'Unanimous approval';
      }
      break;
    case 'consent':
      if (objectCount > 0 && !proposal.resolvedObjections.includes(
        Object.values(proposal.votes).find((v: any) => v.vote === 'object')?.userId || ''
      )) {
        reason = 'Blocking objection exists';
      } else if (agreeCount > 0) {
        finalized = true;
        status = 'finalized_approved';
        reason = 'Consent achieved (no blocking objections)';
      }
      break;
    case 'supermajority':
      if (agreeCount / totalVotes >= 0.75) {
        finalized = true;
        status = 'finalized_approved';
        reason = 'Supermajority reached';
      } else {
        reason = 'Supermajority not reached';
      }
      break;
    case 'majority':
      if (agreeCount / totalVotes > 0.5) {
        finalized = true;
        status = 'finalized_approved';
        reason = 'Majority reached';
      } else {
        reason = 'Majority not reached';
      }
      break;
  }

  return { finalized, status, reason };
}

export const consensusRouter = router({
  getAll: publicProcedureWithLogging
    .input(z.object({ status: z.enum(['open', 'finalized_approved', 'finalized_rejected']).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      let proposals = db.proposals;
      if (input?.status) {
        proposals = proposals.filter((p: any) => p.status === input.status);
      }
      return { success: true, data: proposals };
    }),

  getById: publicProcedureWithLogging
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const proposal = db.proposals.find((p: any) => p.id === input.id);
      if (!proposal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' });
      }
      return { success: true, data: proposal };
    }),

  create: protectedProcedure
    .input(proposalSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const newProposal = {
        ...input,
        id: input.id || `prop-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      db.proposals.unshift(newProposal);
      await ctx.req.app.locals.db.saveDatabase(db);
      return { success: true, data: newProposal };
    }),

  vote: protectedProcedure
    .input(z.object({
      proposalId: z.string(),
      userId: z.string(),
      userName: z.string(),
      vote: z.enum(['agree', 'discuss', 'object', 'abstain']),
      objectionReason: z.string().optional(),
      isDelegatedVote: z.boolean().optional(),
      delegatedFromUserId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const proposal = db.proposals.find((p: any) => p.id === input.proposalId);
      if (!proposal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' });
      }
      if (proposal.status !== 'open') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Proposal is not open for voting' });
      }
      if (!proposal.eligibleVoterIds.includes(input.userId)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'User not eligible to vote' });
      }

      proposal.votes[input.userId] = {
        userId: input.userId,
        userName: input.userName,
        vote: input.vote,
        objectionReason: input.objectionReason,
        isDelegatedVote: input.isDelegatedVote,
        delegatedFromUserId: input.delegatedFromUserId,
        votedAt: new Date().toISOString(),
      };

      const evaluation = evaluateConsensusDecision(proposal);
      if (evaluation.finalized) {
        proposal.status = evaluation.status;
        proposal.finalizedAt = new Date().toISOString();

        if (evaluation.status === 'finalized_approved') {
          const actionTask = {
            id: `task-prop-${Date.now()}`,
            title: `[CONSENSUS] ${proposal.title}`,
            description: `Action item from approved consensus: ${proposal.description}`,
            completed: false,
            priority: 'high' as const,
            category: 'Consensus Actions',
            subtasks: [],
            recurring: 'none' as const,
            createdAt: new Date().toISOString(),
          };
          db.tasks.unshift(actionTask);
          proposal.resultingActionItemIds = [actionTask.id];
        }
      }

      await ctx.req.app.locals.db.saveDatabase(db);
      return { success: true, data: { proposal, evaluation } };
    }),

  addComment: protectedProcedure
    .input(z.object({
      proposalId: z.string(),
      userId: z.string(),
      userName: z.string(),
      text: z.string(),
      isAmendmentProposal: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const proposal = db.proposals.find((p: any) => p.id === input.proposalId);
      if (!proposal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' });
      }
      const comment = {
        id: `comment-${Date.now()}`,
        userId: input.userId,
        userName: input.userName,
        text: input.text,
        createdAt: new Date().toISOString(),
        isAmendmentProposal: input.isAmendmentProposal,
      };
      proposal.comments.push(comment);
      await ctx.req.app.locals.db.saveDatabase(db);
      return { success: true, data: comment };
    }),

  resolveObjection: protectedProcedure
    .input(z.object({
      proposalId: z.string(),
      objectionUserId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.req.app.locals.db.getDatabase();
      const proposal = db.proposals.find((p: any) => p.id === input.proposalId);
      if (!proposal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' });
      }
      if (!proposal.resolvedObjections.includes(input.objectionUserId)) {
        proposal.resolvedObjections.push(input.objectionUserId);
      }
      await ctx.req.app.locals.db.saveDatabase(db);
      return { success: true, data: proposal };
    }),
});