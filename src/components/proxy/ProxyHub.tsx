import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { formatCents, parseToCents } from '../../utils/money';
import { playSound } from '../../utils/sound';
import { triggerHaptic } from '../../utils/haptics';

export const ProxyHub: React.FC = () => {
  const { db, createProxyDelegation, revokeProxyDelegation, verifyProxyPermission, currency, activePersona } = useApp();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [helperName, setHelperName] = useState('');
  const [helperEmail, setHelperEmail] = useState('');
  const [spendingLimit, setSpendingLimit] = useState('1000');

  // Test state
  const [testProxyId, setTestProxyId] = useState(db.proxies[0]?.id || '');
  const [testAmount, setTestAmount] = useState('500');
  const [testResult, setTestResult] = useState<{ authorized: boolean; reason?: string } | null>(null);

  const handleCreateHelper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!helperName.trim()) return;

    createProxyDelegation({
      grantorId: activePersona.id,
      granteeId: `user_${helperName.toLowerCase().replace(/\s+/g, '_')}`,
      granteeName: helperName.trim(),
      granteeEmail: helperEmail.trim() || `${helperName.toLowerCase().replace(/\s+/g, '')}@lifehub.za`,
      status: 'active',
      permissions: ['view_tasks', 'edit_tasks', 'submit_expenses', 'approve_expenses'],
      approvalCeilingCents: parseToCents(spendingLimit),
      startDate: new Date().toISOString().split('T')[0],
      expirationDate: '2026-12-31',
    });

    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    triggerHaptic.success();
    setHelperName('');
    setHelperEmail('');
    setShowInviteModal(false);
  };

  const runTest = async () => {
    playSound.pop();
    triggerHaptic.medium();
    const res = await verifyProxyPermission(testProxyId, 'approve_expenses', parseToCents(testAmount));
    setTestResult(res);
    if (res.authorized) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      playSound.complete();
      triggerHaptic.celebrate();
    } else {
      playSound.alert();
      triggerHaptic.warning();
    }
  };

  return (
    <div className="space-y-5 pb-28">
      {/* Header Banner */}
      <div className="bg-purple-300 rounded-[32px] p-5 chunky-card flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🤝</span>
          <div>
            <h2 className="text-2xl font-black text-slate-950 uppercase leading-none">MY HELPERS</h2>
            <p className="text-xs font-black text-slate-900 mt-1">Friends & family who can help me buy things</p>
          </div>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-3 bg-yellow-300 hover:bg-yellow-400 text-slate-950 font-black text-sm rounded-2xl chunky-btn flex items-center gap-1.5"
        >
          <UserPlus className="w-5 h-5 stroke-[3.5]" />
          <span>ADD HELPER</span>
        </button>
      </div>

      {/* Helper Cards */}
      <div className="space-y-3.5">
        {db.proxies.map((proxy) => {
          const isActive = proxy.status === 'active';
          return (
            <div
              key={proxy.id}
              className="bg-white rounded-[28px] p-5 border-3.5 border-slate-900 shadow-[4px_4px_0px_#0f172a] space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">⚡</span>
                  <div>
                    <h4 className="text-lg font-black text-slate-950">{proxy.granteeName}</h4>
                    <p className="text-xs font-bold text-slate-600">{proxy.granteeEmail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-black border-2 border-slate-900 uppercase ${
                      isActive ? 'bg-emerald-300' : 'bg-rose-200'
                    }`}
                  >
                    {proxy.status}
                  </span>
                  {isActive && (
                    <button
                      onClick={() => {
                        playSound.pop();
                        triggerHaptic.warning();
                        revokeProxyDelegation(proxy.id);
                      }}
                      className="px-2.5 py-1 text-xs font-black bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl border border-slate-900"
                    >
                      Stop
                    </button>
                  )}
                </div>
              </div>

              {/* Allowance Badge */}
              <div className="p-3 bg-amber-50 rounded-2xl border-2 border-slate-900 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase text-slate-700 block">Allowed to spend up to:</span>
                  <span className="text-xl font-black text-slate-950">{formatCents(proxy.approvalCeilingCents)}</span>
                </div>
                <span className="text-2xl">💳</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simple Helper Tester Game */}
      <div className="bg-white rounded-[32px] p-5 sm:p-6 border-3.5 border-slate-900 shadow-[5px_5px_0px_#0f172a] space-y-3.5">
        <div className="border-b-2 border-slate-900 pb-2 flex items-center gap-2">
          <span className="text-2xl">🧪</span>
          <h3 className="text-base font-black uppercase text-slate-950">Test Helper Permission:</h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1">Pick a Helper:</label>
            <select
              value={testProxyId}
              onChange={(e) => setTestProxyId(e.target.value)}
              className="w-full p-3 rounded-2xl border-3 border-slate-900 text-sm font-black bg-amber-50"
            >
              {db.proxies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.granteeName} (Max: {formatCents(p.approvalCeilingCents)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1">
              Can they spend this amount? ({currency.symbol})
            </label>
            <input
              type="number"
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value)}
              className="w-full p-3 rounded-2xl border-3 border-slate-900 text-2xl font-black bg-amber-50 outline-none"
            />
          </div>

          <button
            onClick={runTest}
            className="w-full py-4 bg-purple-400 hover:bg-purple-500 text-slate-950 font-black text-lg rounded-2xl chunky-btn"
          >
            🧪 TEST PERMISSION!
          </button>

          {testResult && (
            <div
              className={`p-4 rounded-2xl border-3 border-slate-900 text-center space-y-1 ${
                testResult.authorized ? 'bg-emerald-200' : 'bg-rose-200'
              }`}
            >
              <span className="text-3xl">{testResult.authorized ? '🎉' : '🛑'}</span>
              <h4 className="text-base font-black text-slate-950">
                {testResult.authorized ? 'ALLOWED! YES THEY CAN!' : 'BLOCKED! TOO MUCH MONEY!'}
              </h4>
              <p className="text-xs font-bold text-slate-800">
                {testResult.authorized ? 'This fits within their helper spending limit!' : testResult.reason}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Helper Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-[32px] bg-amber-50 p-6 chunky-card space-y-3.5">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
              <h3 className="text-lg font-black uppercase text-slate-950">🤝 Add a New Helper</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-8 h-8 rounded-full border-2 border-slate-900 bg-white font-black text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHelper} className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase text-slate-800 mb-1">Helper's Name</label>
                <input
                  type="text"
                  required
                  value={helperName}
                  onChange={(e) => setHelperName(e.target.value)}
                  placeholder="e.g. Grandma, Uncle Joe, Sarah"
                  className="w-full p-3 rounded-2xl border-3 border-slate-900 text-sm font-bold bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-800 mb-1">
                  How much can they spend? ({currency.symbol})
                </label>
                <input
                  type="number"
                  value={spendingLimit}
                  onChange={(e) => setSpendingLimit(e.target.value)}
                  placeholder="1000"
                  className="w-full p-3 rounded-2xl border-3 border-slate-900 text-xl font-black bg-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-purple-400 hover:bg-purple-500 text-slate-950 font-black text-base rounded-2xl chunky-btn mt-2"
              >
                ADD MY HELPER!
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
