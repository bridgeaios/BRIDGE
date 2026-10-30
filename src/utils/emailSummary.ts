/**
 * Email Summary Generator & Dispatch Utility
 * Generates pre-filled mailto: and Gmail Web compose links containing
 * formatted summaries for User Tasks, Consensus Proposals, and Budget metrics.
 */

import { ConsensusProposal, TaskItem, BudgetCategory, LedgerEntry } from '../types';

export interface EmailSummaryOptions {
  to?: string;
  tasks: TaskItem[];
  proposals: ConsensusProposal[];
  categories?: BudgetCategory[];
  ledger?: LedgerEntry[];
  currency?: string;
  senderName?: string;
}

export interface GeneratedEmailSummary {
  subject: string;
  body: string;
  mailtoUrl: string;
  gmailWebUrl: string;
}

/**
 * Builds clean plain-text summary of tasks and consensus items
 */
export function buildTasksAndConsensusSummary(options: EmailSummaryOptions): GeneratedEmailSummary {
  const {
    to = '',
    tasks,
    proposals,
    currency = 'EUR',
    senderName = 'Life Hub Admin',
  } = options;

  const dateStr = new Date().toISOString().split('T')[0];
  const subject = `[Life Hub Update] Tasks & Consensus Summary (${dateStr})`;

  const pendingTasks = tasks.filter((t) => !t.completed);
  const urgentTasks = pendingTasks.filter((t) => t.priority === 'urgent' || t.priority === 'high');
  const openProposals = proposals.filter((p) => p.status === 'open');

  const lines: string[] = [];

  lines.push(`=========================================`);
  lines.push(`BIG BUTTON LIFE HUB — STATUS SUMMARY`);
  lines.push(`Date: ${new Date().toLocaleString()}`);
  lines.push(`Dispatched by: ${senderName}`);
  lines.push(`=========================================\n`);

  // SECTION 1: TASKS
  lines.push(`📋 TO-DO & ACTION ITEMS (${tasks.length} Total, ${pendingTasks.length} Pending)`);
  lines.push(`-----------------------------------------`);

  if (urgentTasks.length > 0) {
    lines.push(`⚡ High Priority / Urgent:`);
    urgentTasks.forEach((t) => {
      const subDone = (t.subtasks || []).filter((s) => s.completed).length;
      const subTotal = (t.subtasks || []).length;
      const subInfo = subTotal > 0 ? ` [${subDone}/${subTotal} steps]` : '';
      const dueInfo = t.dueDate ? ` (Due: ${t.dueDate})` : '';
      lines.push(`  • [${t.priority.toUpperCase()}] ${t.title}${dueInfo}${subInfo}`);
      if (t.description) lines.push(`    "${t.description}"`);
    });
    lines.push(``);
  }

  const otherPending = pendingTasks.filter((t) => t.priority !== 'urgent' && t.priority !== 'high');
  if (otherPending.length > 0) {
    lines.push(`📝 Other Pending Tasks:`);
    otherPending.forEach((t) => {
      const dueInfo = t.dueDate ? ` (Due: ${t.dueDate})` : '';
      lines.push(`  • ${t.title}${dueInfo} [${t.category}]`);
    });
    lines.push(``);
  }

  if (pendingTasks.length === 0) {
    lines.push(`  🎉 All tasks are completed!\n`);
  }

  // SECTION 2: CONSENSUS ITEMS
  lines.push(`🗳️ CONSENSUS DECISION BOARD (${proposals.length} Total, ${openProposals.length} Open)`);
  lines.push(`-----------------------------------------`);

  if (openProposals.length > 0) {
    openProposals.forEach((p) => {
      const votes = Object.values(p.votes || {});
      const agree = votes.filter((v) => v.vote === 'agree').length;
      const obj = votes.filter((v) => v.vote === 'object').length;
      const discuss = votes.filter((v) => v.vote === 'discuss').length;
      const abstain = votes.filter((v) => v.vote === 'abstain').length;

      lines.push(`  • "${p.title}"`);
      lines.push(`    Rule: ${p.decisionRule.toUpperCase()} | Quorum: ${votes.length}/${p.minQuorumCount}`);
      lines.push(`    Votes: ${agree} Agree | ${discuss} Discuss | ${obj} Object | ${abstain} Abstain`);
      if (p.deadline) lines.push(`    Voting Deadline: ${p.deadline}`);
      if (p.description) lines.push(`    Details: ${p.description.slice(0, 120)}...`);
      lines.push(``);
    });
  } else {
    lines.push(`  ✅ No open proposals pending votes.\n`);
  }

  const finalized = proposals.filter((p) => p.status !== 'open');
  if (finalized.length > 0) {
    lines.push(`🏁 Recently Finalized Decisions:`);
    finalized.slice(0, 3).forEach((p) => {
      lines.push(`  • ${p.title} -> ${p.status === 'finalized_approved' ? 'APPROVED' : 'REJECTED'}`);
    });
    lines.push(``);
  }

  // SECTION 3: FOOTER
  lines.push(`-----------------------------------------`);
  lines.push(`Dispatched automatically from Big Button Life Hub.`);
  lines.push(`Tinkering • Budgets • Consensus • Automated Flows`);

  const body = lines.join('\n');

  // Pre-filled mailto: link
  const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // Pre-filled Gmail Web Compose link
  const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return {
    subject,
    body,
    mailtoUrl,
    gmailWebUrl,
  };
}

/**
 * Triggers the pre-filled mailto: link directly
 */
export function openPreFilledMailto(options: EmailSummaryOptions): void {
  const { mailtoUrl } = buildTasksAndConsensusSummary(options);
  window.location.href = mailtoUrl;
}

/**
 * Opens Gmail Web composer in a new tab with pre-filled summary
 */
export function openGmailWebComposer(options: EmailSummaryOptions): void {
  const { gmailWebUrl } = buildTasksAndConsensusSummary(options);
  window.open(gmailWebUrl, '_blank', 'noopener,noreferrer');
}
