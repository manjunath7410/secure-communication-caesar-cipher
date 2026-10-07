import React from 'react';
import {
  Settings,
  User,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  Radio,
} from 'lucide-react';
import { AppView } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import { usePWA } from '../../hooks/usePWA';
import { useTheme } from '../../context/ThemeContext';
import { Logo } from '../branding/Logo';

interface HeaderProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  onOpenVoice?: () => void;
}

export const TacticalHeader: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onOpenVoice,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { isOnline, isSimulatedOffline, toggleSimulatedOffline } = usePWA();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const getViewTitle = (view: AppView): string => {
    switch (view) {
      case 'home':
      case 'landing':
      case 'dashboard':
        return 'Secure Communication';
      case 'encrypt':
        return 'Encrypt Message';
      case 'decrypt':
        return 'Decrypt Message';
      case 'history':
        return 'Message History';
      case 'learn':
      case 'about':
      case 'security':
        return 'Learn & How it Works';
      case 'bruteforce':
        return 'Brute-Force Demonstration';
      case 'settings':
        return 'Settings';
      case 'login':
        return 'Sign In';
      case 'register':
        return 'Create Account';
      case 'health':
        return 'System Health & Tests';
      case 'report':
        return 'Project Report & Documentation';
      default:
        return 'Secure Communication';
    }
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header
      id="app-header"
      className="h-14 sm:h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 shrink-0 z-30 transition-colors"
    >
      {/* Left: Mobile Title or View Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onViewChange('home')}
          className="flex items-center gap-2 text-left cursor-pointer focus:outline-none"
        >
          {/* We only show the icon on mobile, and icon + wordmark on desktop. Oh wait, the user asked for [Shield Logo] Secure Communication. Let's just use Logo without wordmark and add our own text next to it for mobile. */}
          <div className="md:hidden flex items-center gap-2">
             <Logo size="sm" variant="default" showWordmark={false} id="header-mobile-logo" />
             <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
               Secure Communication
             </h2>
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1" title="Protected" />
          </div>
          <div className="hidden md:block">
            <Logo size="sm" variant="default" showWordmark={true} id="header-desktop-logo" />
          </div>
        </button>

        {/* Desktop View Breadcrumb/Title */}
        <div className="hidden md:flex items-center gap-2 ml-4 border-l border-neutral-200 dark:border-neutral-800 pl-4">
          <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
            {getViewTitle(currentView)}
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
            Educational Tool
          </span>
        </div>
      </div>

      {/* Right: Offline status, Theme Toggle, Mobile Settings/Account */}
      <div className="flex items-center gap-2">
        {/* Offline indicator */}
        {(!isOnline || isSimulatedOffline) && (
          <button
            type="button"
            onClick={toggleSimulatedOffline}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 transition-colors cursor-pointer"
            title="Airgap offline mode active"
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Offline</span>
          </button>
        )}

        {/* Live Voice Copilot Launcher */}
        {onOpenVoice && (
          <button
            type="button"
            onClick={onOpenVoice}
            className="relative p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/60 dark:border-blue-800/60 transition-colors cursor-pointer"
            title="Open Live Voice Copilot (gemini-3.8-live)"
            aria-label="Live Voice Copilot"
          >
            <Radio className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
          </button>
        )}

        {/* Quick Theme Toggle (Desktop Only) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="hidden md:flex p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          aria-label="Toggle light or dark theme"
        >
          {resolvedTheme === 'dark' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </button>

        {/* Settings button (Desktop Only) */}
        <button
          type="button"
          onClick={() => onViewChange('settings')}
          className="hidden md:flex p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Account Button */}
        <button
          type="button"
          onClick={() => onViewChange(isAuthenticated ? 'account' : 'login')}
          className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          aria-label="Account"
        >
          {isAuthenticated && user ? (
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold shadow-sm">
              {user.username.charAt(0).toUpperCase()}
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
               <User className="w-4 h-4" />
            </div>
          )}
        </button>
      </div>
    </header>
  );
};
