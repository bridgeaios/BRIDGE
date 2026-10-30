import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Mail, Send, Copy, Check, ExternalLink, Sparkles, UserCheck } from 'lucide-react';
import { buildTasksAndConsensusSummary, openPreFilledMailto, openGmailWebComposer } from '../../utils/emailSummary';
import { triggerHaptic } from '../../utils/haptics';
import { playSound } from '../../utils/sound';

interface GmailSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipient?: string;
}

export const GmailSummaryModal: React.FC<GmailSummaryModalProps> = ({
  isOpen,
  onClose,
  defaultRecipient = '',
}) => {
  const { db, activePersona } = useApp();
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const summary = buildTasksAndConsensusSummary({
    to: recipient,
    tasks: db.tasks,
    proposals: db.proposals,
    categories: db.budgetCategories,
    ledger: db.ledger,
    currency: db.currentCurrency,
    senderName: activePersona.name,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(`${summary.subject}\n\n${summary.body}`);
    setCopied(true);
    playSound.complete();
    triggerHaptic.light();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenMailto = () => {
    playSound.pop();
    triggerHaptic.heavy();
    openPreFilledMailto({
      to: recipient,
      tasks: db.tasks,
      proposals: db.proposals,
      categories: db.budgetCategories,
      ledger: db.ledger,
      currency: db.currentCurrency,
      senderName: activePersona.name,
    });
  };

  const handleOpenGmailWeb = () => {
    playSound.pop();
    triggerHaptic.medium();
    openGmailWebComposer({
      to: recipient,
      tasks: db.tasks,
      proposals: db.proposals,
      categories: db.budgetCategories,
      ledger: db.ledger,
      currency: db.currentCurrency,
      senderName: activePersona.name,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white border-4 border-slate-900 rounded-3xl shadow-[8px_8px_0px_#000000] max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-rose-500 text-white px-5 py-4 flex items-center justify-between border-b-4 border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-rose-600 border-2 border-slate-900 flex items-center justify-center font-black shadow-[2px_2px_0px_#000]">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-none">
                SEND VIA GMAIL
              </h3>
              <p className="text-xs font-black text-rose-100 mt-1">
                PRE-FILLED TASKS & CONSENSUS SUMMARY
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic.pop();
              onClose();
            }}
            className="chunky-btn p-2 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_#000] active:translate-y-1 transition-transform"
            aria-label="Close"
          >
            <X className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Recipient Input */}
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase mb-1">
              Recipient Email (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="colleague@example.com or leave blank"
                className="flex-1 px-3.5 py-2.5 rounded-xl border-3 border-slate-900 font-mono text-sm font-bold bg-white text-slate-900"
              />
              {/* Quick Fill active proxy */}
              {db.proxies.length > 0 && (
                <button
                  type="button"
                  onClick={() => setRecipient(db.proxies[0].granteeEmail)}
                  className="chunky-btn px-3 py-2 rounded-xl bg-amber-200 hover:bg-amber-300 text-slate-900 border-2 border-slate-900 text-xs font-black shrink-0 flex items-center gap-1"
                  title={`Fill ${db.proxies[0].granteeName}`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Fill Proxy</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleOpenMailto}
              className="chunky-btn py-3.5 px-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white border-3 border-slate-900 font-black text-sm shadow-[3px_3px_0px_#000] flex items-center justify-center gap-2 active:translate-y-1"
            >
              <Send className="w-5 h-5" />
              <span>SEND VIA MAIL APP (MAILTO)</span>
            </button>

            <button
              onClick={handleOpenGmailWeb}
              className="chunky-btn py-3.5 px-4 rounded-2xl bg-amber-300 hover:bg-amber-400 text-slate-950 border-3 border-slate-900 font-black text-sm shadow-[3px_3px_0px_#000] flex items-center justify-center gap-2 active:translate-y-1"
            >
              <ExternalLink className="w-5 h-5" />
              <span>OPEN GMAIL WEB COMPOSE</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-black text-slate-700">PREVIEW PRE-FILLED EMAIL BODY:</span>
            <button
              onClick={handleCopy}
              className="chunky-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-100 text-slate-900 font-black text-xs shadow-[2px_2px_0px_#000] active:translate-y-0.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>
          </div>

          {/* Subject Preview */}
          <div className="p-2.5 rounded-xl border-2 border-slate-900 bg-slate-100 font-mono text-xs font-bold text-slate-800 truncate">
            <span className="text-slate-500 font-semibold mr-1">Subject:</span>
            {summary.subject}
          </div>

          {/* Body Preview */}
          <pre className="p-3.5 rounded-2xl border-3 border-slate-900 bg-slate-950 text-emerald-400 font-mono text-xs font-bold whitespace-pre-wrap max-h-56 overflow-y-auto selection:bg-emerald-700 selection:text-white">
            {summary.body}
          </pre>
        </div>
      </div>
    </div>
  );
};
