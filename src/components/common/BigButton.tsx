import React from 'react';
import { playSound } from '../../utils/sound';
import { vibrate, VibrationPattern } from '../../utils/haptics';

export type ButtonColor =
  | 'yellow'
  | 'blue'
  | 'green'
  | 'orange'
  | 'purple'
  | 'pink'
  | 'teal'
  | 'slate'
  | 'red';

interface BigButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: ButtonColor;
  size?: 'normal' | 'giant' | 'mega'; // 68px, 80px, 94px
  icon?: React.ReactNode;
  subtitle?: string;
  badge?: string | number;
  fullWidth?: boolean;
  vibratePattern?: VibrationPattern;
}

const COLOR_CLASSES: Record<ButtonColor, string> = {
  yellow: 'bg-yellow-300 hover:bg-yellow-400 text-slate-950',
  blue: 'bg-sky-400 hover:bg-sky-500 text-slate-950',
  green: 'bg-emerald-400 hover:bg-emerald-500 text-slate-950',
  orange: 'bg-amber-400 hover:bg-amber-500 text-slate-950',
  purple: 'bg-purple-300 hover:bg-purple-400 text-slate-950',
  pink: 'bg-pink-300 hover:bg-pink-400 text-slate-950',
  teal: 'bg-teal-300 hover:bg-teal-400 text-slate-950',
  slate: 'bg-slate-200 hover:bg-slate-300 text-slate-950',
  red: 'bg-rose-400 hover:bg-rose-500 text-slate-950',
};

const SIZE_CLASSES = {
  normal: 'min-h-[68px] py-3.5 px-5 text-lg rounded-3xl',
  giant: 'min-h-[82px] py-4 px-6 text-xl rounded-3xl font-extrabold',
  mega: 'min-h-[94px] py-5 px-6 text-2xl rounded-3xl font-black',
};

export const BigButton: React.FC<BigButtonProps> = ({
  children,
  color = 'yellow',
  size = 'giant',
  icon,
  subtitle,
  badge,
  fullWidth = true,
  vibratePattern = 'tap',
  onClick,
  className = '',
  disabled,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    playSound.tap();
    vibrate(vibratePattern);
    if (onClick) onClick(e);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative inline-flex items-center justify-between
        font-black tracking-tight text-left
        chunky-btn select-none cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-[2px_2px_0px_#0f172a]
        ${fullWidth ? 'w-full' : ''}
        ${COLOR_CLASSES[color]}
        ${SIZE_CLASSES[size]}
        ${className}
      `}
      {...props}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {icon && <span className="text-4xl shrink-0 flex items-center justify-center">{icon}</span>}
        <div className="flex flex-col min-w-0">
          <span className="leading-tight truncate text-slate-950 font-black">{children}</span>
          {subtitle && (
            <span className="text-xs font-bold text-slate-800/80 truncate mt-0.5">{subtitle}</span>
          )}
        </div>
      </div>

      {badge !== undefined && (
        <span className="ml-3 shrink-0 px-3.5 py-1 bg-slate-950 text-white text-xs font-black rounded-full border-2 border-white shadow-xs">
          {badge}
        </span>
      )}
    </button>
  );
};
