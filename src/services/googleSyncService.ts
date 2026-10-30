/**
 * Google Sync Service Layer
 * Synchronizes User Tasks, Budget Ledgers, Categories, and Consensus Proposals
 * with personal Google Sheets and Google Drive files.
 */

import { AppDatabase, ConsensusProposal, LedgerEntry, TaskItem, BudgetCategory } from '../types';
import { getAccessToken } from '../utils/googleWorkspace';

export interface SyncOptions {
  forceNewSpreadsheet?: boolean;
  spreadsheetId?: string;
  userPersonaName?: string;
  skipDriveBackup?: boolean;
}

export interface SyncResult {
  success: boolean;
  timestamp: string;
  spreadsheetId: string;
  spreadsheetUrl: string;
  driveFileId?: string;
  driveFileUrl?: string;
  tasksCount: number;
  ledgerCount: number;
  categoriesCount: number;
  proposalsCount: number;
  message: string;
  error?: string;
}

const MASTER_SHEET_TITLE = 'Big Button Life Hub - Master Sync';
const DRIVE_BACKUP_FILENAME = 'LifeHub_Master_Sync_Backup.json';
const LOCAL_STORAGE_SHEET_KEY = 'bb_synced_spreadsheet_id';
const LOCAL_STORAGE_LAST_SYNC_KEY = 'bb_last_sync_result';

// Helper: Format minor currency units (cents)
function formatMoney(cents: number, currency: string = 'ZAR'): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents) / 100;
  return `${sign}${currency} ${abs.toFixed(2)}`;
}

// ----------------- SHEET DATA MAPPERS -----------------

export function mapTasksToSheetRows(tasks: TaskItem[]): (string | number)[][] {
  const headers = [
    'Task ID',
    'Title',
    'Priority',
    'Category',
    'Due Date',
    'Status',
    'Subtasks Done',
    'Total Subtasks',
    'Recurring',
    'Assigned Proxy ID',
    'Linked Slip ID',
    'Created Date',
    'Completed Date',
  ];

  const rows = tasks.map((t) => {
    const doneSubtasks = (t.subtasks || []).filter((s) => s.completed).length;
    const totalSubtasks = (t.subtasks || []).length;
    return [
      t.id,
      t.title,
      t.priority.toUpperCase(),
      t.category || 'General',
      t.dueDate || 'No Due Date',
      t.completed ? 'COMPLETED' : 'PENDING',
      doneSubtasks,
      totalSubtasks,
      t.recurring || 'none',
      t.assignedProxyId || 'Self',
      t.linkedSlipId || '',
      t.createdAt.split('T')[0],
      t.completedAt ? t.completedAt.split('T')[0] : '',
    ];
  });

  return [headers, ...rows];
}

export function mapLedgerToSheetRows(ledger: LedgerEntry[], currency: string = 'ZAR'): (string | number)[][] {
  const headers = [
    'Transaction ID',
    'Date',
    'Title',
    'Type',
    'Formatted Amount',
    'Amount in Cents',
    'Category ID',
    'Source',
    'Created By User',
    'Approved By Proxy',
    'Slip ID',
    'Notes',
    'Logged Timestamp',
  ];

  const rows = ledger.map((item) => [
    item.id,
    item.date,
    item.title,
    item.type.toUpperCase(),
    formatMoney(item.amountCents, currency),
    item.amountCents,
    item.categoryId,
    item.source || 'manual',
    item.createdByUserId || 'owner',
    item.approvedByProxyId || 'N/A',
    item.slipId || '',
    item.notes || '',
    item.createdAt || '',
  ]);

  return [headers, ...rows];
}

export function mapCategoriesToSheetRows(
  categories: BudgetCategory[],
  ledger: LedgerEntry[],
  currency: string = 'ZAR'
): (string | number)[][] {
  const headers = [
    'Category ID',
    'Category Name',
    'Allocated Budget',
    'Spending Limit',
    'Actual Spent',
    'Remaining Balance',
    'Utilization %',
    'Health Status',
  ];

  const rows = categories.map((cat) => {
    const spentCents = ledger
      .filter((l) => l.type === 'expense' && l.categoryId === cat.id)
      .reduce((sum, l) => sum + l.amountCents, 0);

    const remainingCents = cat.allocatedCents - spentCents;
    const ratio = cat.allocatedCents > 0 ? (spentCents / cat.allocatedCents) * 100 : 0;
    const status = ratio >= 100 ? 'OVER_BUDGET' : ratio >= 80 ? 'WARNING_HIGH' : 'HEALTHY';

    return [
      cat.id,
      cat.name,
      formatMoney(cat.allocatedCents, currency),
      cat.spendingLimitCents ? formatMoney(cat.spendingLimitCents, currency) : 'No Limit',
      formatMoney(spentCents, currency),
      formatMoney(remainingCents, currency),
      `${ratio.toFixed(1)}%`,
      status,
    ];
  });

  return [headers, ...rows];
}

