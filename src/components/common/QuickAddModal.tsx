import React from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playSound } from '../../utils/sound';
import { triggerHaptic } from '../../utils/haptics';

export const QuickAddModal: React.FC = () => {
  const { quickAddOpen, setQuickAddOpen, setActiveModule } = useApp();

  if (!quickAddOpen) return null;

  const handleAction = (module: 'todo' | 'slips' | 'budget' | 'proxy' | 'consensus' | 'flows') => {
    playSound.pop();
    triggerHaptic.heavy();
    setActiveModule(module);
    setQuickAddOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-[36px] bg-yellow-100 p-5 sm:p-6 chunky-card max-h-[92vh] overflow-y-auto space-y-3.5">
        <div className="flex items-center justify-between pb-3 border-b-3 border-slate-900">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🌟</span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-950 uppercase leading-none">
              WHAT TO MAKE?
            </h3>
          </div>
          <button
            onClick={() => setQuickAddOpen(false)}
            className="w-10 h-10 rounded-full border-3 border-slate-900 bg-white font-black text-lg flex items-center justify-center shadow-[1px_1px_0px_#0f172a] active:scale-95"
          >
            <X className="w-6 h-6 stroke-[3.5]" />
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleAction('todo')}
            className="w-full flex items-center gap-4 p-4 rounded-3xl bg-sky-400 hover:bg-sky-500 text-slate-950 font-black chunky-btn text-left active:scale-95 transition"
          >
            <span className="text-4xl">📝</span>
            <div>
              <div className="text-xl leading-tight font-black">MAKE A TASK</div>
              <div className="text-xs font-bold text-slate-800">Something to do today</div>
            </div>
          </button>

          <button
            onClick={() => handleAction('slips')}
            className="w-full flex items-center gap-4 p-4 rounded-3xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black chunky-btn text-left active:scale-95 transition"
          >
            <span className="text-4xl">📸</span>
            <div>
              <div className="text-xl leading-tight font-black">SNAP A PAPER SLIP</div>
              <div className="text-xs font-bold text-slate-800">Take a photo with camera</div>
            </div>
          </button>

          <button
            onClick={() => handleAction('budget')}
            className="w-full flex items-center gap-4 p-4 rounded-3xl bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black chunky-btn text-left active:scale-95 transition"
          >
            <span className="text-4xl">🐷</span>
            <div>
              <div className="text-xl leading-tight font-black">PUT COINS IN PIGGY</div>
              <div className="text-xs font-bold text-slate-800">Save or log spending</div>
            </div>
          </button>

          <button
            onClick={() => handleAction('proxy')}
            className="w-full flex items-center gap-4 p-4 rounded-3xl bg-purple-300 hover:bg-purple-400 text-slate-950 font-black chunky-btn text-left active:scale-95 transition"
          >
            <span className="text-4xl">🤝</span>
            <div>
              <div className="text-xl leading-tight font-black">ADD A HELPER</div>
              <div className="text-xs font-bold text-slate-800">Friend who can buy things</div>
            </div>
          </button>

          <button
            onClick={() => handleAction('consensus')}
            className="w-full flex items-center gap-4 p-4 rounded-3xl bg-pink-300 hover:bg-pink-400 text-slate-950 font-black chunky-btn text-left active:scale-95 transition"
          >
            <span className="text-4xl">🗳️</span>
            <div>
              <div className="text-xl leading-tight font-black">START A BIG VOTE</div>
              <div className="text-xs font-bold text-slate-800">Vote YES or NO on ideas</div>
            </div>
          </button>

          <button
            onClick={() => handleAction('flows')}
            className="w-full flex items-center gap-4 p-4 rounded-3xl bg-teal-300 hover:bg-teal-400 text-slate-950 font-black chunky-btn text-left active:scale-95 transition"
          >
            <span className="text-4xl">🧩</span>
            <div>
              <div className="text-xl leading-tight font-black">SNAP TOY BLOCKS</div>
              <div className="text-xs font-bold text-slate-800">Build an automation track</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
