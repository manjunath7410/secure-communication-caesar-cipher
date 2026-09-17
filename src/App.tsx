/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TacticalHeader } from './components/layout/TacticalHeader';
import { TacticalFooter } from './components/layout/TacticalFooter';
import { DesktopSidebar } from './components/navigation/DesktopSidebar';
import { MobileNavigation } from './components/navigation/MobileNavigation';
import { ToastContainer } from './components/common/ToastContainer';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLockProvider } from './context/AppLockContext';
import { ShiftProvider } from './context/ShiftContext';
import { AppLockScreen } from './components/security/AppLockScreen';

// Pages
import { HomePage } from './pages/HomePage';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { EncryptPage } from './pages/EncryptPage';
import { DecryptPage } from './pages/DecryptPage';
import { HistoryPage } from './pages/HistoryPage';
import { MapPage } from './pages/MapPage';
import { LearnPage } from './pages/LearnPage';
import { BruteForcePage } from './pages/BruteForcePage';
import { AboutPage } from './pages/AboutPage';
import { SecurityInfoPage } from './pages/SecurityInfoPage';
import { SettingsPage } from './pages/SettingsPage';
import { HealthStatusPage } from './pages/HealthStatusPage';
import { AccountPage } from './pages/AccountPage';
import { LiveVoiceCopilot } from './components/audio/LiveVoiceCopilot';

// Types & Hooks
import { AppView, UserSettings, ToastMessage } from './types/navigation';
import { useHealthCheck } from './hooks/useHealthCheck';
import { useCapacitor } from './hooks/useCapacitor';

function AppContent() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isVoiceCopilotOpen, setIsVoiceCopilotOpen] = useState(false);

  // Hook for Native Android Capacitor Hardware Navigation & System Config
  useCapacitor(currentView, setCurrentView, (type, title, message) => {
    handleToast(type, title, message);
  });

  // User Settings State
  const [settings, setSettings] = useState<UserSettings>({
    defaultShift: 3,
    autoUppercase: false,
    preserveWhitespace: true,
    highContrastMonospace: true,
    soundFeedback: false,
    livePreview: true,
  });

  const { lastChecked, refreshHealth } = useHealthCheck();

  // Toast Dispatcher
  const handleToast = (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => {
    const newToast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title,
      message,
      timestamp: Date.now(),
    };
    setToasts((prev) => [...prev.slice(-4), newToast]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleResetSettings = () => {
    setSettings({
      defaultShift: 3,
      autoUppercase: false,
      preserveWhitespace: true,
      highContrastMonospace: true,
      soundFeedback: false,
      livePreview: true,
    });
    handleToast('info', 'Settings Reset', 'Configuration reverted to baseline defaults.');
  };

  return (
    <div
      id="caesar-app-root"
      className="w-full h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans flex flex-col overflow-hidden select-none transition-colors"
    >
      {/* Top Header */}
      <TacticalHeader
        currentView={currentView}
        onViewChange={setCurrentView}
        onRefresh={refreshHealth}
        onOpenVoice={() => setIsVoiceCopilotOpen(true)}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar Navigation */}
        <DesktopSidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          onOpenVoice={() => setIsVoiceCopilotOpen(true)}
        />

        {/* Center Main Stage View Container */}
        <main
          id="main-content-viewport"
          className="flex-1 h-full overflow-y-auto bg-neutral-50/50 dark:bg-neutral-950/50 pb-20 md:pb-6 focus:outline-none transition-colors"
          tabIndex={-1}
        >
          {(currentView === 'home' || currentView === 'landing' || currentView === 'dashboard') && (
            <HomePage onNavigate={setCurrentView} onToast={handleToast} />
          )}

          {currentView === 'login' && (
            <LoginPage onNavigate={setCurrentView} onToast={handleToast} />
          )}

          {currentView === 'register' && (
            <RegisterPage onNavigate={setCurrentView} onToast={handleToast} />
          )}

          {currentView === 'encrypt' && (
            <EncryptPage onNavigate={setCurrentView} onToast={handleToast} />
          )}

          {currentView === 'decrypt' && (
            <DecryptPage onNavigate={setCurrentView} onToast={handleToast} />
          )}

          {currentView === 'history' && (
            <HistoryPage onNavigate={setCurrentView} onToast={handleToast} />
          )}

          {currentView === 'map' && (
            <MapPage onNavigate={setCurrentView} onToast={handleToast} />
          )}

          {(currentView === 'learn' || currentView === 'bruteforce' || currentView === 'about' || currentView === 'security' || currentView === 'architecture') && (
            <LearnPage onNavigate={setCurrentView} onToast={handleToast} />
          )}

          {currentView === 'settings' && (
            <SettingsPage
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onResetSettings={handleResetSettings}
              onNavigate={setCurrentView}
              onToast={handleToast}
            />
          )}

          {currentView === 'health' && (
            <HealthStatusPage />
          )}

          {currentView === 'account' && (
            <AccountPage onNavigate={setCurrentView} onToast={handleToast} />
          )}
        </main>
      </div>

      {/* Floating Toast Notification Dispatcher */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* Global Live Voice Copilot Modal */}
      <LiveVoiceCopilot
        isOpen={isVoiceCopilotOpen}
        onClose={() => setIsVoiceCopilotOpen(false)}
        onToast={handleToast}
      />

      {/* Mobile Navigation Drawer & Bottom Bar */}
      <MobileNavigation
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenVoice={() => setIsVoiceCopilotOpen(true)}
      />

      {/* Footer */}
      <TacticalFooter lastCheckedTime={lastChecked?.toLocaleTimeString()} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppLockProvider>
          <ShiftProvider>
            <AppLockScreen />
            <AppContent />
          </ShiftProvider>
        </AppLockProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
