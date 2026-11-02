'use client';

import { trpc } from '../lib/trpc/client';
import { useState } from 'react';
import type { TaskItem } from '../../types';

export function useTasks() {
  const utils = trpc.useContext();

  const getAll = trpc.tasks.getAll.useQuery(undefined, {
    enabled: true,
  });

  const create = trpc.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.getAll.invalidate();
    },
  });

  const update = trpc.tasks.update.useMutation({
    onSuccess: () => {
      utils.tasks.getAll.invalidate();
    },
  });

  const toggle = trpc.tasks.toggle.useMutation({
    onSuccess: () => {
      utils.tasks.getAll.invalidate();
    },
  });

  const remove = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      utils.tasks.getAll.invalidate();
    },
  });

  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (input: {
    title: string;
    description?: string;
    completed?: boolean;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
    subtasks: { id: string; title: string; completed: boolean }[];
    recurring: 'none' | 'daily' | 'weekly' | 'monthly';
    dueDate?: string;
  }) => {
    setError(null);
    try {
      await create.mutateAsync(input);
    } catch (err: any) {
      const msg = err?.message || 'Failed to create task';
      setError(msg);
      throw err;
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    setError(null);
    try {
      await toggle.mutateAsync({ id });
    } catch (err: any) {
      setError(err?.message || 'Failed to toggle task');
      throw err;
    }
  };

  const handleRemove = async (id: string) => {
    setError(null);
    try {
      await remove.mutateAsync({ id });
    } catch (err: any) {
      setError(err?.message || 'Failed to delete task');
      throw err;
    }
  };

  return {
    tasks: getAll.data?.data ?? [],
    isLoading: getAll.isLoading,
    error,
    createTask: handleCreate,
    toggleTask: handleToggle,
    deleteTask: handleRemove,
    updateTask: update.mutateAsync,
  };
}

export function useSlips() {
  const utils = trpc.useContext();

  const getAll = trpc.slips.getAll.useQuery(undefined);
  const create = trpc.slips.create.useMutation({
    onSuccess: () => {
      utils.slips.getAll.invalidate();
    },
  });
  const syncToLedger = trpc.slips.syncToLedger.useMutation({
    onSuccess: () => {
      utils.slips.getAll.invalidate();
      utils.budget.getSummary.invalidate();
    },
  });

  return {
    slips: getAll.data?.data ?? [],
    isLoading: getAll.isLoading,
    createSlip: create.mutateAsync,
    syncSlipToLedger: syncToLedger.mutateAsync,
  };
}

export function useBudget() {
  const utils = trpc.useContext();

  const getCategories = trpc.budget.getCategories.useQuery(undefined);
  const createCategory = trpc.budget.createCategory.useMutation({
    onSuccess: () => {
      utils.budget.getCategories.invalidate();
    },
  });
  const createLedgerEntry = trpc.budget.createLedgerEntry.useMutation({
    onSuccess: () => {
      utils.budget.getSummary.invalidate();
    },
  });
  const getSummary = trpc.budget.getSummary.useQuery(undefined);

  return {
    categories: getCategories.data?.data ?? [],
    summary: getSummary.data?.data,
    isLoading: getCategories.isLoading || getSummary.isLoading,
    createCategory: createCategory.mutateAsync,
    createLedgerEntry: createLedgerEntry.mutateAsync,
  };
}

export function useConsensus() {
  const utils = trpc.useContext();

  const getAll = trpc.consensus.getAll.useQuery(undefined);
  const create = trpc.consensus.create.useMutation({
    onSuccess: () => {
      utils.consensus.getAll.invalidate();
    },
  });
  const vote = trpc.consensus.vote.useMutation({
    onSuccess: () => {
      utils.consensus.getAll.invalidate();
      utils.tasks.getAll.invalidate();
    },
  });

  return {
    proposals: getAll.data?.data ?? [],
    isLoading: getAll.isLoading,
    createProposal: create.mutateAsync,
    voteOnProposal: vote.mutateAsync,
  };
}

export function useFlows() {
  const utils = trpc.useContext();

  const getAll = trpc.flows.getAll.useQuery(undefined);
  const create = trpc.flows.create.useMutation({
    onSuccess: () => {
      utils.flows.getAll.invalidate();
    },
  });
  const execute = trpc.flows.execute.useMutation({
    onSuccess: () => {
      utils.flows.getAll.invalidate();
      utils.tasks.getAll.invalidate();
    },
  });

  return {
    flows: getAll.data?.data ?? [],
    isLoading: getAll.isLoading,
    createFlow: create.mutateAsync,
    executeFlow: execute.mutateAsync,
  };
}

export function useAI() {
  const utils = trpc.useContext();

  const chat = trpc.ai.chat.useMutation({
    onSuccess: () => {
      utils.ai.getSuggestions.invalidate();
    },
  });
  const getSuggestions = trpc.ai.getSuggestions.useQuery(undefined);
  const runTestSuite = trpc.ai.runTestSuite.useQuery(undefined);

  return {
    suggestions: getSuggestions.data?.suggestions ?? [],
    isLoading: getSuggestions.isLoading,
    sendChat: chat.mutateAsync,
    runTestSuite,
  };
}

export function useSync() {
  const utils = trpc.useContext();

  const healthCheck = trpc.sync.healthCheck.useQuery(undefined, {
    refetchInterval: 60000,
  });
  const getAdminConfig = trpc.sync.getAdminConfig.useQuery(undefined);
  const updateAdminConfig = trpc.sync.updateAdminConfig.useMutation({
    onSuccess: () => {
      utils.sync.getAdminConfig.invalidate();
    },
  });
  const getFullState = trpc.sync.getFullState.useQuery(undefined);

  return {
    health: healthCheck.data?.data,
    adminConfig: getAdminConfig.data?.config,
    fullState: getFullState.data?.data,
    isLoading: healthCheck.isLoading || getAdminConfig.isLoading,
    updateAdminConfig: updateAdminConfig.mutateAsync,
  };
}