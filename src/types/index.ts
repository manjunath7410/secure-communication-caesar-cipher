export * from './health';
export * from './navigation';
export * from './auth';
export * from './message';
export * from './bruteForce';

export interface AppConfig {
  appName: string;
  version: string;
  buildPhase: string;
  backendBaseUrl: string;
  debugMode: boolean;
  enableTelemetryMock: boolean;
}

export interface MetricCardData {
  label: string;
  value: string | number;
  change?: string;
  status: 'normal' | 'accent' | 'warning' | 'alert';
  detail: string;
}
