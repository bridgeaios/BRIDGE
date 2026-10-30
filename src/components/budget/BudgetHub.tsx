import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Trash2,
  Download,
  ArrowRightLeft,
  Sparkles,
  PiggyBank,
  FileSpreadsheet,
  MessageCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { formatCents, moneyMath, parseToCents } from '../../utils/money';
import { playSound } from '../../utils/sound';
import { triggerHaptic } from '../../utils/haptics';
import { useHaptics } from '../../hooks';
import { exportReportToGoogleSheet } from '../../utils/googleWorkspace';
import { formatBudgetReportForWhatsApp, openWhatsApp } from '../../utils/whatsapp';

export const BudgetHub: React.FC = () => {
  const {
    db,
    addLedgerEntry,
    deleteLedgerEntry,
    currency,
    activePersona,
    transferFunds,
  } = useApp();
  const { actionSuccess, celebrate } = useHaptics();

  const [activeTab, setActiveTab] = useState<'jars' | 'history'>('jars');
  const [showAddModal, setShowAddModal] = useState<'expense' | 'income' | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isExportingSheet, setIsExportingSheet] = useState(false);

  // Simple form
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCatId, setTxCatId] = useState(db.budgetCategories[0]?.id || 'cat-gear');

  const handleExportGoogleSheet = async () => {
    setIsExportingSheet(true);
    try {
      const headers = ['Date', 'Item Description', 'Type', 'Amount (Cents)', 'Amount', 'Currency', 'Category'];
      const rows = db.ledger.map((l) => [
        l.date,
        l.title,
        l.type,
        l.amountCents,
        (l.amountCents / 100).toFixed(2),
        currency.code,
        db.budgetCategories.find((c) => c.id === l.categoryId)?.name || 'General',
      ]);
      const res = await exportReportToGoogleSheet({
        title: 'Full Budget Ledger',
        headers,
        rows,
      });
      setToastMsg(`📊 Exported to Google Sheet! Spreadsheet ID: ${res.spreadsheetId}`);
      playSound.complete();
      celebrate();
      setTimeout(() => setToastMsg(null), 6000);
    } catch (err: any) {
      setToastMsg(err?.message || 'Google Sheet export failed. Check Google Sign-in.');
      setTimeout(() => setToastMsg(null), 5000);
    } finally {
      setIsExportingSheet(false);
    }
  };

  const handleShareBudgetWhatsApp = () => {
    const text = formatBudgetReportForWhatsApp({
      totalIncomeCents: totalAllocatedCents,
      totalSpentCents: totalExpensesCents,
      availableCents: remainingCents,
      currency: currency.code,
    });
    openWhatsApp(text);
    playSound.pop();
  };

  // Calculations
  const totalAllocatedCents = db.budgetCategories.reduce((sum, c) => sum + c.allocatedCents, 0);
  const totalExpensesCents = db.ledger
    .filter((l) => l.type === 'expense')
    .reduce((sum, l) => sum + l.amountCents, 0);
  const remainingCents = moneyMath.remaining(totalAllocatedCents, totalExpensesCents);

  // Category actual expenditures mapping
  const categorySpending: Record<string, number> = {};
  db.ledger.forEach((l) => {
    if (l.type === 'expense') {
      categorySpending[l.categoryId] = (categorySpending[l.categoryId] || 0) + l.amountCents;
    }
  });

  const handleSaveMoney = (e: React.FormEvent) => {
    e.preventDefault();
    const cents = parseToCents(txAmount);
    if (!txTitle.trim() || cents <= 0) return;

    addLedgerEntry({
      title: txTitle.trim(),
      type: showAddModal === 'income' ? 'income' : 'expense',
      amountCents: cents,
      date: new Date().toISOString().split('T')[0],
      categoryId: txCatId,
      source: 'child_simple_entry',
      createdByUserId: activePersona.id,
    });

    if (showAddModal === 'income') {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      celebrate();
    } else {
      actionSuccess();
    }

    setTxTitle('');
    setTxAmount('');
    setShowAddModal(null);
  };

  const exportCsv = () => {
    playSound.pop();
    triggerHaptic.pop();
    const headers = ['Date', 'Item', 'Type', 'Amount', 'Currency'];
    const rows = db.ledger.map((l) => [
      l.date,
      `"${l.title.replace(/"/g, '""')}"`,
      l.type,
      (l.amountCents / 100).toFixed(2),
      currency.code,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'My_Piggy_Bank.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 pb-28">
      {/* Huge Friendly Piggy Bank Header */}
      <div className="bg-emerald-400 rounded-[32px] p-5 sm:p-6 chunky-card text-center space-y-2">
        <div className="inline-block p-3 rounded-full bg-white border-3 border-slate-900 shadow-sm text-4xl mb-1">
          🐷
        </div>
        <div className="text-xs font-black uppercase tracking-wider text-slate-900">
          MY PIGGY BANK BALANCE
        </div>
        <div className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
          {formatCents(remainingCents)}
        </div>
        <div className="text-xs font-bold text-slate-800">
          {remainingCents >= 0 ? '✨ Good job! Plenty of coins left!' : '⚠️ Oops! Overspent! Ask for more coins.'}
        </div>
      </div>

      {/* 2 ENORMOUS ACTION BUTTONS FOR A CHILD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <button
          onClick={() => setShowAddModal('income')}
          className="min-h-[86px] p-4 bg-emerald-300 hover:bg-emerald-400 text-slate-950 font-black text-xl rounded-3xl chunky-btn flex items-center justify-center gap-3 text-left"
        >
          <span className="text-4xl">🟢</span>
          <div>
            <div className="leading-tight">I GOT MONEY!</div>
            <div className="text-xs font-bold text-slate-700">Add coins to my piggy bank</div>
          </div>
        </button>

        <button
          onClick={() => setShowAddModal('expense')}
          className="min-h-[86px] p-4 bg-rose-400 hover:bg-rose-500 text-slate-950 font-black text-xl rounded-3xl chunky-btn flex items-center justify-center gap-3 text-left"
        >
          <span className="text-4xl">🔴</span>
          <div>
            <div className="leading-tight">I SPENT MONEY!</div>
            <div className="text-xs font-bold text-slate-800">Bought a toy, snack, or tool</div>
          </div>
        </button>
      </div>

      {/* Tab Selector */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('jars');
              playSound.tap();
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase border-3 border-slate-900 ${
              activeTab === 'jars' ? 'bg-emerald-300 text-slate-950 shadow-[2px_2px_0px_#0f172a]' : 'bg-white'
            }`}
          >
            🍯 Money Jars
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              playSound.tap();
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase border-3 border-slate-900 ${
              activeTab === 'history' ? 'bg-emerald-300 text-slate-950 shadow-[2px_2px_0px_#0f172a]' : 'bg-white'
            }`}
          >
            📜 Coin History
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportGoogleSheet}
            disabled={isExportingSheet}
            className="chunky-btn p-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 rounded-2xl border-2 border-slate-900 font-black text-xs flex items-center gap-1 shadow-[2px_2px_0px_#000] disabled:opacity-50"
            title="Export full ledger to Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span className="hidden sm:inline">Google Sheets</span>
          </button>

          <button
            onClick={handleShareBudgetWhatsApp}
            className="chunky-btn p-2.5 bg-emerald-400 hover:bg-emerald-500 text-slate-950 rounded-2xl border-2 border-slate-900 font-black text-xs flex items-center gap-1 shadow-[2px_2px_0px_#000]"
            title="Send Budget Summary via WhatsApp"
          >
            <MessageCircle className="w-4 h-4 text-slate-950" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          <button
            onClick={exportCsv}
            className="chunky-btn p-2.5 bg-white text-slate-900 rounded-2xl border-2 border-slate-900 font-black text-xs flex items-center gap-1 shadow-[2px_2px_0px_#000]"
            title="Download simple spreadsheet"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-3 bg-emerald-200 border-3 border-slate-900 rounded-2xl font-black text-xs text-slate-900 shadow-[3px_3px_0px_#000] flex items-center justify-between">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="font-bold text-slate-700">✕</button>
        </div>
      )}

      {/* View 1: Big Friendly Category Jars */}
      {activeTab === 'jars' && (
        <div className="space-y-3.5">
          {db.budgetCategories.map((cat) => {
            const spent = categorySpending[cat.id] || 0;
            const left = moneyMath.remaining(cat.allocatedCents, spent);
            const pct = moneyMath.percentUsed(spent, cat.allocatedCents);
            const over = spent > cat.allocatedCents;

            return (
              <div
                key={cat.id}
                className="bg-white rounded-[28px] p-4 sm:p-5 border-3.5 border-slate-900 shadow-[4px_4px_0px_#0f172a] space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl sm:text-4xl">{cat.icon}</span>
                    <div>
                      <h4 className="text-lg font-black text-slate-950">{cat.name}</h4>
                      <p className="text-xs font-bold text-slate-600">
                        Allowance: {formatCents(cat.allocatedCents)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-lg font-black ${over ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {formatCents(left)}
                    </div>
                    <div className="text-[10px] font-black uppercase text-slate-500">
                      {over ? 'OVERSPENT!' : 'LEFT IN JAR'}
                    </div>
                  </div>
                </div>

                {/* Big Chunky Progress Bar */}
                <div className="w-full h-6 bg-slate-100 rounded-full border-2 border-slate-900 overflow-hidden relative">
                  <div
                    className={`h-full transition-all duration-300 ${
                      pct > 100 ? 'bg-rose-500' : pct > 80 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-900">
                    {pct}% spent
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View 2: Simple Coin History */}
      {activeTab === 'history' && (
        <div className="space-y-2.5">
          {db.ledger.map((entry) => {
            const isExp = entry.type === 'expense';
            return (
              <div
                key={entry.id}
                className="bg-white rounded-2xl p-3.5 border-3 border-slate-900 shadow-[2px_2px_0px_#0f172a] flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black text-slate-950 truncate">{entry.title}</div>
                  <div className="text-xs font-semibold text-slate-500">{entry.date}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-base font-black ${
                      isExp ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {isExp ? '-' : '+'}
                    {formatCents(entry.amountCents)}
                  </span>
                  <button
                    onClick={() => {
                      playSound.pop();
                      triggerHaptic.pop();
                      deleteLedgerEntry(entry.id);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Child Simple Add / Spend Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-[32px] bg-amber-50 p-6 chunky-card space-y-4">
            <div className="flex items-center justify-between border-b-3 border-slate-900 pb-2">
              <span className="text-lg font-black uppercase text-slate-950">
                {showAddModal === 'income' ? '🟢 Got Money!' : '🔴 Spent Money!'}
              </span>
              <button
                onClick={() => setShowAddModal(null)}
                className="w-8 h-8 rounded-full border-2 border-slate-900 bg-white font-black text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMoney} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black uppercase text-slate-800 mb-1">
                  What was it?
                </label>
                <input
                  type="text"
                  required
                  value={txTitle}
                  onChange={(e) => setTxTitle(e.target.value)}
                  placeholder={showAddModal === 'income' ? 'e.g. Birthday gift, Pocket money' : 'e.g. Lego kit, Ice cream, Battery'}
                  className="w-full p-3 rounded-2xl border-3 border-slate-900 text-sm font-bold bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-800 mb-1">
                  How many coins? ({currency.symbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-3 rounded-2xl border-3 border-slate-900 text-2xl font-black bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-800 mb-1">
                  Which Jar?
                </label>
                <select
                  value={txCatId}
                  onChange={(e) => setTxCatId(e.target.value)}
                  className="w-full p-3 rounded-2xl border-3 border-slate-900 text-sm font-black bg-white"
                >
                  {db.budgetCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className={`w-full py-4 font-black text-lg rounded-2xl chunky-btn mt-2 ${
                  showAddModal === 'income' ? 'bg-emerald-400 hover:bg-emerald-500' : 'bg-rose-400 hover:bg-rose-500'
                }`}
              >
                {showAddModal === 'income' ? '💰 PUT IN PIGGY BANK!' : '💸 LOG MY SPEND!'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
