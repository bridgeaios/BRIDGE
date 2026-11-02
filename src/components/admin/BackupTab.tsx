import React from 'react';
import {
  X, Shield, KeyRound, CheckCircle, Calendar, FileSpreadsheet, HardDrive, Mail, MessageCircle,
  Lock, Unlock, AlertTriangle, RefreshCw, Download, Settings, Sparkles, Bot, ExternalLink, ArrowRight,
} from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '../../utils/money';


export const BackupTab: React.FC<{ ctx: any }> = ({ ctx }) => {
  const {
    isGoogleConnected, googleUser, connectGoogle, disconnectGoogle, adminConfig, updateAdminConfig,
    currency, setCurrency, db, resetDemoData, toggleAutoSync, isGoogleSyncing, syncGoogleNow,
    lastGoogleSyncResult, setIsAdminOpen, setIsSyncModalOpen, statusMsg, setStatusMsg,
    isTestingService, setIsTestingService, showStatus, handleTestCalendar, handleTestSheet,
    handleTestDrive, handleTestGmail, handleTestWhatsApp, handleDownloadBackup, SUPPORTED_CURRENCIES,
  } = ctx;
  return (
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
  );
};
