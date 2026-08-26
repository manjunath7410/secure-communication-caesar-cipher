/**
 * PWA & Service Worker Management Service
 * Phase 9: Progressive Web App, Offline Shell & Installability
 */

export interface PWAState {
  isSupported: boolean;
  isRegistered: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  effectiveOnline: boolean;
  registration: ServiceWorkerRegistration | null;
}

type PWAChangeListener = (state: PWAState) => void;

class PWAManager {
  private deferredPrompt: any = null;
  private listeners: Set<PWAChangeListener> = new Set();
  private registration: ServiceWorkerRegistration | null = null;
  private isSimulatedOffline: boolean = false;

  private state: PWAState = {
    isSupported: typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    isRegistered: false,
    isInstallable: false,
    isInstalled: false,
    isOnline: typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true,
    isSimulatedOffline: false,
    effectiveOnline: typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true,
    registration: null,
  };

  constructor() {
    if (typeof window === 'undefined') return;

    // Check if running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    this.state.isInstalled = isStandalone;

    // Listen to network status changes
    window.addEventListener('online', this.handleNetworkChange);
    window.addEventListener('offline', this.handleNetworkChange);

    // Listen to PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.state.isInstallable = true;
      this.notifyListeners();
    });

    // Listen to App Installed event
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.state.isInstallable = false;
      this.state.isInstalled = true;
      this.notifyListeners();
    });
  }

  private handleNetworkChange = () => {
    this.state.isOnline = navigator.onLine;
    this.state.effectiveOnline = this.state.isOnline && !this.isSimulatedOffline;
    this.notifyListeners();
  };

  public subscribe(listener: PWAChangeListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const currentState = this.getState();
    this.listeners.forEach((l) => l(currentState));
  }

  public getState(): PWAState {
    return {
      ...this.state,
      effectiveOnline: this.state.isOnline && !this.isSimulatedOffline,
    };
  }

  /**
   * Register the Service Worker in production/preview
   */
  public async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.state.isSupported) {
      return null;
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      this.registration = reg;
      this.state.isRegistered = true;
      this.state.registration = reg;
      this.notifyListeners();
      return reg;
    } catch (err) {
      console.warn('PWA: ServiceWorker registration skipped/failed:', err);
      return null;
    }
  }

  /**
   * Prompt user to install the PWA
   */
  public async promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!this.deferredPrompt) {
      return 'unavailable';
    }

    try {
      await this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      this.state.isInstallable = false;
      this.notifyListeners();
      return choice.outcome === 'accepted' ? 'accepted' : 'dismissed';
    } catch (err) {
      console.error('PWA: Prompt error', err);
      return 'unavailable';
    }
  }

  /**
   * Toggle Simulated Offline / Airgap Mode for instant offline testing
   */
  public setSimulatedOffline(simulated: boolean) {
    this.isSimulatedOffline = simulated;
    this.state.isSimulatedOffline = simulated;
    this.state.effectiveOnline = this.state.isOnline && !simulated;
    this.notifyListeners();
  }

  /**
   * Query status of offline Cache Storage
   */
  public async getCacheStatus(): Promise<{
    hasCache: boolean;
    cachedKeys: string[];
  }> {
    if (typeof window === 'undefined' || !('caches' in window)) {
      return { hasCache: false, cachedKeys: [] };
    }
    try {
      const keys = await window.caches.keys();
      return {
        hasCache: keys.length > 0,
        cachedKeys: keys,
      };
    } catch {
      return { hasCache: false, cachedKeys: [] };
    }
  }
}

export const pwaManager = new PWAManager();
