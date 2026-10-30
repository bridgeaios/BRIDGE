/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { QuickAddModal } from './components/common/QuickAddModal';
import { SystemTestRunner } from './components/common/SystemTestRunner';
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
import { ArcadeGameHub } from './components/game/ArcadeGameHub';

import { useHaptics } from './hooks/useHaptics';

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
      <SystemTestRunner />
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
  // Integrate useHaptics hook to trigger light vibration feedback pattern on clicking any element with class 'chunky-btn'
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
    <div className="min-h-screen bg-amber-50 text-slate-900 selection:bg-yellow-300 selection:text-black font-sans">
      <Header />
      <MainContent />
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
