/**
 * Big Button Life Hub - Core Domain Types
 * Decimal-safe money (cents/minor units), tasks, slips, proxies, consensus, flows.
 */

export type ModuleType = 'home' | 'todo' | 'slips' | 'budget' | 'proxy' | 'consensus' | 'flows' | 'admin' | 'arcade';

export interface UserPersona {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'proxy' | 'member' | 'guest';
  avatar: string;
  color: string;
}

// ----------------- TO-DO TYPES -----------------
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string; // YYYY-MM-DD
  priority: Priority;
  category: string;
  subtasks: Subtask[];
  recurring: RecurrenceType;
  assignedProxyId?: string;
  linkedBudgetId?: string;
  linkedSlipId?: string;
  linkedProposalId?: string;
  createdAt: string;
  completedAt?: string;
}

// ----------------- SLIP CAPTURE TYPES -----------------
export interface SlipReceipt {
  id: string;
  merchant: string;
  date: string; // YYYY-MM-DD
  amountCents: number; // in cents (e.g. R 149.50 = 14950)
  currency: string; // e.g. ZAR
  taxCents?: number;
  category: string;
  description?: string;
  documentDataUrl?: string; // image or PDF data uri
  documentType: 'image' | 'pdf';
  fileHash: string; // SHA-256 or pseudo-hash for duplicate detection
  isDuplicate?: boolean;
  linkedTaskId?: string;
  linkedBudgetId?: string;
  createdAt: string;
  extractedViaOcr: boolean;
  syncedToLedger: boolean;
}

// ----------------- BUDGET TYPES -----------------
export interface BudgetCategory {
  id: string;
  name: string;
  allocatedCents: number;
  icon: string;
  color: string;
  spendingLimitCents?: number;
}

export type TransactionType = 'expense' | 'income' | 'transfer';

export interface LedgerEntry {
  id: string;
  title: string;
  type: TransactionType;
  amountCents: number;
  date: string; // YYYY-MM-DD
  categoryId: string;
  toCategoryId?: string; // for transfers
  slipId?: string;
  source: string; // e.g., 'manual', 'slip_ocr', 'flow_automation', 'recurring'
  notes?: string;
  createdByUserId: string;
  approvedByProxyId?: string;
  createdAt: string;
}

export interface RecurringBill {
  id: string;
  name: string;
  amountCents: number;
  frequency: 'monthly' | 'weekly';
  dueDay: number; // 1-31
  categoryId: string;
  isAutoPaid: boolean;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetCents: number;
  currentCents: number;
  targetDate: string;
  icon: string;
}

// ----------------- PROXY & DELEGATION TYPES -----------------
export type ProxyPermission =
  | 'view_tasks'
  | 'edit_tasks'
  | 'submit_expenses'
  | 'review_budgets'
  | 'approve_expenses'
  | 'submit_consensus'
  | 'cast_vote';

export interface ProxyDelegation {
  id: string;
  grantorId: string; // who granted
  granteeId: string; // the proxy
  granteeName: string;
  granteeEmail: string;
  status: 'active' | 'pending' | 'revoked' | 'expired';
  permissions: ProxyPermission[];
  approvalCeilingCents: number; // max financial approval limit in cents
  startDate: string;
  expirationDate: string;
  createdAt: string;
}

export interface ProxyAuditRecord {
  id: string;
  proxyId: string;
  action: string;
  details: string;
  timestamp: string;
  authorized: boolean;
  reason?: string;
}

// ----------------- CONSENSUS BOARD TYPES -----------------
export type VoteType = 'agree' | 'discuss' | 'object' | 'abstain';

export type DecisionRule =
  | 'unanimous' // 100% agree, 0 object
  | 'consent' // No unresolved blocks/objections
  | 'supermajority' // >= 75%
  | 'majority'; // > 50%

export interface VoteRecord {
  userId: string;
  userName: string;
  vote: VoteType;
  objectionReason?: string;
  isDelegatedVote?: boolean;
  delegatedFromUserId?: string;
  votedAt: string;
}

export interface ProposalComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
  isAmendmentProposal?: boolean;
}

export interface ConsensusProposal {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  ownerName: string;
  deadline: string;
  decisionRule: DecisionRule;
  minQuorumCount: number;
  eligibleVoterIds: string[];
  votes: Record<string, VoteRecord>; // keyed by userId
  comments: ProposalComment[];
  status: 'open' | 'finalized_approved' | 'finalized_rejected';
  resolvedObjections: string[];
  resultingActionItemIds?: string[];
  createdAt: string;
  finalizedAt?: string;
}

// ----------------- TINKER FLOW BUILDER TYPES -----------------
export type FlowBlockType =
  | 'start'
  | 'add_task'
  | 'capture_slip'
  | 'update_budget'
  | 'request_approval'
  | 'start_consensus'
  | 'notify'
  | 'if_else'
  | 'complete';

export interface FlowBlock {
  id: string;
  type: FlowBlockType;
  label: string;
  description: string;
  config: Record<string, any>;
  color: string;
}

export interface FlowWorkflow {
  id: string;
  name: string;
  description: string;
  blocks: FlowBlock[];
  isActive: boolean;
  createdAt: string;
  lastRunAt?: string;
}

export interface FlowExecutionLog {
  id: string;
  flowId: string;
  flowName: string;
  status: 'success' | 'failed' | 'running';
  idempotencyKey: string;
  startedAt: string;
  completedAt?: string;
  stepResults: Array<{
    blockId: string;
    blockType: FlowBlockType;
    label: string;
    output: string;
    status: 'ok' | 'skipped' | 'error';
  }>;
}

export interface AdminConfig {
  adminPin: string;
  defaultCurrency: string;
  defaultWhatsAppPhone: string;
  enableAutoCalendarSync: boolean;
  enableAutoSheetSync: boolean;
  autoSyncIntervalMinutes?: number;
  lastSyncedAt?: string;
  lastSyncedSpreadsheetUrl?: string;
  lastSyncedDriveUrl?: string;
  aiPersonality: 'buddy' | 'coach' | 'mediator';
  isEmergencyFrozen: boolean;
}

// ----------------- APP STATE / BACKUP -----------------
export interface AppDatabase {
  tasks: TaskItem[];
  slips: SlipReceipt[];
  budgetCategories: BudgetCategory[];
  ledger: LedgerEntry[];
  recurringBills: RecurringBill[];
  savingsGoals: SavingsGoal[];
  proxies: ProxyDelegation[];
  proxyAuditLogs: ProxyAuditRecord[];
  proposals: ConsensusProposal[];
  flows: FlowWorkflow[];
  flowExecutionLogs: FlowExecutionLog[];
  currentCurrency: string;
  adminConfig?: AdminConfig;
  version: number;
}
