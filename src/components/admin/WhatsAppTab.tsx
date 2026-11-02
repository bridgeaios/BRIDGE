import React from 'react';
import {
  X, Shield, KeyRound, CheckCircle, Calendar, FileSpreadsheet, HardDrive, Mail, MessageCircle,
  Lock, Unlock, AlertTriangle, RefreshCw, Download, Settings, Sparkles, Bot, ExternalLink, ArrowRight,
} from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '../../utils/money';


export const WhatsAppTab: React.FC<{ ctx: any }> = ({ ctx }) => {
  const {
    isGoogleConnected, googleUser, connectGoogle, disconnectGoogle, adminConfig, updateAdminConfig,
    currency, setCurrency, db, resetDemoData, toggleAutoSync, isGoogleSyncing, syncGoogleNow,
    lastGoogleSyncResult, setIsAdminOpen, setIsSyncModalOpen, statusMsg, setStatusMsg,
    isTestingService, setIsTestingService, showStatus, handleTestCalendar, handleTestSheet,
    handleTestDrive, handleTestGmail, handleTestWhatsApp, handleDownloadBackup, SUPPORTED_CURRENCIES,
  } = ctx;
  return (
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
  );
};