export function mapConsensusToSheetRows(proposals: ConsensusProposal[]): (string | number)[][] {
  const headers = [
    'Proposal ID',
    'Title',
    'Status',
    'Decision Rule',
    'Owner',
    'Deadline',
    'Min Quorum',
    'Agree Votes',
    'Object Votes',
    'Discuss Votes',
    'Abstain Votes',
    'Total Cast',
    'Comments Count',
    'Unresolved Blocks',
    'Created At',
    'Finalized At',
  ];

  const rows = proposals.map((p) => {
    const votes = Object.values(p.votes || {});
    const agree = votes.filter((v) => v.vote === 'agree').length;
    const obj = votes.filter((v) => v.vote === 'object').length;
    const discuss = votes.filter((v) => v.vote === 'discuss').length;
    const abstain = votes.filter((v) => v.vote === 'abstain').length;

    return [
      p.id,
      p.title,
      p.status.toUpperCase(),
      p.decisionRule.toUpperCase(),
      p.ownerName,
      p.deadline || 'No Deadline',
      p.minQuorumCount,
      agree,
      obj,
      discuss,
      abstain,
      votes.length,
      (p.comments || []).length,
      p.resolvedObjections ? (p.resolvedObjections.length < obj ? obj - p.resolvedObjections.length : 0) : obj,
      p.createdAt.split('T')[0],
      p.finalizedAt ? p.finalizedAt.split('T')[0] : 'Open',
    ];
  });

  return [headers, ...rows];
}

export function sanitizeSheetRows(rows: (string | number)[][]): (string | number)[][] {
  return rows.map((row) =>
    row.map((cell) => {
      if (typeof cell === 'string') {
        // Prevent Google Sheets formula injection and syntax errors like #ERROR!
        if (cell.startsWith('=') || cell.startsWith('@') || cell.startsWith('+')) {
          return `'${cell}`;
        }
      }
      return cell;
    })
  );
}

export function mapOverviewToSheetRows(
  db: AppDatabase,
  personaName: string = 'Admin',
  driveFileUrl: string = ''
): (string | number)[][] {
  const totalTasks = db.tasks.length;
  const pendingTasks = db.tasks.filter((t) => !t.completed).length;
  const completedTasks = db.tasks.filter((t) => t.completed).length;

  const totalExpenseCents = db.ledger
    .filter((l) => l.type === 'expense')
    .reduce((sum, l) => sum + l.amountCents, 0);
  const totalIncomeCents = db.ledger
    .filter((l) => l.type === 'income')
    .reduce((sum, l) => sum + l.amountCents, 0);
  const totalAllocatedCents = db.budgetCategories.reduce((sum, c) => sum + c.allocatedCents, 0);

  const openProposals = db.proposals.filter((p) => p.status === 'open').length;
  const approvedProposals = db.proposals.filter((p) => p.status === 'finalized_approved').length;
  const resolvedDriveUrl = driveFileUrl || db.adminConfig?.lastSyncedDriveUrl || 'Uploaded in Google Drive';

  return [
    ['BIG BUTTON LIFE HUB — MASTER SYSTEM SYNC', ''],
    ['Last Synced Timestamp', new Date().toISOString()],
    ['Synced By Persona', personaName],
    ['Hub Active Currency', db.currentCurrency || 'EUR'],
    ['Drive Master Backup File', resolvedDriveUrl],
    ['', ''],
    ['MODULE SUMMARY', 'METRICS'],
    ['Total Tasks in Hub', totalTasks],
    ['Pending Action Items', pendingTasks],
    ['Completed Action Items', completedTasks],
    ['Total Financial Transactions', db.ledger.length],
    ['Total Expenses Logged', formatMoney(totalExpenseCents, db.currentCurrency || 'EUR')],
    ['Total Income Logged', formatMoney(totalIncomeCents, db.currentCurrency || 'EUR')],
    ['Total Monthly Budget Allocated', formatMoney(totalAllocatedCents, db.currentCurrency || 'EUR')],
    ['Total Slips / Receipts Captured', db.slips.length],
    ['Active Proxy Delegations', db.proxies.filter((p) => p.status === 'active').length],
    ['Consensus Decisions Open', openProposals],
    ['Consensus Decisions Finalized', approvedProposals],
    ['Automated Flows Configured', db.flows.length],
  ];
}

