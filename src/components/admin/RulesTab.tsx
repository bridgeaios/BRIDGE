import React from 'react';
import {
  X, Shield, KeyRound, CheckCircle, Calendar, FileSpreadsheet, HardDrive, Mail, MessageCircle,
  Lock, Unlock, AlertTriangle, RefreshCw, Download, Settings, Sparkles, Bot, ExternalLink, ArrowRight,
} from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '../../utils/money';


export const RulesTab: React.FC<{ ctx: any }> = ({ ctx }) => {
  const {
    isGoogleConnected, googleUser, connectGoogle, disconnectGoogle, adminConfig, updateAdminConfig,
    currency, setCurrency, db, resetDemoData, toggleAutoSync, isGoogleSyncing, syncGoogleNow,
    lastGoogleSyncResult, setIsAdminOpen, setIsSyncModalOpen, statusMsg, setStatusMsg,
    isTestingService, setIsTestingService, showStatus, handleTestCalendar, handleTestSheet,
    handleTestDrive, handleTestGmail, handleTestWhatsApp, handleDownloadBackup, SUPPORTED_CURRENCIES,
  } = ctx;
  return (
                <div className="space-y-4">
                  {/* Currency selector */}
                  <div className="p-4 rounded-2xl border-3 border-slate-900 bg-yellow-50 shadow-[3px_3px_0px_#000]">
                    <h5 className="font-black text-slate-900 mb-2">DEFAULT HUB CURRENCY</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SUPPORTED_CURRENCIES.map((cur: any) => (
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
  );
};
