/**
 * Tactile device vibration utility using navigator.vibrate
 * with acoustic micro-thump fallback for iOS Safari.
 */

let hapticEnabled = true;

export type VibrationPattern =
  | 'tap'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'pop'
  | 'success'
  | 'warning'
  | 'celebrate'
  | 'tick'
  | number
  | number[];

const PATTERNS: Record<string, number | number[]> = {
  tick: 8,
  tap: 14,
  light: 12,
  pop: 18,
  medium: 28,
  heavy: 45,
  success: [15, 35, 22, 35, 28],
  warning: [40, 50, 40],
  celebrate: [20, 30, 25, 30, 35, 35, 60],
};

export function setHapticsEnabled(enabled: boolean) {
  hapticEnabled = enabled;
  try {
    localStorage.setItem('bb_haptic_enabled', enabled ? 'true' : 'false');
  } catch {}
}

export function isHapticsEnabled(): boolean {
  try {
    const val = localStorage.getItem('bb_haptic_enabled');
    if (val !== null) hapticEnabled = val === 'true';
  } catch {}
  return hapticEnabled;
}

export function isVibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

/**
 * Acoustic tactile micro-thump fallback using Web Audio API
 * for devices (like iOS Safari) where navigator.vibrate is restricted.
 */
function playAcousticThump(frequency: number = 55, durationSec: number = 0.035) {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + durationSec);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationSec + 0.01);
  } catch {}
}

/**
 * Trigger device vibration with named tactile patterns or duration arrays.
 */
export function vibrate(pattern: VibrationPattern = 'tap') {
  if (!isHapticsEnabled()) return;

  const resolved =
    typeof pattern === 'string'
      ? PATTERNS[pattern] ?? PATTERNS.tap
      : pattern;

  if (isVibrationSupported()) {
    try {
      navigator.vibrate(resolved);
    } catch {}
  } else {
    // Subtle acoustic haptic simulation for iOS Safari
    if (pattern === 'success' || pattern === 'celebrate') {
      playAcousticThump(70, 0.06);
    } else if (pattern === 'heavy') {
      playAcousticThump(45, 0.05);
    } else {
      playAcousticThump(60, 0.025);
    }
  }
}

export const triggerHaptic = {
  tick: () => vibrate('tick'),
  tap: () => vibrate('tap'),
  light: () => vibrate('light'),
  medium: () => vibrate('medium'),
  heavy: () => vibrate('heavy'),
  pop: () => vibrate('pop'),
  success: () => vibrate('success'),
  warning: () => vibrate('warning'),
  celebrate: () => vibrate('celebrate'),
};
