/**
 * @file SecuritySettingsSection.tsx
 * @description Polished Security & App Lock settings card with biometrics, PIN, auto-lock, and screen privacy controls.
 */

import React, { useState } from 'react';
import {
  Shield,
  Fingerprint,
  KeyRound,
  Clock,
  Smartphone,
  EyeOff,
  Copy,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAppLock } from '../../context/AppLockContext';
import { AutoLockTimeout } from '../../types/appLock';
import { PinSetupModal, PinModalMode } from './PinSetupModal';

interface SecuritySettingsSectionProps {
  onToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
}

export const SecuritySettingsSection: React.FC<SecuritySettingsSectionProps> = ({ onToast }) => {
  const {
    settings,
    biometricAvailability,
    updateSettings,
    lockNow,
  } = useAppLock();

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<PinModalMode>('setup');

  const handleToggleAppLock = () => {
    if (settings.enabled && settings.pinConfigured) {
      // Prompt for PIN to disable
      setModalMode('disable');
      setModalOpen(true);
    } else {
      // Open PIN setup modal
      setModalMode('setup');
      setModalOpen(true);
    }
  };

  const handleChangePin = () => {
    setModalMode('change');
    setModalOpen(true);
  };

  const handleModalSuccess = (msg: string) => {
    onToast?.('success', 'Security Updated', msg);
  };

  const autoLockOptions: { value: AutoLockTimeout; label: string }[] = [
    { value: 'immediately', label: 'Immediately' },
    { value: '1min', label: '1 min' },
    { value: '5min', label: '5 min' },
    { value: '15min', label: '15 min' },
    { value: 'never', label: 'Never' },
  ];

  return (
    <section
      id="security-settings-section"
      aria-labelledby="security-settings-heading"
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Shield className="w-4 h-4" />
            </div>
            <h2 id="security-settings-heading" className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Security &amp; App Lock
            </h2>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Protect Secure Communication when you're away with biometric and PIN authentication.
          </p>
        </div>

        {/* Master App Lock Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
              settings.enabled
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${settings.enabled ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
            {settings.enabled ? 'Enabled' : 'Disabled'}
          </span>

          <button
            type="button"
            id="app-lock-main-toggle"
            role="switch"
            aria-checked={settings.enabled}
            onClick={handleToggleAppLock}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600/30 ${
              settings.enabled ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                settings.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expanded Security Options (Only when App Lock is enabled) */}
      {settings.enabled && (
        <div className="space-y-4 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 animate-fadeIn">
          {/* Biometric Authentication */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50/70 dark:bg-neutral-950/40 border border-neutral-200/60 dark:border-neutral-800/60">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100/70 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mt-0.5">
                <Fingerprint className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  Biometric Unlock
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {biometricAvailability.isAvailable
                    ? biometricAvailability.platform === 'android'
                      ? 'Native Android BiometricPrompt (Fingerprint / Face)'
                      : 'WebAuthn / Device Passkey platform authenticator'
                    : 'Biometric hardware unavailable on this device (uses 6-digit PIN)'}
                </p>
              </div>
            </div>

            <button
              type="button"
              id="app-lock-biometrics-toggle"
              role="switch"
              disabled={!biometricAvailability.isAvailable}
              aria-checked={settings.biometricsEnabled && biometricAvailability.isAvailable}
              onClick={() => {
                updateSettings({ biometricsEnabled: !settings.biometricsEnabled });
                onToast?.('info', 'Biometrics', settings.biometricsEnabled ? 'Biometric unlock disabled' : 'Biometric unlock enabled');
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed ${
                settings.biometricsEnabled && biometricAvailability.isAvailable
                  ? 'bg-blue-600'
                  : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  settings.biometricsEnabled && biometricAvailability.isAvailable ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 6-Digit App PIN Management */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50/70 dark:bg-neutral-950/40 border border-neutral-200/60 dark:border-neutral-800/60">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100/70 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mt-0.5">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  App PIN
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  6-digit PIN cryptographically hashed with salted PBKDF2.
                </p>
              </div>
            </div>

            <button
              type="button"
              id="app-lock-change-pin-btn"
              onClick={handleChangePin}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium cursor-pointer transition-colors"
            >
              Change PIN
            </button>
          </div>

          {/* Auto-Lock Timeout */}
          <div className="p-3.5 rounded-xl bg-neutral-50/70 dark:bg-neutral-950/40 border border-neutral-200/60 dark:border-neutral-800/60 space-y-2.5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100/70 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  Auto-Lock Timeout
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Automatically lock after inactivity.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1.5 pt-1" role="radiogroup" aria-label="Auto-lock timeout options">
              {autoLockOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  id={`autolock-opt-${opt.value}`}
                  role="radio"
                  aria-checked={settings.autoLockTimeout === opt.value}
                  onClick={() => {
                    updateSettings({ autoLockTimeout: opt.value });
                    onToast?.('info', 'Auto-Lock', `Timeout set to ${opt.label}`);
                  }}
                  className={`py-2 px-1 rounded-lg text-xs font-medium text-center transition-all cursor-pointer ${
                    settings.autoLockTimeout === opt.value
                      ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                      : 'bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Background Lock */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50/70 dark:bg-neutral-950/40 border border-neutral-200/60 dark:border-neutral-800/60">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-100/70 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400 mt-0.5">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  Background Lock
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Lock application when minimized or switching to other apps.
                </p>
              </div>
            </div>

            <button
              type="button"
              id="app-lock-bg-toggle"
              role="switch"
              aria-checked={settings.lockOnBackground}
              onClick={() => {
                updateSettings({ lockOnBackground: !settings.lockOnBackground });
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                settings.lockOnBackground ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  settings.lockOnBackground ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Screenshot & Task Switcher Privacy */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50/70 dark:bg-neutral-950/40 border border-neutral-200/60 dark:border-neutral-800/60">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100/70 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 mt-0.5">
                <EyeOff className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  Screenshot &amp; Recent Apps Privacy
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Enforces Android FLAG_SECURE window protection on native devices.
                </p>
              </div>
            </div>

            <button
              type="button"
              id="app-lock-screenshot-toggle"
              role="switch"
              aria-checked={settings.preventScreenshots}
              onClick={() => {
                updateSettings({ preventScreenshots: !settings.preventScreenshots });
                onToast?.('info', 'Screen Privacy', settings.preventScreenshots ? 'FLAG_SECURE disabled' : 'FLAG_SECURE enabled');
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                settings.preventScreenshots ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  settings.preventScreenshots ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Clipboard Protection */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50/70 dark:bg-neutral-950/40 border border-neutral-200/60 dark:border-neutral-800/60">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mt-0.5">
                <Copy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  Clipboard Auto-Clear
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Automatically clears copied ciphertext from the clipboard after 60s.
                </p>
              </div>
            </div>

            <button
              type="button"
              id="app-lock-clipboard-toggle"
              role="switch"
              aria-checked={settings.clearClipboardOnCopy}
              onClick={() => {
                updateSettings({ clearClipboardOnCopy: !settings.clearClipboardOnCopy });
                onToast?.('info', 'Clipboard Security', settings.clearClipboardOnCopy ? 'Clipboard auto-clear disabled' : 'Clipboard auto-clear enabled (60s)');
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                settings.clearClipboardOnCopy ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  settings.clearClipboardOnCopy ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Lock Now Action */}
          <div className="pt-2 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                Instant Lock
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Lock the application immediately right now.
              </p>
            </div>

            <button
              type="button"
              id="app-lock-now-action-btn"
              onClick={lockNow}
              className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Educational Clarification Banner */}
      <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-800/50 text-neutral-600 dark:text-neutral-400 text-[11px] space-y-1">
        <span className="font-semibold block text-neutral-800 dark:text-neutral-200">
          Security Architecture Boundary
        </span>
        <span>
          App Lock is a local device access barrier that prevents unauthorized visual access to your screen. It is an educational and privacy feature and does not change Caesar cipher algorithm cryptanalysis.
        </span>
      </div>

      {/* PIN Setup / Change / Disable Modal */}
      <PinSetupModal
        isOpen={modalOpen}
        mode={modalMode}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </section>
  );
};
