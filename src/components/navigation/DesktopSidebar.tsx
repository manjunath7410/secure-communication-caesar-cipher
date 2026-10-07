import React from 'react';
import {
  Home,
  Lock,
  Unlock,
  History,
  BookOpen,
  Settings,
  User,
  Sun,
  Moon,
  Laptop,
  LogOut,
  Radio,
  FileText,
} from 'lucide-react';
import { AppView } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { Logo } from '../branding/Logo';

interface DesktopSidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onOpenVoice?: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentView,
  onViewChange,
  onOpenVoice,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const primaryItems: { id: AppView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'encrypt', label: 'Encrypt', icon: Lock },
    { id: 'decrypt', label: 'Decrypt', icon: Unlock },
    { id: 'history', label: 'History', icon: History },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'report', label: 'Project Report', icon: FileText },
  ];

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const isItemActive = (id: AppView) => {
    if (id === 'home') {
      return currentView === 'home' || currentView === 'landing' || currentView === 'dashboard';
    }
    if (id === 'learn') {
      return currentView === 'learn' || currentView === 'bruteforce' || currentView === 'about' || currentView === 'security';
    }
    if (id === 'account') {
      return currentView === 'account' || currentView === 'login' || currentView === 'register';
    }
    return currentView === id;
  };

  return (
    <aside
      id="desktop-sidebar"
      className="hidden md:flex flex-col w-60 lg:w-64 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 h-full select-none shrink-0 transition-colors"
    >
      {/* Brand Header */}
      <div className="p-4 lg:p-5 pb-4 border-b border-neutral-100 dark:border-neutral-900">
        <button
          type="button"
          onClick={() => onViewChange('home')}
          className="flex items-center gap-3 text-left group w-full cursor-pointer focus:outline-none"
        >
          <Logo size="md" variant="default" showWordmark={true} showSubtitle={true} id="sidebar-brand-logo" />
        </button>
      </div>

      {/* Primary Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main Navigation">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.id);
          return (
            <button
              key={item.id}
              type="button"
              id={`sidebar-nav-${item.id}`}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                active
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-500 dark:text-neutral-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {onOpenVoice && (
          <div className="pt-2">
            <button
              type="button"
              id="sidebar-nav-voice"
              onClick={onOpenVoice}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600/10 to-indigo-600/10 hover:from-blue-600/20 hover:to-indigo-600/20 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Radio className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <span>Voice Copilot</span>
              </div>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold">
                Live
              </span>
            </button>
          </div>
        )}
      </nav>

      {/* Footer Area: Theme Toggle, Settings & Account */}
      <div className="p-3 border-t border-neutral-100 dark:border-neutral-900 space-y-1">
        {/* Settings Button */}
        <button
          type="button"
          id="sidebar-nav-settings"
          onClick={() => onViewChange('settings')}
          className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
            currentView === 'settings' || currentView === 'health'
              ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <Settings className="w-4 h-4 text-neutral-500" />
          <span>Settings</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          id="sidebar-theme-toggle"
          onClick={cycleTheme}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            {resolvedTheme === 'dark' ? (
              <Moon className="w-4 h-4 text-neutral-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <span className="capitalize">{theme} mode</span>
          </div>
          <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
            {theme === 'system' ? 'Auto' : theme}
          </span>
        </button>

        {/* Account / User Section */}
        <div className="pt-2">
          {isAuthenticated && user ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {user.username}
                  </p>
                  <p className="text-[10px] text-neutral-500 truncate">
                    {user.clearanceLevel || 'Operator'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              id="sidebar-nav-account"
              onClick={() => onViewChange('login')}
              className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isItemActive('account')
                  ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <User className="w-4 h-4 text-neutral-500" />
              <span>Account</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
