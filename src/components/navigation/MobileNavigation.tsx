import React from 'react';
import {
  Home,
  Lock,
  Unlock,
  History,
  BookOpen,
} from 'lucide-react';
import { AppView } from '../../types/navigation';

interface MobileNavigationProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentView,
  onViewChange,
}) => {
  const navItems: { id: AppView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'encrypt', label: 'Encrypt', icon: Lock },
    { id: 'decrypt', label: 'Decrypt', icon: Unlock },
    { id: 'history', label: 'History', icon: History },
    { id: 'learn', label: 'Learn', icon: BookOpen },
  ];

  const isItemActive = (id: AppView) => {
    if (id === 'home') {
      return currentView === 'home' || currentView === 'landing' || currentView === 'dashboard';
    }
    if (id === 'learn') {
      return currentView === 'learn' || currentView === 'bruteforce' || currentView === 'about' || currentView === 'security';
    }
    return currentView === id;
  };

  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 safe-bottom transition-colors"
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
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-0 py-1 transition-colors cursor-pointer ${
                active
                  ? 'text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${active ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
              <span className="text-[11px] truncate tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
