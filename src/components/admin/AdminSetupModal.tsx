import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Shield,
  KeyRound,
  CheckCircle,
  Calendar,
  FileSpreadsheet,
  HardDrive,
  Mail,
  MessageCircle,
  Lock,
  Unlock,
  AlertTriangle,
  RefreshCw,
  Download,
  Settings,
  Sparkles,
  Bot,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import {
  createCalendarEvent,
  exportReportToGoogleSheet,
  uploadFileToGoogleDrive,
  sendEmailWithGmail,
} from '../../utils/googleWorkspace';
import { openWhatsApp, buildWhatsAppUrl } from '../../utils/whatsapp';
import { SUPPORTED_CURRENCIES } from '../../utils/money';

export const AdminSetupModal: React.FC = () => {
  const {
    isAdminOpen,
    setIsAdminOpen,
    adminConfig,
    updateAdminConfig,
    googleUser,
    isGoogleConnected,
    connectGoogle,
    disconnectGoogle,
    currency,
    setCurrency,
    db,
    resetDemoData,
    toggleAutoSync,
    isGoogleSyncing,
    syncGoogleNow,
    lastGoogleSyncResult,
    setIsSyncModalOpen,
  } = useApp();

  const [enteredPin, setEnteredPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [activeTab, setActiveTab] = useState<'workspace' | 'whatsapp' | 'rules' | 'ai' | 'backup'>('workspace');
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isTestingService, setIsTestingService] = useState<string | null>(null);

  if (!isAdminOpen) return null;

  const handleKeypadPress = (val: string) => {
    if (enteredPin.length < 4) {
      const next = enteredPin + val;
      setEnteredPin(next);
      setPinError(false);
      if (next.length === 4) {
        if (next === (adminConfig.adminPin || '1234')) {
          setIsAuthenticated(true);
        } else {
          setPinError(true);
          setTimeout(() => setEnteredPin(''), 600);
        }
      }
    }
  };

  const handleClearPin = () => {
    setEnteredPin('');
    setPinError(false);
  };

  const showStatus = (text: string, isError = false) => {
    setStatusMsg({ text, isError });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  // Google Workspace Test Actions
  const handleTestCalendar = async () => {
    setIsTestingService('calendar');
    try {
      const today = new Date().toISOString().split('T')[0];
      await createCalendarEvent({
        summary: 'Big Button Hub Test Task',
        description: 'Test event generated from Big Button Life Hub Admin Panel',
        startDate: today,
      });
      showStatus('✅ Test event successfully added to Google Calendar!');
    } catch (err: any) {
      showStatus(err?.message || 'Calendar test failed. Check Google Sign-in.', true);
    } finally {
      setIsTestingService(null);
    }
  };

  const handleTestSheet = async () => {
    setIsTestingService('sheets');
    try {
      const res = await exportReportToGoogleSheet({
        title: 'Admin Verification Report',
        headers: ['Timestamp', 'Hub Currency', 'Total Tasks', 'Active Proxies', 'Ledger Items'],
        rows: [
          [
            new Date().toISOString(),
            currency.code,
            db.tasks.length,
            db.proxies.filter((p) => p.status === 'active').length,
            db.ledger.length,
          ],
        ],
      });
      showStatus(`✅ Google Sheet exported! ${res.spreadsheetUrl}`);
    } catch (err: any) {
      showStatus(err?.message || 'Sheet export failed. Check Google Sign-in.', true);
    } finally {
      setIsTestingService(null);
    }
  };

  const handleTestDrive = async () => {
    setIsTestingService('drive');
    try {
      // Small 1x1 test image in base64
      const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      const res = await uploadFileToGoogleDrive({
        name: `verification_slip_${Date.now()}.png`,
        mimeType: 'image/png',
        base64Data: sampleBase64,
      });
      showStatus(`✅ Test receipt uploaded to Google Drive! File ID: ${res.fileId}`);
    } catch (err: any) {
      showStatus(err?.message || 'Drive upload failed. Check Google Sign-in.', true);
    } finally {
      setIsTestingService(null);
    }
  };

  const handleTestGmail = async () => {
    setIsTestingService('gmail');
    try {
      const targetEmail = googleUser?.email || 'ryanpcowan@gmail.com';
      await sendEmailWithGmail({
        to: targetEmail,
        subject: 'Big Button Hub Verification Email',
        bodyText: `Hello from Big Button Life Hub!\n\nThis confirms that Gmail sending is connected and verified on ${new Date().toLocaleString()}.\n\nKeep tinkering!`,
      });
      showStatus(`✅ Verification email sent via Gmail to ${targetEmail}!`);
    } catch (err: any) {
      showStatus(err?.message || 'Gmail test failed. Check Google Sign-in.', true);
    } finally {
      setIsTestingService(null);
    }
  };

  const handleTestWhatsApp = () => {
    const phone = adminConfig.defaultWhatsAppPhone || '+27821234567';
    openWhatsApp('🚀 *BIG BUTTON LIFE HUB* — Test WhatsApp connection successful! All systems operational.', phone);
    showStatus('💬 Opened WhatsApp test message!');
  };

  const handleDownloadBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `life_hub_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showStatus('💾 Hub database downloaded!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-white/90 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white border-4 border-slate-900 rounded-[32px] shadow-[8px_8px_0px_rgb(163,177,198,0.6)] shadow-[-8px_-8px_0px_rgba(255,255,255,0.5)] max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b-4 border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-900 border-2 border-white flex items-center justify-center font-black">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">ADMIN SETUP HUB</h2>
              <p className="text-xs font-bold text-amber-300">SYSTEM CONTROL & INTEGRATIONS</p>
            </div>
          </div>
          <button
            onClick={() => setIsAdminOpen(false)}
            className="chunky-btn p-2 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white border-2 border-white active:translate-y-1 transition-transform"
            aria-label="Close Admin Setup"
          >
            <X className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Status Toast Banner */}
        {statusMsg && (
          <div
            className={`px-4 py-2 font-black text-sm flex items-center gap-2 border-b-2 border-slate-900 ${
              statusMsg.isError ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-900'
            }`}
          >
            {statusMsg.isError ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {!isAuthenticated ? (
            /* PIN ENTRY VIEW */
            <div className="flex flex-col items-center justify-center py-6 text-center max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-yellow-300 border-3 border-slate-900 flex items-center justify-center text-slate-900 mb-4 shadow-[4px_4px_0px_#000]">
                <KeyRound className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-1">ENTER ADMIN PIN</h3>
              <p className="text-sm font-bold text-slate-600 mb-6">Default PIN is 1234</p>

              {/* PIN Dots */}
              <div className="flex items-center justify-center gap-4 mb-6">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-6 h-6 rounded-full border-3 border-slate-900 transition-all ${
                      pinError
                        ? 'bg-rose-500 border-rose-700 animate-bounce'
                        : enteredPin.length > idx
                        ? 'bg-slate-900 scale-110'
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-3 w-full">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handleKeypadPress(digit)}
                    className="chunky-btn h-14 rounded-2xl bg-amber-100 hover:bg-amber-200 text-slate-900 border-3 border-slate-900 text-2xl font-black shadow-[3px_3px_0px_#000] active:translate-y-1 active:shadow-none"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  onClick={handleClearPin}
                  className="chunky-btn h-14 rounded-2xl bg-rose-200 hover:bg-rose-300 text-rose-900 border-3 border-slate-900 text-sm font-black shadow-[3px_3px_0px_#000] active:translate-y-1 active:shadow-none flex items-center justify-center"
                >
                  CLEAR
                </button>
                <button
                  onClick={() => handleKeypadPress('0')}
                  className="chunky-btn h-14 rounded-2xl bg-amber-100 hover:bg-amber-200 text-slate-900 border-3 border-slate-900 text-2xl font-black shadow-[3px_3px_0px_#000] active:translate-y-1 active:shadow-none"
                >
                  0
                </button>
                <button
                  onClick={() => setIsAuthenticated(true)}
                  className="chunky-btn h-14 rounded-2xl bg-emerald-300 hover:bg-emerald-400 text-slate-900 border-3 border-slate-900 text-xs font-black shadow-[3px_3px_0px_#000] active:translate-y-1 active:shadow-none flex items-center justify-center"
                >
                  BYPASS (DEV)
                </button>
              </div>
            </div>
          ) : (
            /* AUTHENTICATED ADMIN DASHBOARD */
            <div className="space-y-6">
              {/* Navigation Tabs */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 border-b-3 border-slate-900 pb-3">
                {[
                  { id: 'workspace', label: 'Google Workspace', icon: '🌐' },
                  { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
                  { id: 'rules', label: 'Hub Rules', icon: '⚖️' },
                  { id: 'ai', label: 'Casual AI', icon: '🤖' },
                  { id: 'backup', label: 'Backup', icon: '💾' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`chunky-btn py-2 px-1 text-xs font-black rounded-xl border-2 border-slate-900 transition-all ${
                      activeTab === tab.id
                        ? 'bg-yellow-400 text-slate-900 shadow-[3px_3px_0px_#000] -translate-y-0.5'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span className="block text-base">{tab.icon}</span>
                    <span className="truncate">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* TAB 1: GOOGLE WORKSPACE */}
              {activeTab === 'workspace' && (
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
              )}

              {/* TAB 2: WHATSAPP DISPATCH */}
              {activeTab === 'whatsapp' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border-3 border-slate-900 bg-emerald-50 shadow-[4px_4px_0px_#000]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center border-2 border-slate-900">
                        <MessageCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-lg">WhatsApp Dispatch Center</h4>
                        <p className="text-xs font-bold text-slate-600">
                          1-tap sharing of tasks, receipts, consensus votes, and budget alerts
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-black text-slate-800 mb-1">
                          DEFAULT WHATSAPP PHONE NUMBER (WITH COUNTRY CODE)
                        </label>
                        <input
                          type="tel"
                          value={adminConfig.defaultWhatsAppPhone || ''}
                          onChange={(e) => updateAdminConfig({ defaultWhatsAppPhone: e.target.value })}
                          placeholder="+27821234567"
                          className="w-full px-4 py-2.5 rounded-xl border-3 border-slate-900 font-mono font-black text-slate-900 bg-white"
                        />
                      </div>

                      <button
                        onClick={handleTestWhatsApp}
                        className="chunky-btn w-full py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-500 text-slate-900 border-3 border-slate-900 font-black text-sm shadow-[3px_3px_0px_#000] active:translate-y-1"
                      >
                        TEST WHATSAPP MESSAGE DISPATCH
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: HUB RULES & FINANCIALS */}
              {activeTab === 'rules' && (
                <div className="space-y-4">
                  {/* Currency selector */}
                  <div className="p-4 rounded-2xl border-3 border-slate-900 bg-yellow-50 shadow-[3px_3px_0px_#000]">
                    <h5 className="font-black text-slate-900 mb-2">DEFAULT HUB CURRENCY</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SUPPORTED_CURRENCIES.map((cur) => (
                        <button
                          key={cur.code}
                          onClick={() => setCurrency(cur.code)}
                          className={`chunky-btn py-2.5 px-2 rounded-xl border-2 border-slate-900 font-black text-xs ${
                            currency.code === cur.code
                              ? 'bg-yellow-400 text-slate-900 shadow-[2px_2px_0px_#000]'
                              : 'bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="text-sm block">{cur.symbol}</span>
                          <span>{cur.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Emergency Freeze */}
                  <div className="p-4 rounded-2xl border-3 border-slate-900 bg-rose-50 shadow-[3px_3px_0px_#000]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-black text-slate-900 text-base">EMERGENCY PROXY FREEZE</h5>
                        <p className="text-xs font-bold text-slate-600">
                          Instantly halt all delegated proxy approvals and transactions.
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updateAdminConfig({ isEmergencyFrozen: !adminConfig.isEmergencyFrozen })
                        }
                        className={`chunky-btn px-4 py-2 rounded-xl border-3 border-slate-900 font-black text-xs ${
                          adminConfig.isEmergencyFrozen
                            ? 'bg-rose-500 text-white shadow-[2px_2px_0px_#000]'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {adminConfig.isEmergencyFrozen ? 'FROZEN (ACTIVE)' : 'OFF (NORMAL)'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CASUAL AI SETTINGS */}
              {activeTab === 'ai' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border-3 border-slate-900 bg-purple-50 shadow-[4px_4px_0px_#000]">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-400 text-slate-900 flex items-center justify-center border-2 border-slate-900 font-black">
                        <Bot className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-lg">Hub Buddy AI Setup</h4>
                        <p className="text-xs font-bold text-slate-600">
                          Grounding, voice transcription & personality controls
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-black text-slate-800 mb-1">
                          AI BUDDY PERSONALITY
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'buddy', label: 'Playful Buddy', icon: '🌟' },
                            { id: 'coach', label: 'Financial Coach', icon: '📈' },
                            { id: 'mediator', label: 'Consensus Guide', icon: '🤝' },
                          ].map((p) => (
                            <button
                              key={p.id}
                              onClick={() => updateAdminConfig({ aiPersonality: p.id as any })}
                              className={`chunky-btn py-2 px-1 rounded-xl border-2 border-slate-900 font-black text-xs ${
                                (adminConfig.aiPersonality || 'buddy') === p.id
                                  ? 'bg-purple-300 text-slate-900 shadow-[2px_2px_0px_#000]'
                                  : 'bg-white text-slate-700'
                              }`}
                            >
                              <span className="block text-base">{p.icon}</span>
                              <span>{p.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border-2 border-slate-900 text-xs font-bold text-slate-700 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Google Search Grounding:</span>
                          <span className="text-emerald-700 font-black">ENABLED (gemini-3.8-flash)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Google Maps Grounding:</span>
                          <span className="text-emerald-700 font-black">ENABLED (gemini-3.8-flash)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Audio Speech Transcription:</span>
                          <span className="text-emerald-700 font-black">ENABLED (gemini-3.5-transcribe)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: BACKUP & MAINTENANCE */}
              {activeTab === 'backup' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border-3 border-slate-900 bg-amber-50 shadow-[3px_3px_0px_#000] space-y-3">
                    <h5 className="font-black text-slate-900">DATABASE BACKUP & EXPORT</h5>
                    <button
                      onClick={handleDownloadBackup}
                      className="chunky-btn w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-900 border-3 border-slate-900 font-black text-sm shadow-[3px_3px_0px_#000] flex items-center justify-center gap-2 active:translate-y-1"
                    >
                      <Download className="w-5 h-5" />
                      DOWNLOAD COMPLETE JSON DATABASE
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl border-3 border-slate-900 bg-rose-50 shadow-[3px_3px_0px_#000] space-y-3">
                    <h5 className="font-black text-rose-900">DANGER ZONE</h5>
                    <button
                      onClick={() => {
                        if (window.confirm('Reset all hub data to original demo state?')) {
                          resetDemoData();
                          showStatus('Demo data reset successfully.');
                        }
                      }}
                      className="chunky-btn w-full py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white border-3 border-slate-900 font-black text-sm shadow-[3px_3px_0px_#000] flex items-center justify-center gap-2 active:translate-y-1"
                    >
                      <RefreshCw className="w-5 h-5" />
                      RESET TO FRESH DEMO STATE
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
