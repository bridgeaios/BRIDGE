import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from 'firebase/auth';
import {
  AdminConfig,
  AppDatabase,
  ConsensusProposal,
  FlowWorkflow,
  LedgerEntry,
  ModuleType,
  ProxyDelegation,
  SlipReceipt,
  TaskItem,
  UserPersona,
  VoteType,
} from '../types';
import { DEMO_PERSONAS, getInitialDemoDatabase } from '../utils/demoData';
import { isSoundEnabled, playSound, setSoundEnabled } from '../utils/sound';
import { isHapticsEnabled, setHapticsEnabled, triggerHaptic } from '../utils/haptics';
import { getActiveCurrency, setActiveCurrency, SUPPORTED_CURRENCIES, CurrencyConfig } from '../utils/money';
import { initAuth, googleSignIn, logout as googleLogout } from '../utils/googleWorkspace';
import { syncAllToGoogleWorkspace, SyncResult, getLastSyncResult } from '../services/googleSyncService';

interface AppContextType {
  db: AppDatabase;
  activePersona: UserPersona;
  setActivePersona: (p: UserPersona) => void;
  personas: UserPersona[];
  activeModule: ModuleType;
  setActiveModule: (m: ModuleType) => void;
  soundOn: boolean;
  toggleSound: () => void;
  hapticsOn: boolean;
  toggleHaptics: () => void;
  currency: CurrencyConfig;
  setCurrency: (code: string) => void;
  isOnline: boolean;
  syncStatus: 'synced' | 'saving' | 'offline';
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
  testRunnerOpen: boolean;
  setTestRunnerOpen: (open: boolean) => void;

  // Admin & Modals
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  isAiChatOpen: boolean;
  setIsAiChatOpen: (open: boolean) => void;
  isSyncModalOpen: boolean;
  setIsSyncModalOpen: (open: boolean) => void;
  isGmailSummaryOpen: boolean;
  setIsGmailSummaryOpen: (open: boolean) => void;
  adminConfig: AdminConfig;
  updateAdminConfig: (cfg: Partial<AdminConfig>) => Promise<void>;

  // Google Workspace & Auth
  googleUser: User | null;
  googleToken: string | null;
  isGoogleConnected: boolean;
  connectGoogle: () => Promise<void>;
  disconnectGoogle: () => Promise<void>;

  // Google Sheets & Drive Sync
  isGoogleSyncing: boolean;
  lastGoogleSyncResult: SyncResult | null;
  syncGoogleNow: (options?: { forceNew?: boolean }) => Promise<SyncResult>;
  toggleAutoSync: () => Promise<void>;

  // AI suggestions
  aiSuggestions: any[];
  refreshAiSuggestions: () => Promise<void>;

  // Task actions
  addTask: (task: Omit<TaskItem, 'id' | 'createdAt'>) => TaskItem;
  updateTask: (id: string, updates: Partial<TaskItem>) => void;
  toggleTaskCompleted: (id: string) => void;
  deleteTask: (id: string) => void;

  // Slip actions
  addSlip: (slip: Omit<SlipReceipt, 'id' | 'createdAt'>) => Promise<SlipReceipt>;
  updateSlip: (id: string, updates: Partial<SlipReceipt>) => void;
  deleteSlip: (id: string) => void;
  syncSlipToLedger: (slipId: string) => void;

  // Budget actions
  addLedgerEntry: (entry: Omit<LedgerEntry, 'id' | 'createdAt'>) => void;
  deleteLedgerEntry: (id: string) => void;
  transferFunds: (fromCatId: string, toCatId: string, amountCents: number, reason: string) => void;
  updateCategoryAllocation: (catId: string, allocatedCents: number, limitCents?: number) => void;
  updateSavingsGoal: (id: string, addedCents: number) => void;

  // Proxy actions
  createProxyDelegation: (delegation: Omit<ProxyDelegation, 'id' | 'createdAt'>) => void;
  revokeProxyDelegation: (id: string) => void;
  verifyProxyPermission: (proxyId: string, requiredPermission: string, amountCents?: number) => Promise<{ authorized: boolean; reason?: string }>;

  // Consensus actions
  createProposal: (proposal: Omit<ConsensusProposal, 'id' | 'createdAt' | 'votes' | 'comments' | 'status' | 'resolvedObjections'>) => void;
  castVote: (proposalId: string, vote: VoteType, objectionReason?: string) => Promise<void>;
  addComment: (proposalId: string, text: string) => void;
  resolveObjection: (proposalId: string, objectionKey: string) => void;

