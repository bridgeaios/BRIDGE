import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Smartphone,
  CheckCircle,
  WifiOff,
  Users,
  CheckSquare,
  Sparkles,
  Bot,
  Shield,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { SUPPORTED_CURRENCIES } from '../../utils/money';
import { triggerHaptic, isVibrationSupported } from '../../utils/haptics';

export const Header: React.FC = () => {
  const {
    activePersona,
    setActivePersona,
    personas,
    soundOn,
    toggleSound,
    hapticsOn,
    toggleHaptics,
    isOnline,
    currency,
    setCurrency,
    setTestRunnerOpen,
    resetDemoData,
    setIsAdminOpen,
    setIsAiChatOpen,
    isGoogleConnected,
    setIsSyncModalOpen,
    isGoogleSyncing,
    adminConfig,
  } = useApp();

  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-amber-200/95 backdrop-blur-md border-b-4 border-slate-900 safe-pt px-3 py-2.5">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-yellow-400 border-3 border-slate-900 shadow-[2px_2px_0px_#0f172a] flex items-center justify-center text-2xl shrink-0">
            🟡
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight uppercase leading-none truncate">
              BIG <span className="text-amber-700">LIFE HUB</span>
            </h1>
            <span className="text-[11px] font-black text-slate-800 tracking-wide mt-0.5">
              🌟 TAP • PLAY • DONE!
            </span>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Persona Switcher Pill */}
          <button
            onClick={() => setShowPersonaMenu(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-xs rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px]"
            title="Switch User Persona (Admin, Proxy, Member)"
          >
            <span className="text-sm">{activePersona.avatar}</span>
            <span className="hidden sm:inline max-w-[85px] truncate">{activePersona.name.split(' ')[0]}</span>
            <span className="px-1.5 py-0.2 bg-amber-200 text-[10px] font-black rounded-md uppercase border border-slate-900">
              {activePersona.role}
            </span>
          </button>

          {/* Ask AI Buddy */}
          <button
            onClick={() => setIsAiChatOpen(true)}
            className="chunky-btn flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-400 hover:bg-purple-500 text-slate-950 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px]"
            title="Ask Hub Buddy AI"
          >
            <Bot className="w-4 h-4 text-slate-950" />
            <span className="hidden sm:inline">BUDDY</span>
          </button>

          {/* Google Sync Center */}
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="chunky-btn flex items-center gap-1 px-2 py-1.5 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px]"
            title="Google Sheets & Drive Auto-Sync Center"
          >
            <RefreshCw
              className={`w-4 h-4 text-slate-950 ${isGoogleSyncing ? 'animate-spin text-emerald-950' : ''}`}
            />
            <span className="hidden sm:inline">SYNC</span>
            {adminConfig?.enableAutoSheetSync && isGoogleConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-700 animate-pulse border border-slate-900 shrink-0" />
            )}
          </button>

          {/* Admin Setup */}
          <button
            onClick={() => setIsAdminOpen(true)}
            className="chunky-btn flex items-center gap-1 px-2 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px]"
            title="Admin Setup & Google Workspace"
          >
            <Shield className="w-4 h-4 text-slate-950" />
            <span className="hidden sm:inline">ADMIN</span>
            {isGoogleConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-600 border border-slate-900 shrink-0" />
            )}
          </button>

          {/* Verification Tests */}
          <button
            onClick={() => setTestRunnerOpen(true)}
            className="flex items-center gap-1 px-2 py-1.5 bg-emerald-300 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px]"
            title="Run Acceptance & Self-Verification Tests"
          >
            <CheckCircle className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden md:inline">Test</span>
          </button>

          {/* Quick Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] ${
              soundOn ? 'bg-yellow-300 text-slate-900' : 'bg-slate-200 text-slate-500'
            }`}
            title={soundOn ? 'Sound On' : 'Sound Muted'}
          >
            {soundOn ? <Volume2 className="w-4 h-4 stroke-[2.5]" /> : <VolumeX className="w-4 h-4 stroke-[2.5]" />}
          </button>

          {/* Install Button */}
          <PWAInstallButton />

          {/* More Settings */}
          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className="p-2 bg-white rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] font-bold text-xs"
            title="Hub Options"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Offline Alert Strip if disconnected */}
      {!isOnline && (
        <div className="max-w-4xl mx-auto mt-2 px-3 py-1.5 bg-amber-400 border-2 border-slate-900 rounded-xl text-slate-950 text-xs font-bold flex items-center justify-between shadow-[2px_2px_0px_#0f172a]">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0 text-slate-900" />
            <span>Offline Mode: Changes saved locally and will auto-sync.</span>
          </div>
        </div>
      )}

      {/* Persona Switcher Modal */}
      {showPersonaMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-amber-50 p-5 chunky-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-slate-900" />
                <h3 className="text-xl font-black text-slate-900">Act As Persona</h3>
              </div>
              <button
                onClick={() => setShowPersonaMenu(false)}
                className="w-8 h-8 rounded-full border-2 border-slate-900 bg-white font-black text-sm flex items-center justify-center shadow-[1px_1px_0px_#0f172a]"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-700 font-semibold mb-4">
              Test proxy delegation rules, financial limits, and voting authority by switching your active role:
            </p>

            <div className="space-y-2.5">
              {personas.map((p) => {
                const isSelected = p.id === activePersona.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      triggerHaptic.pop();
                      setActivePersona(p);
                      setShowPersonaMenu(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border-3 border-slate-900 text-left transition ${
                      isSelected
                        ? 'bg-amber-300 shadow-[3px_3px_0px_#0f172a] font-black'
                        : 'bg-white hover:bg-slate-50 font-bold shadow-[2px_2px_0px_#0f172a]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.avatar}</span>
                      <div>
                        <div className="text-sm text-slate-950 font-extrabold">{p.name}</div>
                        <div className="text-[11px] text-slate-600 font-medium">{p.email}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-black rounded-lg border-2 border-slate-900 bg-amber-100 uppercase">
                      {p.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Settings Dropdown / Modal */}
      {showSettingsMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-amber-50 p-5 chunky-card space-y-4">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
              <h3 className="text-lg font-black text-slate-900">⚙️ Hub Settings</h3>
              <button
                onClick={() => setShowSettingsMenu(false)}
                className="w-8 h-8 rounded-full border-2 border-slate-900 bg-white font-black text-sm flex items-center justify-center shadow-[1px_1px_0px_#0f172a]"
              >
                ✕
              </button>
            </div>

            {/* Currency selector */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-800 mb-1.5">
                Active Currency
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SUPPORTED_CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    className={`py-2 px-3 rounded-xl border-2 border-slate-900 text-xs font-black flex items-center justify-between ${
                      currency.code === c.code ? 'bg-amber-300 shadow-[2px_2px_0px_#0f172a]' : 'bg-white'
                    }`}
                  >
                    <span>{c.code} ({c.symbol})</span>
                    {currency.code === c.code && <CheckSquare className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound & Haptic Toggles */}
            <div className="space-y-2 pt-2 border-t-2 border-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900">Audio Feedback (Pops & Chimes)</span>
                <button
                  onClick={toggleSound}
                  className={`px-3 py-1 text-xs font-black rounded-lg border-2 border-slate-900 ${
                    soundOn ? 'bg-emerald-300 text-slate-950' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {soundOn ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-slate-900 block">Device Vibration (Haptics)</span>
                  <span className="text-[10px] font-bold text-slate-600">
                    {isVibrationSupported() ? '⚡ Hardware Vibrate Active' : '🎵 Acoustic Micro-Thump Mode'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      triggerHaptic.celebrate();
                    }}
                    className="px-2.5 py-1 text-xs font-black rounded-lg border-2 border-slate-900 bg-amber-300 hover:bg-amber-400 active:scale-95"
                    title="Feel a test buzz"
                  >
                    📳 BUZZ
                  </button>
                  <button
                    onClick={toggleHaptics}
                    className={`px-3 py-1 text-xs font-black rounded-lg border-2 border-slate-900 ${
                      hapticsOn ? 'bg-emerald-300 text-slate-950' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {hapticsOn ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>

            {/* Reset Demo Button */}
            <div className="pt-2 border-t-2 border-slate-900">
              <button
                onClick={async () => {
                  if (confirm('Reset all tasks, slips, budget, proxies, proposals and flows to the pristine demo dataset?')) {
                    await resetDemoData();
                    setShowSettingsMenu(false);
                  }
                }}
                className="w-full py-2.5 bg-rose-200 hover:bg-rose-300 text-rose-950 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]"
              >
                🔄 Reset Demo Data (All 6 Hubs)
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
