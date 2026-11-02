/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { QuickAddModal } from './components/common/QuickAddModal';
import { HomeDashboard } from './components/home/HomeDashboard';
import { TodoHub } from './components/todo/TodoHub';
import { SlipCaptureHub } from './components/slips/SlipCaptureHub';
import { BudgetHub } from './components/budget/BudgetHub';
import { ProxyHub } from './components/proxy/ProxyHub';
import { ConsensusHub } from './components/consensus/ConsensusHub';
import { FlowBuilderHub } from './components/flows/FlowBuilderHub';
import { AdminSetupModal } from './components/admin/AdminSetupModal';
import { CasualAiModal } from './components/ai/CasualAiModal';
import { GoogleSyncModal } from './components/common/GoogleSyncModal';
import { GmailSummaryModal } from './components/common/GmailSummaryModal';
const ArcadeGameHub = lazy(() => import('./components/game/ArcadeGameHub').then(m => ({ default: m.ArcadeGameHub })));
const LandingPage = lazy(() => import('./pages/HubPages').then(m => ({ default: m.LandingPage })));
const AuthPage = lazy(() => import('./pages/HubPages').then(m => ({ default: m.AuthPage })));
const PaymentPage = lazy(() => import('./pages/HubPages').then(m => ({ default: m.PaymentPage })));

import { useHaptics } from './hooks/useHaptics';

type Route = 'landing' | 'auth' | 'payment' | 'app';

const RouteContext = createContext<{
  route: Route;
  setRoute: (r: Route) => void;
} | null>(null);

export function useRoute() {
  const ctx = useContext(RouteContext);
  if (!ctx) throw new Error('useRoute must be used within RouteProvider');
  return ctx;
}

function MainContent() {
  const { activeModule, isGmailSummaryOpen, setIsGmailSummaryOpen } = useApp();

  return (
    <main className="max-w-4xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6">
      {activeModule === 'home' && <HomeDashboard />}
      {activeModule === 'todo' && <TodoHub />}
      {activeModule === 'slips' && <SlipCaptureHub />}
      {activeModule === 'budget' && <BudgetHub />}
      {activeModule === 'proxy' && <ProxyHub />}
      {activeModule === 'consensus' && <ConsensusHub />}
      {activeModule === 'flows' && <FlowBuilderHub />}
      {activeModule === 'arcade' && <ArcadeGameHub />}

      <QuickAddModal />
      <AdminSetupModal />
      <CasualAiModal />
      <GoogleSyncModal />
      <GmailSummaryModal
        isOpen={isGmailSummaryOpen}
        onClose={() => setIsGmailSummaryOpen(false)}
      />
    </main>
  );
}

function AppContent() {
  const [route, setRoute] = useState<Route>('landing');
  const { light } = useHaptics();

  useEffect(() => {
    const handleChunkyButtonClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const chunkyBtn = target.closest('.chunky-btn');
      if (
        chunkyBtn &&
        !chunkyBtn.hasAttribute('disabled') &&
        chunkyBtn.getAttribute('aria-disabled') !== 'true'
      ) {
        light();
      }
    };

    document.addEventListener('click', handleChunkyButtonClick, { passive: true });
    return () => {
      document.removeEventListener('click', handleChunkyButtonClick);
    };
  }, [light]);

  return (
    <RouteContext.Provider value={{ route, setRoute }}>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-amber-50"><div className="text-slate-900 font-bold">Loading...</div></div>}>
        {route === 'landing' && <LandingPage />}
        {route === 'auth' && <AuthPage />}

        {route === 'payment' && <PaymentPage />}

        {route === 'app' && (
          <div className="min-h-screen bg-amber-50 text-slate-900 selection:bg-yellow-300 selection:text-black font-sans">
            <Header />
            <MainContent />
            <BottomNav />
          </div>
        )}
      </Suspense>
    </RouteContext.Provider>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
