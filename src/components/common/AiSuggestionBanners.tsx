import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, ArrowRight, X, Bot } from 'lucide-react';
import { playSound } from '../../utils/sound';
import { triggerHaptic } from '../../utils/haptics';

export const AiSuggestionBanners: React.FC = () => {
  const { aiSuggestions, setActiveModule, setIsAiChatOpen } = useApp();

  if (!aiSuggestions || aiSuggestions.length === 0) return null;

  const handleAction = (module: string) => {
    setActiveModule(module as any);
    playSound.pop();
    triggerHaptic.medium();
  };

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-yellow-400 border border-slate-900 flex items-center justify-center font-black text-xs text-slate-900">
            🤖
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">
            Hub Buddy Suggestions
          </span>
        </div>
        <button
          onClick={() => setIsAiChatOpen(true)}
          className="chunky-btn text-xs font-black text-purple-700 hover:text-purple-900 underline flex items-center gap-1"
        >
          <span>Ask Buddy</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {aiSuggestions.slice(0, 2).map((sug) => {
          const bgColors: Record<string, string> = {
            blue: 'bg-sky-100 hover:bg-sky-200 border-sky-900',
            orange: 'bg-amber-100 hover:bg-amber-200 border-amber-900',
            pink: 'bg-rose-100 hover:bg-rose-200 border-rose-900',
            green: 'bg-emerald-100 hover:bg-emerald-200 border-emerald-900',
          };
          const cardClass = bgColors[sug.color] || 'bg-yellow-100 hover:bg-yellow-200 border-slate-900';

          return (
            <div
              key={sug.id}
              className={`p-3.5 rounded-2xl border-3 border-slate-900 ${cardClass} shadow-[3px_3px_0px_#000] flex flex-col justify-between transition-all`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white border border-slate-900 text-slate-800">
                    {sug.badge}
                  </span>
                </div>
                <h4 className="font-black text-slate-900 text-sm">{sug.title}</h4>
                <p className="text-xs font-bold text-slate-600 mt-0.5">{sug.description}</p>
              </div>

              <div className="mt-3 flex items-center justify-end">
                <button
                  onClick={() => handleAction(sug.module)}
                  className="chunky-btn px-3 py-1.5 rounded-xl bg-slate-900 text-yellow-300 font-black text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_#000] active:translate-y-0.5"
                >
                  <span>{sug.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
