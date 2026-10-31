import React from 'react';
import {
  CheckSquare,
  Camera,
  Wallet,
  Users,
  Vote,
  GitBranch,
  Calendar,
  Plus,
  ArrowRight,
  Sparkles,
  Smile,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { BigButton } from '../common/BigButton';
import { formatCents, moneyMath } from '../../utils/money';
import { playSound } from '../../utils/sound';
import { triggerHaptic } from '../../utils/haptics';
import { AiSuggestionBanners } from '../common/AiSuggestionBanners';

export const HomeDashboard: React.FC = () => {
  const {
    db,
    activePersona,
    setActiveModule,
    setQuickAddOpen,
    toggleTaskCompleted,
    setIsGmailSummaryOpen,
  } = useApp();

  // Metrics
  const openTasks = db.tasks.filter((t) => !t.completed);
  const urgentTasks = openTasks.filter((t) => t.priority === 'urgent' || t.priority === 'high');

  const totalAllocatedCents = db.budgetCategories.reduce((sum, c) => sum + c.allocatedCents, 0);
  const totalExpensesCents = db.ledger
    .filter((l) => l.type === 'expense')
    .reduce((sum, l) => sum + l.amountCents, 0);
  const remainingBudgetCents = moneyMath.remaining(totalAllocatedCents, totalExpensesCents);

  const pendingApprovalsCount = db.proxies.filter((p) => p.status === 'pending').length;
  const openProposals = db.proposals.filter((p) => p.status === 'open');
  const proposalsNeedingVote = openProposals.filter((p) => !p.votes[activePersona.id]);

  const handleQuickCheck = (taskId: string) => {
    toggleTaskCompleted(taskId);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    triggerHaptic.celebrate();
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Friendly Toy Welcome Card */}
      <section className="bg-yellow-300 rounded-[32px] p-5 sm:p-6 chunky-card">
        <div className="flex items-center justify-between gap-3 border-b-4 border-slate-900 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl sm:text-5xl animate-bounce">🌟</span>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-tight leading-none">
                BIG LIFE HUB!
              </h2>
              <p className="text-sm font-extrabold text-slate-800 mt-1 flex items-center gap-1.5">
                <span>Hey {activePersona.name.split(' ')[0]}!</span>
                <span className="px-2 py-0.5 bg-white text-slate-900 text-xs rounded-full border-2 border-slate-900">
                  {activePersona.avatar}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic.heavy();
              setQuickAddOpen(true);
            }}
            className="px-4 py-3 bg-white hover:bg-yellow-100 text-slate-950 font-black text-sm rounded-2xl chunky-btn flex items-center gap-2"
          >
            <Plus className="w-6 h-6 stroke-[3.5] text-amber-600" />
            <span className="hidden sm:inline">ADD THING</span>
          </button>
        </div>

        {/* 4 Child-Friendly Bubble Counters */}
        <div className="grid grid-cols-2 gap-3">
          {/* 1. To-Do */}
          <div
            onClick={() => {
              triggerHaptic.light();
              setActiveModule('todo');
            }}
            className="bg-white p-3.5 rounded-3xl border-3 border-slate-900 shadow-[3px_3px_0px_#0f172a] cursor-pointer hover:bg-sky-50 transition active:scale-95"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">📝</span>
              <span className="text-2xl font-black text-sky-600">{openTasks.length}</span>
            </div>
            <div className="text-xs font-black uppercase text-slate-900 mt-1">Tasks To Do</div>
            <div className="text-[10px] font-bold text-slate-600">
              {urgentTasks.length > 0 ? `⚡ ${urgentTasks.length} hurry up!` : 'All done!'}
            </div>
          </div>

          {/* 2. Money */}
          <div
            onClick={() => {
              triggerHaptic.light();
              setActiveModule('budget');
            }}
            className="bg-white p-3.5 rounded-3xl border-3 border-slate-900 shadow-[3px_3px_0px_#0f172a] cursor-pointer hover:bg-emerald-50 transition active:scale-95"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">🐷</span>
              <span className="text-lg sm:text-xl font-black text-emerald-600 truncate">
                {formatCents(remainingBudgetCents)}
              </span>
            </div>
            <div className="text-xs font-black uppercase text-slate-900 mt-1">Piggy Bank</div>
            <div className="text-[10px] font-bold text-slate-600">Ready to spend</div>
          </div>

          {/* 3. Helpers */}
          <div
            onClick={() => {
              triggerHaptic.light();
              setActiveModule('proxy');
            }}
            className="bg-white p-3.5 rounded-3xl border-3 border-slate-900 shadow-[3px_3px_0px_#0f172a] cursor-pointer hover:bg-purple-50 transition active:scale-95"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">🤝</span>
              <span className="text-2xl font-black text-purple-600">{db.proxies.length}</span>
            </div>
            <div className="text-xs font-black uppercase text-slate-900 mt-1">My Helpers</div>
            <div className="text-[10px] font-bold text-slate-600">Can buy & help</div>
          </div>

          {/* 4. Votes */}
          <div
            onClick={() => {
              triggerHaptic.light();
              setActiveModule('consensus');
            }}
            className="bg-white p-3.5 rounded-3xl border-3 border-slate-900 shadow-[3px_3px_0px_#0f172a] cursor-pointer hover:bg-pink-50 transition active:scale-95"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">🗳️</span>
              <span className="text-2xl font-black text-pink-600">{proposalsNeedingVote.length}</span>
            </div>
            <div className="text-xs font-black uppercase text-slate-900 mt-1">Big Votes</div>
            <div className="text-[10px] font-bold text-slate-600">Waiting for you!</div>
          </div>
        </div>
      </section>
      
      {/* Dynamic Casual AI Suggestions */}
      <AiSuggestionBanners />

      {/* 6 GIANT CHILD-SIMPLE HUB BUTTONS */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg sm:text-xl font-black uppercase text-slate-950 tracking-tight flex items-center gap-2">
            <span>🎮 PICK A TOY BOX</span>
          </h3>
          <span className="text-xs font-extrabold text-amber-800 bg-amber-200 px-2.5 py-1 rounded-full border-2 border-slate-900">
            1-TAP TO PLAY
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* 1. TO-DO */}
          <BigButton
            color="blue"
            size="mega"
            icon="✅"
            subtitle={`${openTasks.length} things to finish today`}
            badge={openTasks.length}
            onClick={() => setActiveModule('todo')}
          >
            MY TO-DO LIST
          </BigButton>

          {/* 2. SNAP A SLIP */}
          <BigButton
            color="orange"
            size="mega"
            icon="📸"
            subtitle="Take a photo of paper slips & bills"
            badge={db.slips.length}
            onClick={() => setActiveModule('slips')}
          >
            SNAP A SLIP
          </BigButton>

          {/* 3. PIGGY BANK */}
          <BigButton
            color="green"
            size="mega"
            icon="💰"
            subtitle={`Piggy bank has ${formatCents(remainingBudgetCents)}`}
            onClick={() => setActiveModule('budget')}
          >
            MY PIGGY BANK
          </BigButton>

          {/* 4. HELPERS */}
          <BigButton
            color="purple"
            size="mega"
            icon="🤝"
            subtitle="Give helpers permission to buy"
            badge={db.proxies.length}
            onClick={() => setActiveModule('proxy')}
          >
            MY HELPERS
          </BigButton>

          {/* 5. BIG VOTE */}
          <BigButton
            color="pink"
            size="mega"
            icon="🗳️"
            subtitle="Vote YES, NO, or CHAT with team"
            badge={openProposals.length}
            onClick={() => setActiveModule('consensus')}
          >
            THE BIG VOTE
          </BigButton>

          {/* 6. PLAY WITH BLOCKS */}
          <BigButton
            color="teal"
            size="mega"
            icon="🧩"
            subtitle="Snap blocks together like LEGO"
            badge={db.flows.length}
            onClick={() => setActiveModule('flows')}
          >
            PLAY WITH BLOCKS
          </BigButton>

          {/* 7. 3D ARCADE GAME */}
          <BigButton
            color="yellow"
            size="mega"
            icon="🎮"
            subtitle="Play 3D Circuit Rush Tinkerer Runner"
            onClick={() => setActiveModule('arcade')}
          >
            3D ARCADE GAME
          </BigButton>
        </div>
      </section>

      {/* Quick Gmail Summary Dispatch Banner */}
      <section className="bg-rose-100 border-3 border-slate-900 rounded-[28px] p-4 chunky-card flex items-center justify-between gap-3 shadow-[4px_4px_0px_#000]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center border-2 border-slate-900 font-black text-2xl shrink-0 shadow-[2px_2px_0px_#000]">
            ✉️
          </div>
          <div className="min-w-0">
            <h4 className="font-black text-slate-950 text-base uppercase truncate">
              Send Summary via Gmail
            </h4>
            <p className="text-xs font-bold text-slate-700 truncate">
              Pre-filled email with tasks, votes & budget report
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic.heavy();
            setIsGmailSummaryOpen(true);
          }}
          className="chunky-btn px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs border-2 border-slate-900 shadow-[2px_2px_0px_#000] shrink-0 active:translate-y-0.5"
        >
          OPEN GMAIL
        </button>
      </section>

      {/* Child-Simple Focus: Tap to Check Off with Confetti! */}
      {urgentTasks.length > 0 && (
        <section className="bg-white rounded-[32px] p-5 chunky-card space-y-3">
          <div className="flex items-center justify-between border-b-3 border-slate-900 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-pulse">⚡</span>
              <h3 className="text-base font-black uppercase text-slate-950">Quick Tap to Finish:</h3>
            </div>
            <span className="text-xs font-black text-rose-600 uppercase">Hurry up!</span>
          </div>

          <div className="space-y-2.5">
            {urgentTasks.slice(0, 2).map((task) => (
              <div
                key={task.id}
                className="p-3.5 rounded-2xl bg-amber-50 border-3 border-slate-900 flex items-center justify-between gap-3 shadow-[2px_2px_0px_#0f172a]"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black text-slate-950 truncate">{task.title}</div>
                  <div className="text-xs font-bold text-slate-600 mt-0.5">
                    {task.category} • Tap checkmark when done!
                  </div>
                </div>

                <button
                  onClick={() => handleQuickCheck(task.id)}
                  className="w-12 h-12 rounded-2xl bg-emerald-400 hover:bg-emerald-500 border-3 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:scale-95 flex items-center justify-center shrink-0 cursor-pointer text-slate-950"
                  title="Mark finished!"
                >
                  <CheckSquare className="w-7 h-7 stroke-[3]" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
