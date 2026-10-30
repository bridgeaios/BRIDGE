import React, { useEffect, useState } from 'react';
import { Download, Share, PlusSquare } from 'lucide-react';
import { playSound } from '../../utils/sound';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if running standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    const iOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(iOSDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    playSound.pop();
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  // Hide if already running as an installed PWA
  if (isInstalled) return null;

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Install Life Hub to your home screen"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-300 hover:bg-yellow-400 text-slate-900 font-extrabold text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] transition"
      >
        <Download className="w-4 h-4 stroke-[2.5]" />
        <span>Install App</span>
      </button>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-amber-50 p-6 chunky-card">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">📱</span>
              <h3 className="text-xl font-black text-slate-900">Install on iPhone / iPad</h3>
            </div>
            <p className="text-sm text-slate-800 leading-relaxed font-semibold">
              To install <strong>Big Button Life Hub</strong>:
            </p>
            <div className="mt-3 space-y-2 bg-white p-3 rounded-2xl border-2 border-slate-900">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Share className="w-5 h-5 text-blue-600 shrink-0" />
                <span>1. Tap Share in Safari's toolbar</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <PlusSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>2. Tap "Add to Home Screen"</span>
              </div>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-2xl chunky-btn"
            >
              Got It!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
