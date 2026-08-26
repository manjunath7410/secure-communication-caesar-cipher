/**
 * @file capacitorService.ts
 * @description Capacitor native Android initialization and hardware event handling.
 * Manages status bar styling, splash screen dismissal, back-button hardware triggers,
 * and keyboard positioning on Android mobile viewports.
 */

import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { AppView } from '../types/navigation';

export interface CapacitorInitOptions {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onExitConfirm?: () => void;
}

export class CapacitorService {
  private static isInitialized = false;
  private static backButtonListener: any = null;

  /**
   * Checks if the app is running in native Android or iOS via Capacitor.
   */
  public static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Returns current platform ('android', 'ios', 'web').
   */
  public static getPlatform(): string {
    return Capacitor.getPlatform();
  }

  /**
   * Initialize native device plugins, splash screen, and status bar.
   */
  public static async init(): Promise<void> {
    if (!this.isNative()) {
      return;
    }

    try {
      // 1. Status Bar Dark Theme Configuration
      if (Capacitor.isPluginAvailable('StatusBar')) {
        await StatusBar.setStyle({ style: Style.Dark });
        if (Capacitor.getPlatform() === 'android') {
          await StatusBar.setBackgroundColor({ color: '#0F110C' });
          await StatusBar.setOverlaysWebView({ overlay: false });
        }
      }
    } catch {
      // Ignore if status bar is unavailable
    }

    try {
      // 2. Hide Splash Screen cleanly after rendering
      if (Capacitor.isPluginAvailable('SplashScreen')) {
        await SplashScreen.hide({
          fadeOutDuration: 400,
        });
      }
    } catch {
      // Ignore splash screen error
    }

    try {
      // 3. Configure Android Keyboard behavior
      if (Capacitor.isPluginAvailable('Keyboard')) {
        await Keyboard.setAccessoryBarVisible({ isVisible: true });
        await Keyboard.setScroll({ isDisabled: false });
      }
    } catch {
      // Ignore keyboard configuration error
    }

    this.isInitialized = true;
  }

  /**
   * Registers Android Hardware Back Button listener.
   */
  public static registerBackButton(
    getCurrentView: () => AppView,
    onNavigate: (view: AppView) => void,
    onToast?: (type: 'info' | 'warning', title: string, message?: string) => void
  ): () => void {
    if (!this.isNative() || !Capacitor.isPluginAvailable('App')) {
      return () => {};
    }

    let lastBackPressTime = 0;

    // Remove existing listener if any
    if (this.backButtonListener) {
      this.backButtonListener.remove();
    }

    const listenerPromise = CapApp.addListener('backButton', ({ canGoBack }) => {
      const activeView = getCurrentView();

      // If user is on a secondary/tool page, back button returns them to the dashboard
      if (activeView !== 'dashboard' && activeView !== 'landing') {
        onNavigate('dashboard');
        return;
      }

      // If on dashboard, navigate to landing first if desired, or handle exit
      if (activeView === 'dashboard') {
        const now = Date.now();
        if (now - lastBackPressTime < 2500) {
          CapApp.exitApp();
        } else {
          lastBackPressTime = now;
          if (onToast) {
            onToast('info', 'Exit Application', 'Press back again within 2 seconds to exit.');
          }
        }
        return;
      }

      // If on landing, double tap back exits
      if (activeView === 'landing') {
        const now = Date.now();
        if (now - lastBackPressTime < 2500) {
          CapApp.exitApp();
        } else {
          lastBackPressTime = now;
          if (onToast) {
            onToast('info', 'Exit Application', 'Press back again to exit.');
          }
        }
      }
    });

    listenerPromise.then((handle) => {
      this.backButtonListener = handle;
    });

    return () => {
      if (this.backButtonListener) {
        this.backButtonListener.remove();
        this.backButtonListener = null;
      }
    };
  }
}