  // Flow actions
  createFlow: (flow: Omit<FlowWorkflow, 'id' | 'createdAt'>) => void;
  runFlow: (flowId: string, inputData?: any) => Promise<any>;
  deleteFlow: (flowId: string) => void;

  // Global actions
  resetDemoData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<AppDatabase>(() => {
    try {
      const cached = localStorage.getItem('bb_database_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.version) return parsed;
      }
    } catch {}
    return getInitialDemoDatabase();
  });

  const [activePersona, setActivePersona] = useState<UserPersona>(DEMO_PERSONAS[0]);
  const [activeModule, setActiveModule] = useState<ModuleType>('home');
  const [soundOn, setSoundOnState] = useState<boolean>(isSoundEnabled);
  const [hapticsOn, setHapticsOnState] = useState<boolean>(isHapticsEnabled);
  const [currency, setCurrencyState] = useState<CurrencyConfig>(getActiveCurrency);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'offline'>('synced');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [testRunnerOpen, setTestRunnerOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isGmailSummaryOpen, setIsGmailSummaryOpen] = useState(false);
  const [isGoogleSyncing, setIsGoogleSyncing] = useState(false);
  const [lastGoogleSyncResult, setLastGoogleSyncResult] = useState<SyncResult | null>(() => getLastSyncResult());
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  // Google Workspace & Firebase Auth
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);

  const defaultAdminConfig: AdminConfig = {
    adminPin: '1234',
    defaultCurrency: 'ZAR',
    defaultWhatsAppPhone: '+27821234567',
    enableAutoCalendarSync: false,
    enableAutoSheetSync: false,
    aiPersonality: 'buddy',
    isEmergencyFrozen: false,
  };

  const adminConfig: AdminConfig = db.adminConfig || defaultAdminConfig;

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const connectGoogle = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        playSound.celebrate();
        triggerHaptic.heavy();
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      throw err;
    }
  };

  const disconnectGoogle = async () => {
    await googleLogout();
    setGoogleUser(null);
    setGoogleToken(null);
    playSound.pop();
    triggerHaptic.light();
  };

  const refreshAiSuggestions = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/suggestions');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.suggestions) {
          setAiSuggestions(data.suggestions);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    refreshAiSuggestions();
  }, [refreshAiSuggestions]);

  // Monitor connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('synced');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch latest state from server on startup
  useEffect(() => {
    let isMounted = true;
    async function fetchServerState() {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            setDb(json.data);
            localStorage.setItem('bb_database_cache', JSON.stringify(json.data));
          }
        }
      } catch (err) {
        console.warn('Backend not yet ready, using cached/demo state:', err);
      }
    }
    fetchServerState();
    return () => { isMounted = false; };
  }, []);

  // Persist helper (sends to server + caches in localStorage)
  const persistDatabase = useCallback(async (newDb: AppDatabase) => {
    setDb(newDb);
    try {
      localStorage.setItem('bb_database_cache', JSON.stringify(newDb));
    } catch {}

    if (navigator.onLine) {
      setSyncStatus('saving');
      try {
        const res = await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newDb),
        });
        if (res.ok) {
          setSyncStatus('synced');
        } else {
          setSyncStatus('offline');
        }
      } catch {
        setSyncStatus('offline');
      }
    } else {
      setSyncStatus('offline');
    }
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOnState(next);
    setSoundEnabled(next);
    if (next) playSound.pop();
  };

  const toggleHaptics = () => {
    const next = !hapticsOn;
    setHapticsOnState(next);
    setHapticsEnabled(next);
    if (next) triggerHaptic.medium();
  };

  const setCurrency = (code: string) => {
    const next = setActiveCurrency(code);
    setCurrencyState(next);
    persistDatabase({ ...db, currentCurrency: next.code });
  };

  // ---------------- TASKS ----------------
  const addTask = (taskInput: Omit<TaskItem, 'id' | 'createdAt'>): TaskItem => {
    const newTask: TaskItem = {
      ...taskInput,
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    const updatedTasks = [newTask, ...db.tasks];
    persistDatabase({ ...db, tasks: updatedTasks });
    playSound.pop();
    triggerHaptic.light();
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<TaskItem>) => {
    const updatedTasks = db.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    persistDatabase({ ...db, tasks: updatedTasks });
  };

  const toggleTaskCompleted = (id: string) => {
    const updatedTasks = db.tasks.map((t) => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        if (nextCompleted) {
          playSound.complete();
          triggerHaptic.success();
        } else {
          playSound.tap();
        }
        return {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });
    persistDatabase({ ...db, tasks: updatedTasks });
  };

  const deleteTask = (id: string) => {
    const updatedTasks = db.tasks.filter((t) => t.id !== id);
    persistDatabase({ ...db, tasks: updatedTasks });
    playSound.alert();
    triggerHaptic.light();
  };

  // ---------------- SLIPS ----------------
  const addSlip = async (slipInput: Omit<SlipReceipt, 'id' | 'createdAt'>): Promise<SlipReceipt> => {
    const newSlip: SlipReceipt = {
      ...slipInput,
      id: `slip-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };

    // Duplicate check
    const isDuplicate = db.slips.some(
      (s) =>
        (s.fileHash && s.fileHash === newSlip.fileHash) ||
        (s.merchant.toLowerCase().trim() === newSlip.merchant.toLowerCase().trim() &&
          s.date === newSlip.date &&
          s.amountCents === newSlip.amountCents)
    );

    newSlip.isDuplicate = isDuplicate;
    const updatedSlips = [newSlip, ...db.slips];

    // If not duplicate, automatically link to budget ledger
    let updatedLedger = db.ledger;
    if (!isDuplicate && newSlip.amountCents > 0) {
      const targetCategory = db.budgetCategories.find((c) => c.name === newSlip.category) || db.budgetCategories[0];
      const ledgerEntry: LedgerEntry = {
        id: `led-${Date.now()}`,
        title: newSlip.merchant,
        type: 'expense',
        amountCents: newSlip.amountCents,
        date: newSlip.date,
        categoryId: targetCategory ? targetCategory.id : 'cat-gear',
        slipId: newSlip.id,
        source: newSlip.extractedViaOcr ? 'slip_ocr' : 'manual_slip',
        notes: newSlip.description,
        createdByUserId: activePersona.id,
        createdAt: new Date().toISOString(),
      };
      updatedLedger = [ledgerEntry, ...db.ledger];
      newSlip.syncedToLedger = true;
    }

    persistDatabase({ ...db, slips: updatedSlips, ledger: updatedLedger });
    playSound.cash();
    triggerHaptic.medium();
    return newSlip;
  };

  const updateSlip = (id: string, updates: Partial<SlipReceipt>) => {
    const updatedSlips = db.slips.map((s) => (s.id === id ? { ...s, ...updates } : s));
    persistDatabase({ ...db, slips: updatedSlips });
  };

  const deleteSlip = (id: string) => {
    const updatedSlips = db.slips.filter((s) => s.id !== id);
    persistDatabase({ ...db, slips: updatedSlips });
  };

  const syncSlipToLedger = (slipId: string) => {
    const slip = db.slips.find((s) => s.id === slipId);
    if (!slip) return;
    const targetCat = db.budgetCategories.find((c) => c.name === slip.category) || db.budgetCategories[0];
    const newLedger: LedgerEntry = {
      id: `led-${Date.now()}`,
      title: slip.merchant,
      type: 'expense',
      amountCents: slip.amountCents,
      date: slip.date,
      categoryId: targetCat.id,
      slipId: slip.id,
      source: 'slip_manual_sync',
      notes: slip.description,
      createdByUserId: activePersona.id,
      createdAt: new Date().toISOString(),
    };
    const updatedSlips = db.slips.map((s) => (s.id === slipId ? { ...s, syncedToLedger: true } : s));
    persistDatabase({
      ...db,
      slips: updatedSlips,
      ledger: [newLedger, ...db.ledger],
    });
    playSound.cash();
  };

  // ---------------- BUDGET ----------------
  const addLedgerEntry = (entryInput: Omit<LedgerEntry, 'id' | 'createdAt'>) => {
    const newEntry: LedgerEntry = {
      ...entryInput,
      id: `led-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    persistDatabase({ ...db, ledger: [newEntry, ...db.ledger] });
    playSound.cash();
    triggerHaptic.light();
  };

  const deleteLedgerEntry = (id: string) => {
    const updatedLedger = db.ledger.filter((l) => l.id !== id);
    persistDatabase({ ...db, ledger: updatedLedger });
  };

  const transferFunds = (fromCatId: string, toCatId: string, amountCents: number, reason: string) => {
    if (fromCatId === toCatId || amountCents <= 0) return;
    const updatedCats = db.budgetCategories.map((c) => {
      if (c.id === fromCatId) return { ...c, allocatedCents: Math.max(0, c.allocatedCents - amountCents) };
      if (c.id === toCatId) return { ...c, allocatedCents: c.allocatedCents + amountCents };
      return c;
    });

    const transferLedger: LedgerEntry = {
      id: `led-xfer-${Date.now()}`,
      title: `Transfer to ${db.budgetCategories.find((c) => c.id === toCatId)?.name || 'Category'}`,
      type: 'transfer',
      amountCents,
      date: new Date().toISOString().split('T')[0],
      categoryId: fromCatId,
      toCategoryId: toCatId,
      source: 'budget_transfer',
      notes: reason,
      createdByUserId: activePersona.id,
      createdAt: new Date().toISOString(),
    };

    persistDatabase({ ...db, budgetCategories: updatedCats, ledger: [transferLedger, ...db.ledger] });
    playSound.complete();
    triggerHaptic.medium();
  };

  const updateCategoryAllocation = (catId: string, allocatedCents: number, limitCents?: number) => {
    const updated = db.budgetCategories.map((c) =>
      c.id === catId ? { ...c, allocatedCents, spendingLimitCents: limitCents ?? c.spendingLimitCents } : c
    );
    persistDatabase({ ...db, budgetCategories: updated });
  };

  const updateSavingsGoal = (id: string, addedCents: number) => {
    const updated = db.savingsGoals.map((g) =>
      g.id === id ? { ...g, currentCents: Math.max(0, g.currentCents + addedCents) } : g
    );
    persistDatabase({ ...db, savingsGoals: updated });
    playSound.cash();
  };

  // ---------------- PROXIES ----------------
  const createProxyDelegation = (delegationInput: Omit<ProxyDelegation, 'id' | 'createdAt'>) => {
    const newDelegation: ProxyDelegation = {
      ...delegationInput,
      id: `proxy-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    persistDatabase({ ...db, proxies: [newDelegation, ...db.proxies] });
    playSound.complete();
    triggerHaptic.medium();
  };

  const revokeProxyDelegation = (id: string) => {
    const updatedProxies = db.proxies.map((p) => (p.id === id ? { ...p, status: 'revoked' as const } : p));
    const auditRecord = {
      id: `aud-${Date.now()}`,
      proxyId: id,
      action: 'revoke_authority',
      details: `Owner ${activePersona.name} revoked delegation`,
      timestamp: new Date().toISOString(),
      authorized: true,
    };
    persistDatabase({
      ...db,
      proxies: updatedProxies,
      proxyAuditLogs: [auditRecord, ...db.proxyAuditLogs],
    });
    playSound.alert();
  };

  const verifyProxyPermission = async (proxyId: string, requiredPermission: string, amountCents?: number) => {
    try {
      const res = await fetch('/api/proxy/authorize-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxyId, requiredPermission, amountCents }),
      });
      const data = await res.json();
      return { authorized: data.authorized, reason: data.error };
    } catch {
      // Offline fallback: check local rules
      const delegation = db.proxies.find((p) => p.id === proxyId);
      if (!delegation) return { authorized: false, reason: 'Proxy not found' };
      if (delegation.status !== 'active') return { authorized: false, reason: `Proxy is ${delegation.status}` };
      if (!delegation.permissions.includes(requiredPermission as any)) {
        return { authorized: false, reason: 'Permission not granted' };
      }
      if (amountCents && amountCents > delegation.approvalCeilingCents) {
        return { authorized: false, reason: 'Amount exceeds ceiling' };
      }
      return { authorized: true };
    }
  };

  // ---------------- CONSENSUS ----------------
  const createProposal = (
    propInput: Omit<ConsensusProposal, 'id' | 'createdAt' | 'votes' | 'comments' | 'status' | 'resolvedObjections'>
  ) => {
    const newProp: ConsensusProposal = {
      ...propInput,
      id: `prop-${Date.now()}`,
      votes: {},
      comments: [],
      status: 'open',
      resolvedObjections: [],
      resultingActionItemIds: [],
      createdAt: new Date().toISOString(),
    };
    persistDatabase({ ...db, proposals: [newProp, ...db.proposals] });
    playSound.pop();
    triggerHaptic.light();
  };

  const castVote = async (proposalId: string, vote: VoteType, objectionReason?: string) => {
    try {
      const res = await fetch('/api/consensus/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId,
          userId: activePersona.id,
          userName: activePersona.name,
          vote,
          objectionReason,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.proposal) {
          const updatedProps = db.proposals.map((p) => (p.id === proposalId ? data.proposal : p));
          setDb({ ...db, proposals: updatedProps });
          if (data.evaluation?.finalized) {
            playSound.complete();
            triggerHaptic.heavy();
          } else {
            playSound.pop();
            triggerHaptic.medium();
          }
          return;
        }
      }
    } catch (err) {
      console.warn('Cast vote API failed, applying local update:', err);
    }

    // Client fallback
    const prop = db.proposals.find((p) => p.id === proposalId);
    if (!prop) return;
    prop.votes[activePersona.id] = {
      userId: activePersona.id,
      userName: activePersona.name,
      vote,
      objectionReason: vote === 'object' ? objectionReason : undefined,
      votedAt: new Date().toISOString(),
    };
    persistDatabase({ ...db });
    playSound.pop();
  };

  const addComment = (proposalId: string, text: string) => {
    const prop = db.proposals.find((p) => p.id === proposalId);
    if (!prop || !text.trim()) return;
    const comment = {
      id: `c-${Date.now()}`,
      userId: activePersona.id,
      userName: activePersona.name,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    prop.comments.push(comment);
    persistDatabase({ ...db });
    playSound.tap();
  };

  const resolveObjection = (proposalId: string, objectionKey: string) => {
    const prop = db.proposals.find((p) => p.id === proposalId);
    if (!prop) return;
    if (!prop.resolvedObjections.includes(objectionKey)) {
      prop.resolvedObjections.push(objectionKey);
      persistDatabase({ ...db });
      playSound.complete();
    }
  };

  // ---------------- FLOWS ----------------
  const createFlow = (flowInput: Omit<FlowWorkflow, 'id' | 'createdAt'>) => {
    const newFlow: FlowWorkflow = {
      ...flowInput,
      id: `flow-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    persistDatabase({ ...db, flows: [newFlow, ...db.flows] });
    playSound.pop();
  };

  const runFlow = async (flowId: string, inputData?: any) => {
    const idempotencyKey = `idem-run-${flowId}-${Date.now()}`;
    try {
      const res = await fetch('/api/flows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flowId, inputData, idempotencyKey }),
      });
      const data = await res.json();
      if (data.log) {
        // Refresh state from server
        const stateRes = await fetch('/api/state');
        if (stateRes.ok) {
          const stateData = await stateRes.json();
          setDb(stateData.data);
        }
        playSound.complete();
        triggerHaptic.heavy();
        return data.log;
      }
    } catch (err) {
      console.warn('Flow execution failed:', err);
    }
    return null;
  };

  const deleteFlow = (flowId: string) => {
    const updated = db.flows.filter((f) => f.id !== flowId);
    persistDatabase({ ...db, flows: updated });
  };

  // ---------------- RESET DEMO ----------------
  const resetDemoData = async () => {
    try {
      const res = await fetch('/api/reset-demo', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setDb(data.data);
        localStorage.setItem('bb_database_cache', JSON.stringify(data.data));
        playSound.complete();
        triggerHaptic.heavy();
        return;
      }
    } catch {}
    const demo = getInitialDemoDatabase();
    persistDatabase(demo);
    playSound.complete();
  };

  // ---------------- ADMIN CONFIG ----------------
  const updateAdminConfig = async (newConfig: Partial<AdminConfig>) => {
    const merged: AdminConfig = {
      ...(db.adminConfig || defaultAdminConfig),
      ...newConfig,
    };
    persistDatabase({ ...db, adminConfig: merged });
    try {
      await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: merged }),
      });
    } catch {}
    playSound.toggle();
    triggerHaptic.medium();
  };

  // ---------------- GOOGLE SYNC & AUTO-SYNC ----------------
  const syncGoogleNow = async (options?: { forceNew?: boolean }): Promise<SyncResult> => {
    setIsGoogleSyncing(true);
    try {
      const result = await syncAllToGoogleWorkspace(db, {
        userPersonaName: activePersona.name,
        forceNewSpreadsheet: options?.forceNew,
      });
      setLastGoogleSyncResult(result);
      if (result.success) {
        playSound.celebrate();
        triggerHaptic.heavy();
        const merged: AdminConfig = {
          ...(db.adminConfig || defaultAdminConfig),
          lastSyncedAt: result.timestamp,
          lastSyncedSpreadsheetUrl: result.spreadsheetUrl,
          lastSyncedDriveUrl: result.driveFileUrl,
        };
        persistDatabase({ ...db, adminConfig: merged });
        try {
          await fetch('/api/admin/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: merged }),
          });
        } catch {}
      } else {
        playSound.alert();
        triggerHaptic.medium();
      }
      return result;
    } finally {
      setIsGoogleSyncing(false);
    }
  };

  const toggleAutoSync = async () => {
    const nextVal = !adminConfig.enableAutoSheetSync;
    const merged: AdminConfig = {
      ...(db.adminConfig || defaultAdminConfig),
      enableAutoSheetSync: nextVal,
    };
    persistDatabase({ ...db, adminConfig: merged });
    try {
      await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: merged }),
      });
    } catch {}
    playSound.toggle();
    triggerHaptic.medium();

    if (nextVal && googleUser) {
      // Trigger immediate initial sync on enabling
      syncGoogleNow();
    }
  };

  // Debounced reactive auto-sync on database modifications
  const isInitialMount = React.useRef(true);
  const autoSyncTimer = React.useRef<any>(null);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!adminConfig.enableAutoSheetSync || !googleUser || !isOnline) {
      return;
    }

    if (autoSyncTimer.current) {
      clearTimeout(autoSyncTimer.current);
    }

    autoSyncTimer.current = setTimeout(async () => {
      if (isGoogleSyncing) return;
      try {
        setIsGoogleSyncing(true);
        const res = await syncAllToGoogleWorkspace(db, {
          userPersonaName: activePersona.name,
        });
        setLastGoogleSyncResult(res);
        if (res.success) {
          const merged: AdminConfig = {
            ...(db.adminConfig || defaultAdminConfig),
            lastSyncedAt: res.timestamp,
            lastSyncedSpreadsheetUrl: res.spreadsheetUrl,
            lastSyncedDriveUrl: res.driveFileUrl,
          };
          persistDatabase({ ...db, adminConfig: merged });
          try {
            await fetch('/api/admin/config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ config: merged }),
            });
          } catch {}
        }
      } catch (err) {
        console.warn('Background auto-sync failed:', err);
      } finally {
        setIsGoogleSyncing(false);
      }
    }, 6000);

    return () => {
      if (autoSyncTimer.current) clearTimeout(autoSyncTimer.current);
    };
  }, [
    db.tasks,
    db.ledger,
    db.budgetCategories,
    db.proposals,
    adminConfig.enableAutoSheetSync,
    !!googleUser,
    isOnline,
  ]);

  return (
    <AppContext.Provider
      value={{
        db,
        activePersona,
        setActivePersona,
        personas: DEMO_PERSONAS,
        activeModule,
        setActiveModule,
        soundOn,
        toggleSound,
        hapticsOn,
        toggleHaptics,
        currency,
        setCurrency,
        isOnline,
        syncStatus,
        quickAddOpen,
        setQuickAddOpen,
        testRunnerOpen,
        setTestRunnerOpen,
        isAdminOpen,
        setIsAdminOpen,
        isAiChatOpen,
        setIsAiChatOpen,
        isSyncModalOpen,
        setIsSyncModalOpen,
        isGmailSummaryOpen,
        setIsGmailSummaryOpen,
        adminConfig,
        updateAdminConfig,
        googleUser,
        googleToken,
        isGoogleConnected: !!googleUser,
        connectGoogle,
        disconnectGoogle,
        isGoogleSyncing,
        lastGoogleSyncResult,
        syncGoogleNow,
        toggleAutoSync,
        aiSuggestions,
        refreshAiSuggestions,
        addTask,
        updateTask,
        toggleTaskCompleted,
        deleteTask,
        addSlip,
        updateSlip,
        deleteSlip,
        syncSlipToLedger,
        addLedgerEntry,
        deleteLedgerEntry,
        transferFunds,
        updateCategoryAllocation,
        updateSavingsGoal,
        createProxyDelegation,
        revokeProxyDelegation,
        verifyProxyPermission,
        createProposal,
        castVote,
        addComment,
        resolveObjection,
        createFlow,
        runFlow,
        deleteFlow,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
