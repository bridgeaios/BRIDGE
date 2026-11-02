import React from 'react';
import {
  X, Shield, KeyRound, CheckCircle, Calendar, FileSpreadsheet, HardDrive, Mail, MessageCircle,
  Lock, Unlock, AlertTriangle, RefreshCw, Download, Settings, Sparkles, Bot, ExternalLink, ArrowRight,
} from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '../../utils/money';


export const AiTab: React.FC<{ ctx: any }> = ({ ctx }) => {
  const {
    isGoogleConnected, googleUser, connectGoogle, disconnectGoogle, adminConfig, updateAdminConfig,
    currency, setCurrency, db, resetDemoData, toggleAutoSync, isGoogleSyncing, syncGoogleNow,
    lastGoogleSyncResult, setIsAdminOpen, setIsSyncModalOpen, statusMsg, setStatusMsg,
    isTestingService, setIsTestingService, showStatus, handleTestCalendar, handleTestSheet,
    handleTestDrive, handleTestGmail, handleTestWhatsApp, handleDownloadBackup, SUPPORTED_CURRENCIES,
  } = ctx;
  return (
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
  );
};
