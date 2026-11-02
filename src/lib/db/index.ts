import Dexie, { Table } from 'dexie';

export interface OfflineTaskItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  subtasks: { id: string; title: string; completed: boolean }[];
  recurring: 'none' | 'daily' | 'weekly' | 'monthly';
  assignedProxyId?: string;
  linkedBudgetId?: string;
  linkedSlipId?: string;
  linkedProposalId?: string;
  createdAt: string;
  completedAt?: string;
  synced: boolean;
  localChanges: boolean;
}

export interface OfflineSlipReceipt {
  id: string;
  merchant: string;
  date: string;
  amountCents: number;
  currency: string;
  taxCents?: number;
  category: string;
  description?: string;
  documentDataUrl?: string;
  documentType: 'image' | 'pdf';
  fileHash: string;
  isDuplicate: boolean;
  linkedTaskId?: string;
  linkedBudgetId?: string;
  createdAt: string;
  extractedViaOcr: boolean;
  syncedToLedger: boolean;
  synced: boolean;
  localChanges: boolean;
}

export interface OfflineBudgetCategory {
  id: string;
  name: string;
  allocatedCents: number;
  icon: string;
  color: string;
  spendingLimitCents?: number;
  synced: boolean;
  localChanges: boolean;
}

export interface OfflineLedgerEntry {
  id: string;
  title: string;
  type: 'expense' | 'income' | 'transfer';
  amountCents: number;
  date: string;
  categoryId: string;
  toCategoryId?: string;
  slipId?: string;
  source: string;
  notes?: string;
  createdByUserId: string;
  approvedByProxyId?: string;
  createdAt: string;
  synced: boolean;
  localChanges: boolean;
}

export interface OfflineProxyDelegation {
  id: string;
  grantorId: string;
  granteeId: string;
  granteeName: string;
  granteeEmail: string;
  status: 'active' | 'pending' | 'revoked' | 'expired';
  permissions: string[];
  approvalCeilingCents: number;
  startDate: string;
  expirationDate: string;
  createdAt: string;
  synced: boolean;
  localChanges: boolean;
}

export interface OfflineConsensusProposal {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  ownerName: string;
  deadline: string;
  decisionRule: 'unanimous' | 'consent' | 'supermajority' | 'majority';
  minQuorumCount: number;
  eligibleVoterIds: string[];
  votes: Record<string, any>;
  comments: any[];
  status: 'open' | 'finalized_approved' | 'finalized_rejected';
  resolvedObjections: string[];
  resultingActionItemIds?: string[];
  createdAt: string;
  finalizedAt?: string;
  synced: boolean;
  localChanges: boolean;
}

export interface OfflineFlowWorkflow {
  id: string;
  name: string;
  description: string;
  blocks: any[];
  isActive: boolean;
  createdAt: string;
  lastRunAt?: string;
  synced: boolean;
  localChanges: boolean;
}

export interface OfflineFlowExecutionLog {
  id: string;
  flowId: string;
  flowName: string;
  status: 'success' | 'failed' | 'running';
  idempotencyKey: string;
  startedAt: string;
  completedAt?: string;
  stepResults: any[];
  synced: boolean;
  localChanges: boolean;
}

export interface OfflineAppDatabase {
  tasks: OfflineTaskItem[];
  slips: OfflineSlipReceipt[];
  budgetCategories: OfflineBudgetCategory[];
  ledger: OfflineLedgerEntry[];
  recurringBills: any[];
  savingsGoals: any[];
  proxies: OfflineProxyDelegation[];
  proxyAuditLogs: any[];
  proposals: OfflineConsensusProposal[];
  flows: OfflineFlowWorkflow[];
  flowExecutionLogs: OfflineFlowExecutionLog[];
  currentCurrency: string;
  adminConfig?: any;
  version: number;
}

