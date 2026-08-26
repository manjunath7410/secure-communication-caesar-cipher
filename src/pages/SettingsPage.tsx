import React from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Trash2,
  Activity,
  Sliders,
  Sparkles,
  Shield,
  RotateCcw,
} from 'lucide-react';
import { UserSettings, AppView } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';
import { useOperationsLog } from '../hooks/useOperationsLog';
import { ShiftSelector } from '../components/common/ShiftSelector';
import { SecuritySettingsSection } from '../components/security/SecuritySettingsSection';

interface SettingsPageProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onResetSettings: () => void;
  onNavigate?: (view: AppView) => void;
  onToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  onResetSettings,
  onNavigate,
  onToast,
}) => {
  const { theme, setTheme } = useTheme();
  const { clearLog } = useOperationsLog();

  const handleClearData = () => {
    if (window.confirm('Clear all local session and message history?')) {
      clearLog();
      onToast?.('info', 'Data Cleared', 'Local history has been reset.');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Settings
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Manage appearance, default shift keys, and local application preferences.
        </p>
      </div>

      <div className="space-y-4">
        {/* Appearance / Theme */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Appearance
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Choose how the application looks to you.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium capitalize">
              {theme === 'system' ? 'System (Auto)' : `${theme} mode`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1" role="radiogroup" aria-label="Theme selection">
            {/* Light Option */}
            <button
              type="button"
              id="theme-option-light"
              role="radio"
              aria-checked={theme === 'light'}
              onClick={() => {
                setTheme('light');
                onToast?.('info', 'Theme Updated', 'Switched to Light mode.');
              }}
              className={`p-3.5 rounded-xl border flex items-center justify-between sm:flex-col sm:justify-center gap-2.5 text-xs font-medium transition-all cursor-pointer ${
                theme === 'light'
                  ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-xs ring-1 ring-blue-600/30'
                  : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2 sm:flex-col sm:gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Sun className="w-4 h-4" />
                </div>
                <div className="text-left sm:text-center">
                  <span className="font-semibold text-sm block">Light</span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-normal">Clean bright interface</span>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                theme === 'light'
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-neutral-300 dark:border-neutral-700'
              }`}>
                {theme === 'light' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </button>

            {/* Dark Option */}
            <button
              type="button"
              id="theme-option-dark"
              role="radio"
              aria-checked={theme === 'dark'}
              onClick={() => {
                setTheme('dark');
                onToast?.('info', 'Theme Updated', 'Switched to Dark mode.');
              }}
              className={`p-3.5 rounded-xl border flex items-center justify-between sm:flex-col sm:justify-center gap-2.5 text-xs font-medium transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-xs ring-1 ring-blue-600/30'
                  : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2 sm:flex-col sm:gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Moon className="w-4 h-4" />
                </div>
                <div className="text-left sm:text-center">
                  <span className="font-semibold text-sm block">Dark</span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-normal">Refined dark surface</span>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                theme === 'dark'
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-neutral-300 dark:border-neutral-700'
              }`}>
                {theme === 'dark' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </button>

            {/* System Option */}
            <button
              type="button"
              id="theme-option-system"
              role="radio"
              aria-checked={theme === 'system'}
              onClick={() => {
                setTheme('system');
                onToast?.('info', 'Theme Updated', 'Matched to system preference.');
              }}
              className={`p-3.5 rounded-xl border flex items-center justify-between sm:flex-col sm:justify-center gap-2.5 text-xs font-medium transition-all cursor-pointer ${
                theme === 'system'
                  ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-xs ring-1 ring-blue-600/30'
                  : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2 sm:flex-col sm:gap-2">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
                  <Laptop className="w-4 h-4" />
                </div>
                <div className="text-left sm:text-center">
                  <span className="font-semibold text-sm block">System</span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-normal">Sync with device OS</span>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                theme === 'system'
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-neutral-300 dark:border-neutral-700'
              }`}>
                {theme === 'system' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </button>
          </div>
        </div>

        {/* Security & App Lock */}
        <SecuritySettingsSection onToast={onToast} />

        {/* Default Shift Preference */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 transition-colors">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Default Shift Key
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Set the standard shift when opening the encrypt and decrypt tools.
            </p>
          </div>

          <ShiftSelector
            value={settings.defaultShift}
            onChange={(val) => onUpdateSettings({ defaultShift: val })}
          />
        </div>

        {/* Data & Privacy */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3 transition-colors">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Data &amp; Storage
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              All messages are encrypted locally on your device with zero plaintext stored in the database.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleClearData}
              className="px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear local history</span>
            </button>

            <button
              type="button"
              onClick={onResetSettings}
              className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset preferences</span>
            </button>
          </div>
        </div>

        {/* Diagnostics & Testing */}
        {onNavigate && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs flex items-center justify-between gap-4 transition-colors">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>System Diagnostics &amp; Test Runner</span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Run the 323 automated unit and cryptographic verification tests in your browser.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('health')}
              className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium shrink-0 cursor-pointer transition-colors"
            >
              Run Tests
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
