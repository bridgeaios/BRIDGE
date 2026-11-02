import React from 'react';
import {
  X, Shield, KeyRound, CheckCircle, Calendar, FileSpreadsheet, HardDrive, Mail, MessageCircle,
  Lock, Unlock, AlertTriangle, RefreshCw, Download, Settings, Sparkles, Bot, ExternalLink, ArrowRight,
} from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '../../utils/money';


export const WorkspaceTab: React.FC<{ ctx: any }> = ({ ctx }) => {
  const {
    isGoogleConnected, googleUser, connectGoogle, disconnectGoogle, adminConfig, updateAdminConfig,
    currency, setCurrency, db, resetDemoData, toggleAutoSync, isGoogleSyncing, syncGoogleNow,
    lastGoogleSyncResult, setIsAdminOpen, setIsSyncModalOpen, statusMsg, setStatusMsg,
    isTestingService, setIsTestingService, showStatus, handleTestCalendar, handleTestSheet,
    handleTestDrive, handleTestGmail, handleTestWhatsApp, handleDownloadBackup, SUPPORTED_CURRENCIES,
  } = ctx;
  return (
                <div className="space-y-4">
                  {/* Google Connection Header Card */}
                  <div className="p-4 rounded-2xl border-3 border-slate-900 bg-amber-50 shadow-[4px_4px_0px_#000] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_#000]">
                        <svg className="w-7 h-7" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-900 text-lg">Google Workspace</h4>
                          {isGoogleConnected ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-400 text-slate-900 border border-slate-900">
                              CONNECTED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-200 text-rose-900 border border-slate-900">
                              DISCONNECTED
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-600">
                          {isGoogleConnected
                            ? `Signed in as ${googleUser?.email || 'Admin'}`
                            : 'Sign in to enable Calendar, Sheets, Drive, & Gmail sync'}
                        </p>
                      </div>
                    </div>

                    {isGoogleConnected ? (
                      <button
                        onClick={disconnectGoogle}
                        className="chunky-btn px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 border-2 border-slate-900 font-black text-xs shadow-[2px_2px_0px_#000]"
                      >
                        Disconnect
                      </button>
                    ) : (
                      /* Official Google Material Sign-In Button */
                      <button
                        onClick={connectGoogle}
                        className="chunky-btn flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-900 font-black text-sm shadow-[3px_3px_0px_#000] active:translate-y-0.5"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                        <span>Sign in with Google</span>
                      </button>
                    )}
                  </div>

                  {/* MASTER SYNC & AUTO-SYNC CONTROL CARD */}
                  <div className="p-4 rounded-2xl border-3 border-slate-900 bg-emerald-100 shadow-[4px_4px_0px_#000] space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <RefreshCw className={`w-5 h-5 ${isGoogleSyncing ? 'animate-spin text-emerald-800' : 'text-slate-900'}`} />
                          <h4 className="font-black text-slate-900 text-base">
                            MASTER SYNC: TASKS, BUDGET & CONSENSUS
                          </h4>
                        </div>
                        <p className="text-xs font-bold text-slate-700">
                          Syncs all tasks, budget ledger, category balances, and consensus votes to a multi-tab Google Sheet & Drive JSON file.
                        </p>
                      </div>

                      {/* Auto-Sync Toggle */}
                      <button
                        onClick={toggleAutoSync}
                        className={`chunky-btn px-4 py-2 rounded-xl border-2 border-slate-900 font-black text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_#000] shrink-0 ${
                          adminConfig.enableAutoSheetSync
                            ? 'bg-emerald-400 text-slate-950'
                            : 'bg-white text-slate-700'
                        }`}
                      >
                        <span>{adminConfig.enableAutoSheetSync ? '🟢' : '⚪'}</span>
                        <span>{adminConfig.enableAutoSheetSync ? 'AUTO-SYNC ON' : 'AUTO-SYNC OFF'}</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t-2 border-slate-900/20">
                      <button
                        onClick={() => syncGoogleNow()}
                        disabled={isGoogleSyncing}
                        className="chunky-btn flex-1 min-w-[140px] py-2 px-3 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 border-2 border-slate-900 font-black text-xs shadow-[2px_2px_0px_#000] flex items-center justify-center gap-1.5 active:translate-y-0.5 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isGoogleSyncing ? 'animate-spin' : ''}`} />
                        <span>{isGoogleSyncing ? 'Syncing...' : 'Sync To Google Now'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsAdminOpen(false);
                          setIsSyncModalOpen(true);
                        }}
                        className="chunky-btn py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-900 font-black text-xs shadow-[2px_2px_0px_#000] flex items-center gap-1 active:translate-y-0.5"
                      >
                        <span>Open Sync Center</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {(lastGoogleSyncResult?.spreadsheetUrl || adminConfig.lastSyncedSpreadsheetUrl) && (
                        <a
                          href={lastGoogleSyncResult?.spreadsheetUrl || adminConfig.lastSyncedSpreadsheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="chunky-btn py-2 px-3 rounded-xl bg-emerald-500 text-white border-2 border-slate-900 font-black text-xs shadow-[2px_2px_0px_#000] flex items-center gap-1 active:translate-y-0.5"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>View Sheet</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Service Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Google Calendar */}
                    <div className="p-4 rounded-2xl border-3 border-slate-900 bg-sky-50 shadow-[3px_3px_0px_#000] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-5 h-5 text-sky-600" />
                          <h5 className="font-black text-slate-900">Google Calendar</h5>
                        </div>
                        <p className="text-xs font-bold text-slate-600 mb-3">
                          Sync task deadlines & events directly to primary calendar.
                        </p>
                      </div>
                      <button
                        onClick={handleTestCalendar}
                        disabled={isTestingService === 'calendar'}
                        className="chunky-btn w-full py-2 rounded-xl bg-sky-400 hover:bg-sky-500 text-slate-900 border-2 border-slate-900 font-black text-xs shadow-[2px_2px_0px_#000] disabled:opacity-50"
                      >
                        {isTestingService === 'calendar' ? 'Adding Test Event...' : 'Test Calendar Event'}
                      </button>
                    </div>

                    {/* Google Sheets */}
                    <div className="p-4 rounded-2xl border-3 border-slate-900 bg-emerald-50 shadow-[3px_3px_0px_#000] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                          <h5 className="font-black text-slate-900">Google Sheets</h5>
                        </div>
                        <p className="text-xs font-bold text-slate-600 mb-3">
                          Export budget, ledger, and consensus reports into cloud spreadsheets.
                        </p>
                      </div>
                      <button
                        onClick={handleTestSheet}
                        disabled={isTestingService === 'sheets'}
                        className="chunky-btn w-full py-2 rounded-xl bg-emerald-400 hover:bg-emerald-500 text-slate-900 border-2 border-slate-900 font-black text-xs shadow-[2px_2px_0px_#000] disabled:opacity-50"
                      >
                        {isTestingService === 'sheets' ? 'Exporting Sheet...' : 'Export Test Sheet'}
                      </button>
                    </div>

                    {/* Google Drive */}
                    <div className="p-4 rounded-2xl border-3 border-slate-900 bg-amber-50 shadow-[3px_3px_0px_#000] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <HardDrive className="w-5 h-5 text-amber-600" />
                          <h5 className="font-black text-slate-900">Google Drive</h5>
                        </div>
                        <p className="text-xs font-bold text-slate-600 mb-3">
                          Store scanned slip receipts and financial invoices permanently.
                        </p>
                      </div>
                      <button
                        onClick={handleTestDrive}
                        disabled={isTestingService === 'drive'}
                        className="chunky-btn w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 border-2 border-slate-900 font-black text-xs shadow-[2px_2px_0px_#000] disabled:opacity-50"
                      >
                        {isTestingService === 'drive' ? 'Uploading...' : 'Upload Test Slip to Drive'}
                      </button>
                    </div>

                    {/* Gmail */}
                    <div className="p-4 rounded-2xl border-3 border-slate-900 bg-rose-50 shadow-[3px_3px_0px_#000] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="w-5 h-5 text-rose-600" />
                          <h5 className="font-black text-slate-900">Gmail</h5>
                        </div>
                        <p className="text-xs font-bold text-slate-600 mb-3">
                          Send email dispatches, consensus vote invitations, and reminders.
                        </p>
                      </div>
                      <button
                        onClick={handleTestGmail}
                        disabled={isTestingService === 'gmail'}
                        className="chunky-btn w-full py-2 rounded-xl bg-rose-400 hover:bg-rose-500 text-slate-900 border-2 border-slate-900 font-black text-xs shadow-[2px_2px_0px_#000] disabled:opacity-50"
                      >
                        {isTestingService === 'gmail' ? 'Sending Email...' : 'Send Test Email'}
                      </button>
                    </div>
                  </div>
                </div>
  );
};