class BridgeDatabase extends Dexie {
  tasks!: Table<OfflineTaskItem, string>;
  slips!: Table<OfflineSlipReceipt, string>;
  budgetCategories!: Table<OfflineBudgetCategory, string>;
  ledger!: Table<OfflineLedgerEntry, string>;
  proxies!: Table<OfflineProxyDelegation, string>;
  proposals!: Table<OfflineConsensusProposal, string>;
  flows!: Table<OfflineFlowWorkflow, string>;
  flowExecutionLogs!: Table<OfflineFlowExecutionLog, string>;

  constructor() {
    super('BridgeDB');
    this.version(1).stores({
      tasks: 'id, completed, category, priority, createdAt, synced, localChanges',
      slips: 'id, merchant, date, category, fileHash, syncedToLedger, synced, localChanges',
      budgetCategories: 'id, name, synced, localChanges',
      ledger: 'id, type, date, categoryId, amountCents, synced, localChanges',
      proxies: 'id, grantorId, granteeId, status, synced, localChanges',
      proposals: 'id, ownerId, status, deadline, synced, localChanges',
      flows: 'id, name, isActive, synced, localChanges',
      flowExecutionLogs: 'id, flowId, idempotencyKey, status, synced, localChanges',
    });
  }
}

export const db = new BridgeDatabase();

export async function initializeDatabase(): Promise<void> {
  await db.open();
  const count = await db.tasks.count();
  if (count === 0) {
    await seedInitialData();
  }
}

async function seedInitialData(): Promise<void> {
  const categories: OfflineBudgetCategory[] = [
    { id: 'cat-1', name: 'Housing', allocatedCents: 1500000, icon: '🏠', color: '#ef4444', synced: true, localChanges: false },
    { id: 'cat-2', name: 'Food', allocatedCents: 800000, icon: '🍔', color: '#f97316', synced: true, localChanges: false },
    { id: 'cat-3', name: 'Transport', allocatedCents: 500000, icon: '🚌', color: '#eab308', synced: true, localChanges: false },
    { id: 'cat-4', name: 'Utilities', allocatedCents: 400000, icon: '⚡', color: '#22c55e', synced: true, localChanges: false },
    { id: 'cat-5', name: 'Entertainment', allocatedCents: 300000, icon: '🎮', color: '#8b5cf6', synced: true, localChanges: false },
  ];
  await db.budgetCategories.bulkPut(categories);
}

export async function getAllData(): Promise<OfflineAppDatabase> {
  return {
    tasks: await db.tasks.toArray(),
    slips: await db.slips.toArray(),
    budgetCategories: await db.budgetCategories.toArray(),
    ledger: await db.ledger.toArray(),
    recurringBills: [],
    savingsGoals: [],
    proxies: await db.proxies.toArray(),
    proxyAuditLogs: [],
    proposals: await db.proposals.toArray(),
    flows: await db.flows.toArray(),
    flowExecutionLogs: await db.flowExecutionLogs.toArray(),
    currentCurrency: 'ZAR',
    version: 1,
  };
}

export async function saveAllData(data: OfflineAppDatabase): Promise<void> {
  await db.transaction('rw', db.tasks, db.slips, db.budgetCategories, db.ledger, db.proxies, db.proposals, db.flows, db.flowExecutionLogs, async () => {
    if (data.tasks.length) await db.tasks.bulkPut(data.tasks);
    if (data.slips.length) await db.slips.bulkPut(data.slips);
    if (data.budgetCategories.length) await db.budgetCategories.bulkPut(data.budgetCategories);
    if (data.ledger.length) await db.ledger.bulkPut(data.ledger);
    if (data.proxies.length) await db.proxies.bulkPut(data.proxies);
    if (data.proposals.length) await db.proposals.bulkPut(data.proposals);
    if (data.flows.length) await db.flows.bulkPut(data.flows);
    if (data.flowExecutionLogs.length) await db.flowExecutionLogs.bulkPut(data.flowExecutionLogs);
  });
}

export async function clearDatabase(): Promise<void> {
  await db.delete();
  await db.open();
  await seedInitialData();
}

export { BridgeDatabase };
export default db;