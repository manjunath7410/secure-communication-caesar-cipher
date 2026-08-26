/**
 * Hook for PWA lifecycle, installability, and network/airgap status
 */

import { useState, useEffect } from 'react';
import { pwaManager, PWAState } from '../services/pwaService';

export function usePWA() {
  const [state, setState] = useState<PWAState>(() => pwaManager.getState());

  useEffect(() => {
    // Automatically attempt SW registration on mount
    pwaManager.register();

    const unsubscribe = pwaManager.subscribe((nextState) => {
      setState(nextState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const installApp = async () => {
    return await pwaManager.promptInstall();
  };

  const toggleSimulatedOffline = (simulate?: boolean) => {
    const nextVal = typeof simulate === 'boolean' ? simulate : !state.isSimulatedOffline;
    pwaManager.setSimulatedOffline(nextVal);
  };

  return {
    ...state,
    isOnline: state.effectiveOnline,
    rawOnline: state.isOnline,
    installApp,
    toggleSimulatedOffline,
  };
}
