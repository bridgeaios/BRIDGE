import React, { useState } from 'react';
import {
  Play,
  Plus,
  Trash2,
  ArrowDown,
  Sparkles,
  ArrowUp,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { FlowBlock, FlowBlockType } from '../../types';
import { playSound } from '../../utils/sound';
import { triggerHaptic } from '../../utils/haptics';
import { useHaptics } from '../../hooks';

const TOY_BLOCKS: Array<{ type: FlowBlockType; emoji: string; title: string; desc: string; color: string }> = [
  { type: 'start', emoji: '🟢', title: 'START', desc: 'Go!', color: 'bg-emerald-300' },
  { type: 'capture_slip', emoji: '📸', title: 'SNAP SLIP', desc: 'Scan bill', color: 'bg-amber-300' },
  { type: 'if_else', emoji: '🔀', title: 'IF BIG SPEND', desc: 'Check limit', color: 'bg-cyan-300' },
  { type: 'request_approval', emoji: '🤝', title: 'ASK HELPER', desc: 'Check permission', color: 'bg-purple-300' },
  { type: 'update_budget', emoji: '💰', title: 'PIGGY BANK', desc: 'Save to ledger', color: 'bg-emerald-300' },
  { type: 'add_task', emoji: '📝', title: 'ADD TASK', desc: 'Make to-do', color: 'bg-sky-300' },
  { type: 'notify', emoji: '🔔', title: 'RING BELL', desc: 'Alert team', color: 'bg-yellow-300' },
  { type: 'complete', emoji: '✅', title: 'FINISH', desc: 'All done!', color: 'bg-teal-300' },
];

export const FlowBuilderHub: React.FC = () => {
  const { db, runFlow, createFlow } = useApp();
  const { actionSuccess, celebrate, heavy } = useHaptics();

  const [selectedFlowId, setSelectedFlowId] = useState<string>(db.flows[0]?.id || '');
  const [isRunning, setIsRunning] = useState(false);
  const [activeLog, setActiveLog] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newFlowName, setNewFlowName] = useState('');
  const [draftBlocks, setDraftBlocks] = useState<FlowBlock[]>([
    { id: 'b-1', type: 'start', label: '🟢 START', description: 'Go!', config: {}, color: 'bg-emerald-300' },
    { id: 'b-2', type: 'capture_slip', label: '📸 SNAP SLIP', description: 'Scan paper', config: {}, color: 'bg-amber-300' },
    { id: 'b-3', type: 'update_budget', label: '💰 PIGGY BANK', description: 'Save money', config: {}, color: 'bg-emerald-300' },
    { id: 'b-4', type: 'complete', label: '✅ ALL DONE', description: 'Finish!', config: {}, color: 'bg-teal-300' },
  ]);

  const activeFlow = db.flows.find((f) => f.id === selectedFlowId) || db.flows[0];

  const handleRun = async () => {
    if (!activeFlow) return;
    setIsRunning(true);
    playSound.pop();
    heavy();
    setActiveLog(null);
    try {
      const log = await runFlow(activeFlow.id, { amountCents: 45000, title: 'Check solar battery rig' });
      setActiveLog(log);
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      celebrate();
    } finally {
      setIsRunning(false);
    }
  };

  const addBlock = (blockType: FlowBlockType) => {
    playSound.pop();
    triggerHaptic.pop();
    const meta = TOY_BLOCKS.find((b) => b.type === blockType)!;
    const newB: FlowBlock = {
      id: `b-${Date.now()}`,
      type: blockType,
      label: `${meta.emoji} ${meta.title}`,
      description: meta.desc,
      config: {},
      color: meta.color,
    };
    setDraftBlocks([...draftBlocks, newB]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlowName.trim() || draftBlocks.length === 0) return;

    createFlow({
      name: newFlowName.trim(),
      description: 'Toy track automation',
      blocks: draftBlocks,
      isActive: true,
    });

    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    actionSuccess();
    setNewFlowName('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-5 pb-28">
      {/* Header Banner */}
      <div className="bg-teal-300 rounded-[32px] p-5 chunky-card flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🧩</span>
          <div>
            <h2 className="text-2xl font-black text-slate-950 uppercase leading-none">TOY TRACKS</h2>
            <p className="text-xs font-black text-slate-900 mt-1">Connect colorful blocks like LEGO!</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-3 bg-yellow-300 hover:bg-yellow-400 text-slate-950 font-black text-sm rounded-2xl chunky-btn flex items-center gap-1.5"
        >
          <Plus className="w-5 h-5 stroke-[3.5]" />
          <span>NEW TRACK</span>
        </button>
      </div>

      {/* Track Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {db.flows.map((flow) => {
          const isSelected = activeFlow && flow.id === activeFlow.id;
          return (
            <button
              key={flow.id}
              onClick={() => {
                setSelectedFlowId(flow.id);
                setActiveLog(null);
                playSound.tap();
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black shrink-0 border-3 border-slate-900 flex items-center gap-2 transition ${
                isSelected
                  ? 'bg-teal-400 text-slate-950 shadow-[3px_3px_0px_#0f172a] -translate-y-0.5'
                  : 'bg-white hover:bg-teal-50 text-slate-800'
              }`}
            >
              <span>🚂</span>
              <span className="max-w-[160px] truncate">{flow.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active Track Canvas */}
      {activeFlow && (
        <div className="bg-white rounded-[32px] p-5 sm:p-6 border-3.5 border-slate-900 shadow-[5px_5px_0px_#0f172a] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-3 border-slate-900 pb-3">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950">{activeFlow.name}</h3>
              <p className="text-xs font-bold text-slate-600">{activeFlow.description}</p>
            </div>

            {/* Giant Play Button */}
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="w-full sm:w-auto px-6 py-4 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-lg rounded-2xl chunky-btn flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Play className="w-6 h-6 fill-slate-950" />
              <span>{isRunning ? 'TRAIN RUNNING...' : '▶️ PLAY THIS TRACK!'}</span>
            </button>
          </div>

          {/* Sequential Colorful Snap Blocks */}
          <div className="space-y-3 py-2">
            {activeFlow.blocks.map((block, idx) => (
              <React.Fragment key={block.id}>
                <div
                  className={`
                    p-4 rounded-3xl border-3.5 border-slate-900 shadow-[3px_3px_0px_#0f172a] flex items-center justify-between gap-3
                    ${block.color || 'bg-amber-200'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-white border-2 border-slate-900 flex items-center justify-center font-black text-base shadow-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-lg font-black text-slate-950 leading-tight">{block.label}</h4>
                      <p className="text-xs font-bold text-slate-800">{block.description}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 bg-white text-slate-950 text-[10px] font-black rounded-xl border border-slate-900 uppercase">
                    STEP {idx + 1}
                  </span>
                </div>

                {/* Arrow connector */}
                {idx < activeFlow.blocks.length - 1 && (
                  <div className="flex justify-center my-0.5">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs">
                      <ArrowDown className="w-5 h-5 stroke-[3.5]" />
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Live Run Animation Result */}
          {activeLog && (
            <div className="p-4 rounded-3xl bg-amber-100 border-3 border-slate-900 space-y-2.5 animate-in fade-in">
              <div className="flex items-center gap-2 text-sm font-black text-slate-950">
                <span className="text-2xl">🎉</span>
                <span>TRACK FINISHED SUCCESSFULLY!</span>
              </div>
              <div className="space-y-1.5">
                {activeLog.stepResults.map((s: any, i: number) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-2xl bg-white border-2 border-slate-900 text-xs font-bold flex items-center gap-2"
                  >
                    <span className="text-emerald-600 font-black">✓</span>
                    <span>{s.label}: {s.output}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assemble Track Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[32px] bg-amber-50 p-6 chunky-card max-h-[90vh] overflow-y-auto space-y-3.5">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
              <h3 className="text-lg font-black uppercase text-slate-950">🚂 Build a New Track</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full border-2 border-slate-900 bg-white font-black text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black uppercase text-slate-800 mb-1">
                  Track Name
                </label>
                <input
                  type="text"
                  required
                  value={newFlowName}
                  onChange={(e) => setNewFlowName(e.target.value)}
                  placeholder="e.g. Scan Receipt then Put in Piggy Bank"
                  className="w-full p-3 rounded-2xl border-3 border-slate-900 text-sm font-bold bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-800 mb-1">
                  Tap Blocks to Add to Track:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TOY_BLOCKS.map((b) => (
                    <button
                      key={b.type}
                      type="button"
                      onClick={() => addBlock(b.type)}
                      className={`p-2.5 rounded-2xl border-2 border-slate-900 font-black text-xs text-left ${b.color} active:scale-95 transition`}
                    >
                      <div>{b.emoji} {b.title}</div>
                      <div className="text-[10px] font-bold text-slate-700">{b.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Current track blocks */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-800 mb-1">
                  Your Track ({draftBlocks.length} blocks):
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 bg-white rounded-2xl border-2 border-slate-900">
                  {draftBlocks.map((b, i) => (
                    <div key={b.id} className="p-2 rounded-xl bg-amber-50 border border-slate-900 text-xs font-black flex items-center justify-between">
                      <span>{i + 1}. {b.label}</span>
                      <button
                        type="button"
                        onClick={() => setDraftBlocks(draftBlocks.filter((_, idx) => idx !== i))}
                        className="text-rose-600 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-teal-400 hover:bg-teal-500 text-slate-950 font-black text-base rounded-2xl chunky-btn"
              >
                💾 SAVE MY TOY TRACK!
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
