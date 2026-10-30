import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  RefreshCw,
  FileSpreadsheet,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Layers,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Database,
  CheckSquare,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

export const GoogleSyncModal: React.FC = () => {
  const {
    isSyncModalOpen,
    setIsSyncModalOpen,
    isGoogleConnected,
    connectGoogle,
    googleUser,
    adminConfig,
    toggleAutoSync,
    isGoogleSyncing,
    syncGoogleNow,
    lastGoogleSyncResult,
    db,
    currency,
  } = useApp();

  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isSyncModalOpen) return null;

  const handleManualSync = async (forceNew = false) => {
    setLocalError(null);
    try {
      if (!isGoogleConnected) {
        await connectGoogle();
      }
      await syncGoogleNow({ forceNew });
      setConfirmOverwrite(false);
    } catch (err: any) {
      setLocalError(err?.message || 'Sync failed. Please check Google permissions.');
    }
  };

  const isAutoSyncOn = Boolean(adminConfig.enableAutoSheetSync);
  const sheetUrl = lastGoogleSyncResult?.spreadsheetUrl || adminConfig.lastSyncedSpreadsheetUrl;
  const driveUrl = lastGoogleSyncResult?.driveFileUrl || adminConfig.lastSyncedDriveUrl;
  const lastSyncTime = lastGoogleSyncResult?.timestamp || adminConfig.lastSyncedAt;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white border-4 border-slate-900 rounded-3xl shadow-[8px_8px_0px_#000000] max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-400 text-slate-950 px-5 py-4 flex items-center justify-between border-b-4 border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white text-slate-950 border-3 border-slate-900 flex items-center justify-center font-black shadow-[2px_2px_0px_#000]">
              <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-none">
                GOOGLE SYNC CENTER
              </h2>
              <p className="text-xs font-black text-emerald-950 mt-1">
                TASKS • BUDGET LEDGERS • CONSENSUS • DRIVE BACKUP
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic.pop();
              setIsSyncModalOpen(false);
            }}
            className="chunky-btn p-2 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_#000] active:translate-y-1 transition-transform"
            aria-label="Close Google Sync Modal"
          >
            <X className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Status / Error Toast */}
          {localError && (
            <div className="p-3 bg-rose-100 border-3 border-rose-900 rounded-2xl text-rose-950 text-xs font-black flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />
              <span>{localError}</span>
            </div>
          )}

          {/* Google Auth Status Banner */}
          <div className="p-4 rounded-2xl border-3 border-slate-900 bg-amber-50 shadow-[4px_4px_0px_#000] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_#000] shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-base">Google Account</h3>
                  {isGoogleConnected ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-300 text-slate-900 border border-slate-900">
                      CONNECTED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-200 text-rose-900 border border-slate-900">
                      SIGN-IN NEEDED
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-600 truncate max-w-[260px] sm:max-w-none">
                  {isGoogleConnected ? googleUser?.email : 'Connect to sync directly to your personal Sheets & Drive.'}
                </p>
              </div>
            </div>

            {!isGoogleConnected && (
              <button
                onClick={async () => {
                  triggerHaptic.heavy();
                  await connectGoogle();
                }}
                className="chunky-btn w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-900 font-black text-xs shadow-[3px_3px_0px_#000] active:translate-y-0.5"
              >
                Sign in with Google
              </button>
            )}
          </div>

          {/* MAIN FEATURE: AUTO-SYNC TOGGLE CARD */}
          <div className="p-5 rounded-3xl border-3 border-slate-900 bg-linear-to-br from-yellow-100 via-amber-50 to-emerald-50 shadow-[5px_5px_0px_#000]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <RefreshCw className={`w-5 h-5 ${isGoogleSyncing ? 'animate-spin text-emerald-700' : 'text-slate-900'}`} />
                  <h3 className="font-black text-slate-950 text-lg tracking-tight">
                    CONTINUOUS AUTO-SYNC
                  </h3>
                </div>
                <p className="text-xs font-bold text-slate-700 max-w-md">
                  Automatically keeps your personal multi-tab Google Sheet and Drive JSON backup updated in real-time whenever tasks, budget expenses, or consensus votes are created or modified.
                </p>
              </div>

              {/* Big Chunky Toggle Button */}
              <button
                onClick={async () => {
                  triggerHaptic.medium();
                  await toggleAutoSync();
                }}
                className={`chunky-btn shrink-0 w-full sm:w-auto px-5 py-3 rounded-2xl border-3 border-slate-900 font-black text-sm flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000] active:translate-y-1 active:shadow-none transition-colors ${
                  isAutoSyncOn
                    ? 'bg-emerald-400 hover:bg-emerald-500 text-slate-950'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                <span className="text-lg">{isAutoSyncOn ? '🟢' : '⚪'}</span>
                <span>{isAutoSyncOn ? 'AUTO-SYNC: ON' : 'AUTO-SYNC: OFF'}</span>
              </button>
            </div>

            {/* Auto-Sync Live State Bar */}
            <div className="mt-4 pt-3 border-t-2 border-slate-900/20 flex flex-wrap items-center justify-between gap-2 text-xs font-black text-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-slate-900" />
                <span>
                  {isGoogleSyncing
                    ? 'Syncing changes to Google Sheets & Drive right now...'
                    : isAutoSyncOn
                    ? 'Auto-sync active: Listening for data updates'
                    : 'Auto-sync disabled (manual trigger available below)'}
                </span>
              </div>
              {lastSyncTime && (
                <span className="text-slate-600 font-bold">
                  Last synced: {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>
          </div>

          {/* MANUAL SYNC ACTION BAR */}
          <div className="p-4 rounded-2xl border-3 border-slate-900 bg-white shadow-[4px_4px_0px_#000] space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h4 className="font-black text-slate-900 text-base">One-Tap Manual Synchronization</h4>
                <p className="text-xs font-bold text-slate-600">
                  Force an immediate push of all tasks, budget entries, categories, and consensus proposals.
                </p>
              </div>

              <button
                onClick={() => handleManualSync(false)}
                disabled={isGoogleSyncing}
                className="chunky-btn w-full sm:w-auto px-6 py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 border-3 border-slate-900 font-black text-sm shadow-[3px_3px_0px_#000] flex items-center justify-center gap-2 active:translate-y-1 active:shadow-none disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isGoogleSyncing ? 'animate-spin' : ''}`} />
                <span>{isGoogleSyncing ? 'SYNCING TO GOOGLE...' : '⚡ SYNC TO GOOGLE NOW'}</span>
              </button>
            </div>

            {/* Confirmation details for safety */}
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
              <span>Writes to: "Big Button Life Hub - Master Sync"</span>
              <button
                onClick={() => {
                  if (confirm('Create a brand new Master Google Sheet instead of updating the existing one?')) {
                    handleManualSync(true);
                  }
                }}
                className="text-amber-800 underline font-black hover:text-amber-950"
              >
                Create Fresh Spreadsheet
              </button>
            </div>
          </div>

          {/* SYNCHRONIZED SECTIONS BREAKDOWN */}
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2.5">
              DATA CHANNELS INCLUDED IN SYNC
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tasks Tab */}
              <div className="p-3.5 rounded-2xl border-2 border-slate-900 bg-sky-50 shadow-[2px_2px_0px_#000] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-400 text-slate-900 border-2 border-slate-900 flex items-center justify-center font-black">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-black text-slate-900 text-sm">Tasks Sheet</h5>
                    <p className="text-xs font-bold text-slate-600">
                      {db.tasks.length} total tasks ({db.tasks.filter((t) => t.completed).length} completed)
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-sky-200 border border-slate-900">
                  Tab 2
                </span>
              </div>

              {/* Budget Ledger Tab */}
              <div className="p-3.5 rounded-2xl border-2 border-slate-900 bg-emerald-50 shadow-[2px_2px_0px_#000] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-400 text-slate-900 border-2 border-slate-900 flex items-center justify-center font-black">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-black text-slate-900 text-sm">Budget & Ledger</h5>
                    <p className="text-xs font-bold text-slate-600">
                      {db.ledger.length} entries • {db.budgetCategories.length} categories
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-200 border border-slate-900">
                  Tabs 3 & 4
                </span>
              </div>

              {/* Consensus Board Tab */}
              <div className="p-3.5 rounded-2xl border-2 border-slate-900 bg-pink-50 shadow-[2px_2px_0px_#000] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-pink-400 text-slate-900 border-2 border-slate-900 flex items-center justify-center font-black">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-black text-slate-900 text-sm">Consensus Board</h5>
                    <p className="text-xs font-bold text-slate-600">
                      {db.proposals.length} proposals • Votes & objections
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-pink-200 border border-slate-900">
                  Tab 5
                </span>
              </div>

              {/* Google Drive JSON Backup */}
              <div className="p-3.5 rounded-2xl border-2 border-slate-900 bg-amber-50 shadow-[2px_2px_0px_#000] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-900 border-2 border-slate-900 flex items-center justify-center font-black">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-black text-slate-900 text-sm">Drive Backup</h5>
                    <p className="text-xs font-bold text-slate-600">
                      LifeHub_Master_Sync_Backup.json
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-200 border border-slate-900">
                  Drive File
                </span>
              </div>
            </div>
          </div>

          {/* CLOUD DESTINATION LINKS */}
          {(sheetUrl || driveUrl) && (
            <div className="p-4 rounded-2xl border-3 border-slate-900 bg-slate-900 text-white shadow-[4px_4px_0px_#000] space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase">
                <Sparkles className="w-4 h-4" />
                <span>ACTIVE CLOUD DESTINATIONS</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sheetUrl && (
                  <a
                    href={sheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chunky-btn p-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs flex items-center justify-between border-2 border-white shadow-[2px_2px_0px_#fff] active:translate-y-0.5"
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5" />
                      <span>OPEN GOOGLE SHEET</span>
                    </div>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                {driveUrl && (
                  <a
                    href={driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chunky-btn p-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-between border-2 border-white shadow-[2px_2px_0px_#fff] active:translate-y-0.5"
                  >
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-5 h-5" />
                      <span>OPEN DRIVE BACKUP</span>
                    </div>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
