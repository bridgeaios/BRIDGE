/**
 * WhatsApp Integration Utilities
 * Enables 1-tap dispatch of tasks, receipts, budget summaries, and consensus invitations.
 */

export interface WhatsAppShareOptions {
  phoneNumber?: string;
  text: string;
}

export function buildWhatsAppUrl(text: string, phoneNumber?: string): string {
  const cleanPhone = phoneNumber ? phoneNumber.replace(/[^0-9]/g, '') : '';
  const encodedText = encodeURIComponent(text);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}

export function openWhatsApp(text: string, phoneNumber?: string) {
  const url = buildWhatsAppUrl(text, phoneNumber);
  window.open(url, '_blank', 'noopener,noreferrer');
}

// ================= PRESET TEMPLATE BUILDERS =================

export function formatTaskForWhatsApp(task: {
  title: string;
  priority: string;
  dueDate?: string;
  category: string;
}): string {
  return [
    `📌 *BIG BUTTON LIFE HUB — TASK REMINDER*`,
    `*Task:* ${task.title}`,
    `*Priority:* ${task.priority.toUpperCase()}`,
    `*Category:* ${task.category}`,
    task.dueDate ? `*Due Date:* ${task.dueDate}` : null,
    ``,
    `👉 Tap to complete in your Life Hub.`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function formatSlipForWhatsApp(slip: {
  merchant: string;
  amountCents: number;
  date: string;
  category: string;
  currency?: string;
}): string {
  const amountStr = `${slip.currency || 'ZAR'} ${(slip.amountCents / 100).toFixed(2)}`;
  return [
    `🧾 *BIG BUTTON LIFE HUB — EXPENSE SLIP*`,
    `*Merchant:* ${slip.merchant}`,
    `*Amount:* ${amountStr}`,
    `*Category:* ${slip.category}`,
    `*Date:* ${slip.date}`,
    ``,
    `✅ Captured & synced to Life Hub ledger.`,
  ].join('\n');
}

export function formatBudgetReportForWhatsApp(budget: {
  totalIncomeCents: number;
  totalSpentCents: number;
  availableCents: number;
  currency?: string;
}): string {
  const c = budget.currency || 'ZAR';
  return [
    `📊 *BIG BUTTON LIFE HUB — BUDGET SNAPSHOT*`,
    `*Total Income:* ${c} ${(budget.totalIncomeCents / 100).toFixed(2)}`,
    `*Total Spent:* ${c} ${(budget.totalSpentCents / 100).toFixed(2)}`,
    `*Available Remaining:* ${c} ${(budget.availableCents / 100).toFixed(2)}`,
    ``,
    `💡 Keep your spending balanced & simple!`,
  ].join('\n');
}

export function formatConsensusInviteForWhatsApp(proposal: {
  title: string;
  description: string;
  decisionRule: string;
  deadline?: string;
}): string {
  return [
    `🗳️ *BIG BUTTON LIFE HUB — CONSENSUS VOTE NEEDED*`,
    `*Decision:* ${proposal.title}`,
    `*Details:* ${proposal.description}`,
    `*Rule:* ${proposal.decisionRule.toUpperCase()}`,
    proposal.deadline ? `*Voting Deadline:* ${proposal.deadline}` : null,
    ``,
    `👉 Please open your Life Hub to vote: AGREE, OBJECT, or DISCUSS!`,
  ]
    .filter(Boolean)
    .join('\n');
}
