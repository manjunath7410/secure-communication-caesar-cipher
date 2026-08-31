export type AppView =
  | 'home'
  | 'landing'
  | 'encrypt'
  | 'decrypt'
  | 'history'
  | 'map'
  | 'learn'
  | 'settings'
  | 'account'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'bruteforce'
  | 'about'
  | 'security'
  | 'health'
  | 'architecture';

export interface NavItem {
  id: AppView;
  label: string;
  shortLabel?: string;
  icon: string;
  description: string;
  badge?: string;
}

export interface UserSettings {
  defaultShift: number;
  autoUppercase: boolean;
  preserveWhitespace: boolean;
  highContrastMonospace: boolean;
  soundFeedback: boolean;
  livePreview: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
  timestamp: number;
}
