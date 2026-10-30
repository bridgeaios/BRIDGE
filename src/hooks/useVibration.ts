import { useCallback, useEffect, useState } from 'react';
import { isHapticsEnabled, setHapticsEnabled, triggerHaptic, VibrationPattern, vibrate } from '../utils/haptics';

export interface UseVibrationReturn {
  isSupported: boolean;
  isEnabled: boolean;
  toggleEnabled: () => void;
  setEnabled: (enabled: boolean) => void;
  tap: () => void;
  success: () => void;
  heavy: () => void;
  pop: () => void;
  warning: () => void;
  celebrate: () => void;
  tick: () => void;
  vibrateCustom: (pattern: VibrationPattern) => void;
  withVibration: <T extends (...args: any[]) => any>(
    handler?: T,
    pattern?: VibrationPattern
  ) => (...args: Parameters<T>) => ReturnType<T> | void;
}

/**
 * React hook for device vibration & tactile haptic feedback on mobile devices.
 * Automatically checks for browser support, respects user toggle preferences,
 * and falls back gracefully with acoustic micro-thumps on devices without navigator.vibrate.
 */
export function useVibration(): UseVibrationReturn {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isEnabled, setIsEnabledState] = useState<boolean>(isHapticsEnabled);

  useEffect(() => {
    const supported = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
    setIsSupported(supported);
    setIsEnabledState(isHapticsEnabled());
  }, []);

  const toggleEnabled = useCallback(() => {
    const next = !isEnabled;
    setIsEnabledState(next);
    setHapticsEnabled(next);
    if (next) {
      triggerHaptic.tap();
    }
  }, [isEnabled]);

  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabledState(enabled);
    setHapticsEnabled(enabled);
  }, []);

  const tap = useCallback(() => {
    triggerHaptic.tap();
  }, []);

  const success = useCallback(() => {
    triggerHaptic.success();
  }, []);

  const heavy = useCallback(() => {
    triggerHaptic.heavy();
  }, []);

  const pop = useCallback(() => {
    triggerHaptic.pop();
  }, []);

  const warning = useCallback(() => {
    triggerHaptic.warning();
  }, []);

  const celebrate = useCallback(() => {
    triggerHaptic.celebrate();
  }, []);

  const tick = useCallback(() => {
    triggerHaptic.tick();
  }, []);

  const vibrateCustom = useCallback((pattern: VibrationPattern) => {
    vibrate(pattern);
  }, []);

  /**
   * Higher-order function to attach tactile vibration to any click/press handler.
   */
  const withVibration = useCallback(
    <T extends (...args: any[]) => any>(handler?: T, pattern: VibrationPattern = 'tap') => {
      return (...args: Parameters<T>): ReturnType<T> | void => {
        vibrate(pattern);
        if (handler) {
          return handler(...args);
        }
      };
    },
    []
  );

  return {
    isSupported,
    isEnabled,
    toggleEnabled,
    setEnabled,
    tap,
    success,
    heavy,
    pop,
    warning,
    celebrate,
    tick,
    vibrateCustom,
    withVibration,
  };
}
