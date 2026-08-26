/**
 * @file useCapacitor.ts
 * @description React hook for initializing Android Capacitor bridge and registering back navigation.
 */

import { useEffect, useRef } from 'react';
import { CapacitorService } from '../services/capacitorService';
import { AppView } from '../types/navigation';

export function useCapacitor(
  currentView: AppView,
  onNavigate: (view: AppView) => void,
  onToast?: (type: 'info' | 'warning', title: string, message?: string) => void
) {
  const currentViewRef = useRef<AppView>(currentView);

  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  useEffect(() => {
    // 1. Initialize Capacitor native properties (Status bar, Splash screen, Keyboard)
    CapacitorService.init();

    // 2. Register Android hardware Back button listener
    const cleanup = CapacitorService.registerBackButton(
      () => currentViewRef.current,
      onNavigate,
      onToast
    );

    return () => {
      cleanup();
    };
  }, [onNavigate, onToast]);
}
