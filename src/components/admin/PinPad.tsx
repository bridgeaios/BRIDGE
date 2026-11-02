import React from 'react';
import { KeyRound } from 'lucide-react';

interface PinPadProps {
  enteredPin: string;
  pinError: boolean;
  handleKeypadPress: (val: string) => void;
  handleClearPin: () => void;
  setIsAuthenticated: (v: boolean) => void;
}

export const PinPad: React.FC<PinPadProps> = ({ enteredPin, pinError, handleKeypadPress, handleClearPin, setIsAuthenticated }) => {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center max-w-sm mx-auto">
      <div className="w-16 h-16 rounded-3xl bg-yellow-300 border-3 border-slate-900 flex items-center justify-center text-slate-900 mb-4 shadow-[4px_4px_0px_#000]">
        <KeyRound className="w-8 h-8" />
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-1">ENTER ADMIN PIN</h3>
      <p className="text-sm font-bold text-slate-600 mb-6">Default PIN is 1234</p>

      <div className="flex items-center justify-center gap-4 mb-6">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className={`w-6 h-6 rounded-full border-3 border-slate-900 transition-all ${
              pinError
                ? 'bg-rose-500 border-rose-700 animate-bounce'
                : enteredPin.length > idx
                ? 'bg-slate-900 scale-110'
                : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 w-full">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            onClick={() => handleKeypadPress(digit)}
            className="chunky-btn h-14 rounded-2xl bg-amber-100 hover:bg-amber-200 text-slate-900 border-3 border-slate-900 text-2xl font-black shadow-[3px_3px_0px_#000] active:translate-y-1 active:shadow-none"
          >
            {digit}
          </button>
        ))}
        <button
          onClick={handleClearPin}
          className="chunky-btn h-14 rounded-2xl bg-rose-200 hover:bg-rose-300 text-rose-900 border-3 border-slate-900 text-sm font-black shadow-[3px_3px_0px_#000] active:translate-y-1 active:shadow-none flex items-center justify-center"
        >
          CLEAR
        </button>
        <button
          onClick={() => handleKeypadPress('0')}
          className="chunky-btn h-14 rounded-2xl bg-amber-100 hover:bg-amber-200 text-slate-900 border-3 border-slate-900 text-2xl font-black shadow-[3px_3px_0px_#000] active:translate-y-1 active:shadow-none"
        >
          0
        </button>
        <button
          onClick={() => setIsAuthenticated(true)}
          className="chunky-btn h-14 rounded-2xl bg-emerald-300 hover:bg-emerald-400 text-slate-900 border-3 border-slate-900 text-xs font-black shadow-[3px_3px_0px_#000] active:translate-y-1 active:shadow-none flex items-center justify-center"
        >
          BYPASS (DEV)
        </button>
      </div>
    </div>
  );
};
