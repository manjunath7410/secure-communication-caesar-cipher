export interface SubsystemStatus {
  name: string;
  key: string;
  status: 'operational' | 'ready' | 'pending_phase' | 'degraded';
  description: string;
  phaseIntroduced: string;
}

export interface SystemHealthReport {
  status: 'healthy' | 'operational' | 'degraded';
  version: string;
  timestamp: string;
  clientTime: string;
  environment: string;
  isEducational: boolean;
  academicNotice: string;
  subsystems: SubsystemStatus[];
  runtimeInfo: {
    frontendStack: string;
    backendStack: string;
    targetDatabase: string;
    securityScope: string;
  };
}

export interface RoadmapPhaseInfo {
  id: string;
  code: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  category: 'Foundation' | 'Crypto Core' | 'User Interface' | 'Security & Auth' | 'Integration' | 'Platform';
}

export type HealthFilter = 'all' | 'operational' | 'pending_phase';
