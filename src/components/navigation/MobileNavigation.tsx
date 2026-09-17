import React, { useState } from 'react';
import {
  Home,
  Lock,
  Unlock,
  History,
  MapPin,
  BookOpen,
  Menu,
  Settings,
  User,
  Shield,
  Cpu,
  X,
  Radio,
} from 'lucide-react';
import { AppView } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';

interface MobileNavigationProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onOpenVoice?: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentView,
  onViewChange,
  onOpenVoice,
}) => {
  const [showMore, setShowMore] = useState(false);
  const { isAuthenticated } = useAuth();

  const navItems: { id: AppView | 'more'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'encrypt', label: 'Encrypt', icon: Lock },
    { id: 'decrypt', label: 'Decrypt', icon: Unlock },
    { id: 'history', label: 'History', icon: History },
    { id: 'more', label: 'More', icon: Menu },
  ];

  const moreItems: { id: AppView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'bruteforce', label: 'Brute Force', icon: Cpu },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'map', label: 'Relay Map', icon: MapPin },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: isAuthenticated ? 'account' : 'login', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const isItemActive = (id: AppView | 'more') => {
    if (id === 'more') return showMore;
    if (id === 'home') {
      return currentView === 'home' || currentView === 'landing' || currentView === 'dashboard';
    }
    return currentView === id;
  };

  const handleNavClick = (id: AppView | 'more') => {
    if (id === 'more') {
      setShowMore(true);
    } else {
      setShowMore(false);
      onViewChange(id as AppView);
    }
  };

  const handleMoreItemClick = (id: AppView) => {
    setShowMore(false);
    onViewChange(id);
  };

  return (
    <>
      {/* More Menu Bottom Sheet Overlay */}
      {showMore && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More Menu Bottom Sheet */}
      <div 
        className={`md:hidden fixed bottom-16 left-0 right-0 z-40 bg-white dark:bg-neutral-900 rounded-t-2xl shadow-xl border-t border-neutral-200 dark:border-neutral-800 transition-transform duration-250 ease-out transform ${showMore ? 'translate-y-0' : 'translate-y-full opacity-0 pointer-events-none'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">More Options</h3>
          <button 
            type="button" 
            onClick={() => setShowMore(false)}
            className="p-1 rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-2 grid grid-cols-3 gap-2 pb-safe">
          {onOpenVoice && (
            <button
              type="button"
              onClick={() => {
                setShowMore(false);
                onOpenVoice();
              }}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 active:scale-95 transition-all text-blue-700 dark:text-blue-300 gap-1.5 cursor-pointer"
            >
              <div className="relative w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Radio className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[11px] font-bold text-center">Voice Copilot</span>
            </button>
          )}
          {moreItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleMoreItemClick(item.id)}
                className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 active:scale-95 transition-all text-neutral-700 dark:text-neutral-300 gap-1.5"
              >
                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-center">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 safe-bottom transition-colors"
        aria-label="Mobile Bottom Navigation"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.id);
            return (
              <button
                key={item.id}
                type="button"
                id={`mobile-nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full min-w-0 py-1 transition-colors cursor-pointer relative ${
                  active
                    ? 'text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {active && (
                  <div className="absolute top-1 w-10 h-1 rounded-full bg-blue-100 dark:bg-blue-900/30" />
                )}
                <Icon className={`w-5 h-5 mb-1 z-10 ${active ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
                <span className="text-[10px] truncate tracking-tight z-10">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