// ----------------- GOOGLE DRIVE FILE SYNC -----------------

/**
 * Uploads or updates the structured JSON backup in the user's personal Google Drive.
 */
export async function syncDatabaseBackupToDrive(
  token: string,
  db: AppDatabase,
  fileName: string = DRIVE_BACKUP_FILENAME
): Promise<{ fileId: string; webViewLink: string }> {
  // 1. Search for existing file in user's Drive
  const query = encodeURIComponent(`name = '${fileName}' and trashed = false`);
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  let existingFileId: string | null = null;
  let existingWebLink: string | null = null;

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      existingFileId = searchData.files[0].id;
      existingWebLink = searchData.files[0].webViewLink;
    }
  }

  const jsonContent = JSON.stringify(db, null, 2);
  const jsonBlob = new Blob([jsonContent], { type: 'application/json' });

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: `Life Hub Master Database Backup - Synced ${new Date().toISOString()}`,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', jsonBlob);

  let uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink';
  let method = 'POST';

  if (existingFileId) {
    uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart&fields=id,webViewLink`;
    method = 'PATCH';
  }

  const uploadRes = await fetch(uploadUrl, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to upload database backup to Google Drive');
  }

  const result = await uploadRes.json();
  return {
    fileId: result.id,
    webViewLink: result.webViewLink || existingWebLink || `https://drive.google.com/file/d/${result.id}/view`,
  };
}

// ----------------- GOOGLE SHEETS MASTER SYNC -----------------

const REQUIRED_SHEET_TABS = ['Overview', 'Tasks', 'Budget Ledger', 'Budget Categories', 'Consensus Board'];

/**
 * Searches for or creates the Master Multi-Tab Google Spreadsheet in user's Drive.
 */
