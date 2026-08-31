import React from 'react';
import {
  Settings,
  User,
  Wifi,
  WifiOff,
  Sun,
  Moon,
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
}

export const TacticalHeader: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
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
      case 'map':
        return 'Relay Station Map';
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
          className="md:hidden flex items-center gap-2 text-left cursor-pointer focus:outline-none"
        >
          <Logo size="sm" variant="default" showWordmark={true} id="header-mobile-logo" />
        </button>

        {/* Desktop View Breadcrumb/Title */}
        <div className="hidden md:flex items-center gap-2">
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

        {/* Quick Theme Toggle (Mobile) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="md:hidden p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          aria-label="Toggle light or dark theme"
        >
          {resolvedTheme === 'dark' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </button>

        {/* Settings button (Mobile) */}
        <button
          type="button"
          onClick={() => onViewChange('settings')}
          className="md:hidden p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Account Button (Mobile) */}
        <button
          type="button"
          onClick={() => onViewChange(isAuthenticated ? 'account' : 'login')}
          className="md:hidden p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          aria-label="Account"
        >
          {isAuthenticated && user ? (
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
              {user.username.charAt(0).toUpperCase()}
            </div>
          ) : (
            <User className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
};
