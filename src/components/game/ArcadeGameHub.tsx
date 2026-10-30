import React, { useState } from 'react';
import { CircuitRunner3D } from './CircuitRunner3D';
import { useApp } from '../../context/AppContext';
import { Sparkles, Trophy, Gamepad2, Zap, ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

export const ArcadeGameHub: React.FC = () => {
  const { setActiveModule } = useApp();
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className={`space-y-4 pb-28 ${isFullscreen ? 'fixed inset-0 z-50 p-2 sm:p-4 bg-slate-950 overflow-hidden' : ''}`}>
      {/* Top Bar */}
      <div className="bg-yellow-400 rounded-3xl p-4 chunky-card flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-slate-950 text-yellow-400 flex items-center justify-center font-black border-2 border-slate-900 shadow-[2px_2px_0px_#000]">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 uppercase leading-none">
              TINKERER ARCADE 3D
            </h2>
            <p className="text-xs font-black text-slate-800 mt-0.5">
              CIRCUIT RUSH • GEAR HARVEST • 60FPS SIMULATION
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              triggerHaptic.light();
              setIsFullscreen(!isFullscreen);
            }}
            className="chunky-btn p-2 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-900 text-slate-900 shadow-[2px_2px_0px_#000]"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          <button
            onClick={() => {
              triggerHaptic.pop();
              setActiveModule('home');
            }}
            className="chunky-btn px-3 py-2 rounded-xl bg-slate-900 text-white font-black text-xs border-2 border-slate-900 flex items-center gap-1.5 shadow-[2px_2px_0px_#000]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Hub</span>
          </button>
        </div>
      </div>

      {/* The 3D Game Canvas & Shell */}
      <CircuitRunner3D onExit={() => setActiveModule('home')} />
    </div>
  );
};