export async function getOrCreateMasterSpreadsheet(
  token: string,
  forceNew = false
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // If not forcing new, check localStorage cached id first
  const cachedId = localStorage.getItem(LOCAL_STORAGE_SHEET_KEY);
  if (cachedId && !forceNew) {
    // Verify spreadsheet exists and is accessible
    const checkRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cachedId}?fields=spreadsheetId,spreadsheetUrl,sheets.properties`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (checkRes.ok) {
      const data = await checkRes.json();
      await ensureSheetTabsExist(token, data.spreadsheetId, data.sheets || []);
      return {
        spreadsheetId: data.spreadsheetId,
        spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`,
      };
    }
  }

  // Check Drive for existing spreadsheet named MASTER_SHEET_TITLE
  if (!forceNew) {
    const query = encodeURIComponent(`name = '${MASTER_SHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const foundId = searchData.files[0].id;
        localStorage.setItem(LOCAL_STORAGE_SHEET_KEY, foundId);

        // Verify and add missing tabs if needed
        const sheetRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${foundId}?fields=sheets.properties`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (sheetRes.ok) {
          const sheetData = await sheetRes.json();
          await ensureSheetTabsExist(token, foundId, sheetData.sheets || []);
        }

        return {
          spreadsheetId: foundId,
          spreadsheetUrl: searchData.files[0].webViewLink || `https://docs.google.com/spreadsheets/d/${foundId}`,
        };
      }
    }
  }

  // Create new Master Spreadsheet with all 5 required tabs
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: MASTER_SHEET_TITLE,
      },
      sheets: REQUIRED_SHEET_TABS.map((title, idx) => ({
        properties: {
          sheetId: idx,
          title,
          gridProperties: { rowCount: 150, columnCount: 20 },
        },
      })),
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Master Google Sheet');
  }

  const created = await createRes.json();
  const id = created.spreadsheetId;
  const url = created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${id}`;
  localStorage.setItem(LOCAL_STORAGE_SHEET_KEY, id);

  return { spreadsheetId: id, spreadsheetUrl: url };
}

/**
 * Ensures that all required tabs exist in an existing spreadsheet.
 */
async function ensureSheetTabsExist(token: string, spreadsheetId: string, currentSheets: any[]): Promise<void> {
  const existingTitles = new Set(currentSheets.map((s) => s.properties?.title));
  const missingTabs = REQUIRED_SHEET_TABS.filter((title) => !existingTitles.has(title));

  if (missingTabs.length === 0) return;

  const requests = missingTabs.map((title) => ({
    addSheet: {
      properties: {
        title,
        gridProperties: { rowCount: 150, columnCount: 20 },
      },
    },
  }));

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  }).catch((e) => console.warn('Could not add missing tabs:', e));
}

/**
 * Clears old data and writes new structured data across all tabs in the master spreadsheet.
 */
export async function writeAllTabsToSpreadsheet(
  token: string,
  spreadsheetId: string,
  db: AppDatabase,
  options?: { personaName?: string; driveUrl?: string }
): Promise<void> {
  const currency = db.currentCurrency || 'ZAR';

  const overviewValues = mapOverviewToSheetRows(db, options?.personaName || 'Admin', options?.driveUrl || '');
  const taskValues = mapTasksToSheetRows(db.tasks);
  const ledgerValues = mapLedgerToSheetRows(db.ledger, currency);
  const categoryValues = mapCategoriesToSheetRows(db.budgetCategories, db.ledger, currency);
  const consensusValues = mapConsensusToSheetRows(db.proposals);

  // Clear existing ranges first to avoid trailing stale rows
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ranges: [
        'Overview!A1:Z100',
        'Tasks!A1:Z500',
        "'Budget Ledger'!A1:Z500",
        "'Budget Categories'!A1:Z100",
        "'Consensus Board'!A1:Z200",
      ],
    }),
  }).catch(() => {});

  // Atomic batch write
  const data = [
    { range: 'Overview!A1', values: sanitizeSheetRows(overviewValues) },
    { range: 'Tasks!A1', values: sanitizeSheetRows(taskValues) },
    { range: "'Budget Ledger'!A1", values: sanitizeSheetRows(ledgerValues) },
    { range: "'Budget Categories'!A1", values: sanitizeSheetRows(categoryValues) },
    { range: "'Consensus Board'!A1", values: sanitizeSheetRows(consensusValues) },
  ];

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data,
      }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to sync data rows into Google Sheets');
  }
}

// ----------------- MASTER SYNC ORCHESTRATOR -----------------

/**
 * Main Service method: Syncs Tasks, Budget, and Consensus to Google Sheets & Drive.
 */
export async function syncAllToGoogleWorkspace(
  db: AppDatabase,
  options?: SyncOptions
): Promise<SyncResult> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not signed into Google Workspace. Please tap "Sign in with Google" first.');
  }

  const timestamp = new Date().toISOString();

  try {
    // 1. Sync structured JSON backup to Google Drive
    let driveResult: { fileId: string; webViewLink: string } | undefined;
    if (!options?.skipDriveBackup) {
      try {
        driveResult = await syncDatabaseBackupToDrive(token, db);
      } catch (driveErr: any) {
        console.warn('Google Drive backup warning:', driveErr?.message);
      }
    }

    // 2. Get or create the Master Google Sheet
    const { spreadsheetId, spreadsheetUrl } = await getOrCreateMasterSpreadsheet(
      token,
      options?.forceNewSpreadsheet || false
    );

    // 3. Write Tasks, Budget Ledgers, Categories, and Consensus to Sheet tabs
    await writeAllTabsToSpreadsheet(token, spreadsheetId, db, {
      personaName: options?.userPersonaName || 'Admin',
      driveUrl: driveResult?.webViewLink,
    });

    const result: SyncResult = {
      success: true,
      timestamp,
      spreadsheetId,
      spreadsheetUrl,
      driveFileId: driveResult?.fileId,
      driveFileUrl: driveResult?.webViewLink,
      tasksCount: db.tasks.length,
      ledgerCount: db.ledger.length,
      categoriesCount: db.budgetCategories.length,
      proposalsCount: db.proposals.length,
      message: `Successfully synchronized ${db.tasks.length} tasks, ${db.ledger.length} ledger transactions, and ${db.proposals.length} consensus proposals to Google Sheets & Drive!`,
    };

    try {
      localStorage.setItem(LOCAL_STORAGE_LAST_SYNC_KEY, JSON.stringify(result));
    } catch {}

    return result;
  } catch (error: any) {
    console.error('Workspace Master Sync Error:', error);
    const failResult: SyncResult = {
      success: false,
      timestamp,
      spreadsheetId: '',
      spreadsheetUrl: '',
      tasksCount: db.tasks.length,
      ledgerCount: db.ledger.length,
      categoriesCount: db.budgetCategories.length,
      proposalsCount: db.proposals.length,
      message: 'Failed to synchronize with Google Workspace',
      error: error?.message || 'Unknown synchronization error',
    };
    return failResult;
  }
}

/**
 * Returns cached sync result if available.
 */
export function getLastSyncResult(): SyncResult | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LAST_SYNC_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}
