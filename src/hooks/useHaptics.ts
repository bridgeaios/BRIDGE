import { useCallback, useEffect, useState } from 'react';
import { isHapticsEnabled, setHapticsEnabled, isVibrationSupported } from '../utils/haptics';

export type HapticType =
  | 'button'
  | 'success'
  | 'celebrate'
  | 'selection'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'warning'
  | number
  | number[];

const HAPTIC_PATTERNS: Record<string, number | number[]> = {
  // Subtle tactile tap for buttons
  button: 12,
  selection: 8,
  light: 10,
  medium: 22,
  heavy: 35,
  // Subtle double-pulse pattern for successful action completion
  success: [15, 35, 25],
  celebrate: [18, 30, 22, 30, 40],
  warning: [30, 40, 30],
};

let lastVibrationTimestamp = 0;

/**
 * Triggers subtle vibration via navigator.vibrate if supported and enabled,
 * with debouncing to prevent audio/haptic stutter.
 */
function triggerVibrate(pattern: HapticType): boolean {
  if (!isHapticsEnabled()) return false;

  const now = Date.now();
  // Debounce rapid duplicate haptic triggers within 35ms
  if (now - lastVibrationTimestamp < 35 && (pattern === 'button' || pattern === 'light' || pattern === 'selection')) {
    return false;
  }
  lastVibrationTimestamp = now;

  const resolved =
    typeof pattern === 'string'
      ? HAPTIC_PATTERNS[pattern] ?? HAPTIC_PATTERNS.light
      : pattern;

  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      return navigator.vibrate(resolved);
    } catch {
      return false;
    }
  }

  // Fallback acoustic tactile micro-pulse for iOS Safari
  try {
    if (typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const duration = pattern === 'success' ? 0.045 : 0.02;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + duration);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration + 0.01);
      }
    }
  } catch {}

  return false;
}

export interface UseHapticsOptions {
  /**
   * If true, automatically listens for click interactions on elements matching `.chunky-btn`
   * across the DOM and triggers tactile feedback.
   */
  autoBindChunkyButtons?: boolean;
  /**
   * The vibration pattern to trigger on chunky button interaction. Defaults to 'light'.
   */
  autoBindPattern?: HapticType;
}

export interface UseHapticsReturn {
  isSupported: boolean;
  isEnabled: boolean;
  toggleEnabled: () => void;
  setEnabled: (val: boolean) => void;
  trigger: (pattern: HapticType) => void;
  buttonClick: () => void;
  tap: () => void;
  actionSuccess: () => void;
  success: () => void;
  celebrate: () => void;
  warning: () => void;
  selection: () => void;
  light: () => void;
  medium: () => void;
  heavy: () => void;
}

/**
 * useHaptics Hook
 * Utilizes `navigator.vibrate` to provide subtle tactile feedback on all `.chunky-btn` interactions
 * and successful action completion.
 */
export function useHaptics(options: UseHapticsOptions = {}): UseHapticsReturn {
  const { autoBindChunkyButtons = false, autoBindPattern = 'light' } = options;
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isEnabled, setIsEnabledState] = useState<boolean>(isHapticsEnabled);

  useEffect(() => {
    setIsSupported(isVibrationSupported());
    setIsEnabledState(isHapticsEnabled());
  }, []);

  // Automatic global binding to all .chunky-btn click interactions if enabled
  useEffect(() => {
    if (!autoBindChunkyButtons || typeof document === 'undefined') return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const chunkyBtn = target.closest('.chunky-btn');
      if (chunkyBtn && !chunkyBtn.hasAttribute('disabled') && chunkyBtn.getAttribute('aria-disabled') !== 'true') {
        triggerVibrate(autoBindPattern);
      }
    };

    document.addEventListener('click', handleClick, { passive: true });
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [autoBindChunkyButtons, autoBindPattern]);

  const toggleEnabled = useCallback(() => {
    const next = !isEnabled;
    setIsEnabledState(next);
    setHapticsEnabled(next);
    if (next) {
      triggerVibrate('button');
    }
  }, [isEnabled]);

  const setEnabled = useCallback((val: boolean) => {
    setIsEnabledState(val);
    setHapticsEnabled(val);
  }, []);

  const trigger = useCallback((pattern: HapticType) => {
    triggerVibrate(pattern);
  }, []);

  const buttonClick = useCallback(() => {
    triggerVibrate('button');
  }, []);

  const tap = useCallback(() => {
    triggerVibrate('button');
  }, []);

  const actionSuccess = useCallback(() => {
    triggerVibrate('success');
  }, []);

  const success = useCallback(() => {
    triggerVibrate('success');
  }, []);

  const celebrate = useCallback(() => {
    triggerVibrate('celebrate');
  }, []);

  const warning = useCallback(() => {
    triggerVibrate('warning');
  }, []);

  const selection = useCallback(() => {
    triggerVibrate('selection');
  }, []);

  const light = useCallback(() => {
    triggerVibrate('light');
  }, []);

  const medium = useCallback(() => {
    triggerVibrate('medium');
  }, []);

  const heavy = useCallback(() => {
    triggerVibrate('heavy');
  }, []);

  return {
    isSupported,
    isEnabled,
    toggleEnabled,
    setEnabled,
    trigger,
    buttonClick,
    tap,
    actionSuccess,
    success,
    celebrate,
    warning,
    selection,
    light,
    medium,
    heavy,
  };
}
