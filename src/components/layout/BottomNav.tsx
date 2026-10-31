import React from 'react';
import { Home, CheckSquare, Camera, Wallet, Users, Vote, GitBranch, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ModuleType } from '../../types';
import { playSound } from '../../utils/sound';
import { triggerHaptic } from '../../utils/haptics';

interface NavItem {
  id: ModuleType;
  label: string;
  emoji: string;
  badge?: number;
  color: string;
}

export const BottomNav: React.FC = () => {
  const { activeModule, setActiveModule, setQuickAddOpen, db } = useApp();

  const openTasksCount = db.tasks.filter((t) => !t.completed).length;
  const openProposalsCount = db.proposals.filter((p) => p.status === 'open').length;

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', emoji: '🏠', color: 'bg-yellow-300' },
    { id: 'todo', label: 'Tasks', emoji: '📝', badge: openTasksCount, color: 'bg-sky-400' },
    { id: 'slips', label: 'Slips', emoji: '📸', color: 'bg-amber-400' },
    { id: 'budget', label: 'Piggy', emoji: '🐷', color: 'bg-emerald-400' },
    { id: 'proxy', label: 'Helpers', emoji: '🤝', color: 'bg-purple-300' },
    { id: 'consensus', label: 'Vote', emoji: '🗳️', badge: openProposalsCount, color: 'bg-pink-300' },
    { id: 'arcade', label: 'Arcade', emoji: '🎮', color: 'bg-indigo-300' },
    { id: 'flows', label: 'Blocks', emoji: '🧩', color: 'bg-teal-300' },
  ];

  const handleNavClick = (id: ModuleType) => {
    playSound.tap();
    triggerHaptic.light();
    setActiveModule(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickAdd = () => {
    playSound.pop();
    triggerHaptic.heavy();
    setQuickAddOpen(true);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-yellow-100/98 backdrop-blur-md border-t-4 border-slate-900 safe-pb shadow-[0_-4px_0_rgba(15,23,42,0.1)]">
      <div className="max-w-4xl mx-auto px-2 py-1.5 flex items-center justify-between">
        <nav className="flex-1 flex items-center justify-around gap-1 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  relative flex flex-col items-center justify-center
                  min-w-[44px] py-1 px-1 rounded-2xl transition select-none
                  ${isActive
                    ? `${item.color} border-3 border-slate-900 shadow-[3px_3px_0px_#0f172a] -translate-y-1 scale-105`
                    : 'text-slate-800 hover:text-slate-950 hover:bg-yellow-200/50'
                  }
                `}
              >
                <span className="text-xl leading-none">{item.emoji}</span>
                <span className={`text-[10px] tracking-tight mt-0.5 leading-none ${isActive ? 'font-black text-slate-950' : 'font-extrabold text-slate-700'}`}>
                  {item.label}
                </span>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-rose-500 text-white text-[9px] font-black rounded-full border-2 border-slate-900 shadow-xs animate-bounce">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* The prominent glowing ➕ BIG ADD BUTTON */}
        <div className="pl-1.5 shrink-0">
          <button
            onClick={handleQuickAdd}
            className="w-14 h-14 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 border-3.5 border-slate-900 shadow-[3px_3px_0px_#0f172a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#0f172a] flex items-center justify-center transition active:scale-95"
            title="➕ Big Add Button: Add Task, Slip, Money, Helper, Vote, or Block"
          >
            <Plus className="w-9 h-9 stroke-[4]" />
          </button>
        </div>
      </div>
    </div>
  );
};
