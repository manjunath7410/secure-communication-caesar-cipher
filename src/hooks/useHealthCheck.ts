import { useState, useEffect, useCallback } from 'react';
import { SystemHealthReport } from '../types/health';
import { healthService } from '../services/healthService';

export function useHealthCheck(pollIntervalMs: number = 10000) {
  const [report, setReport] = useState<SystemHealthReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const refreshHealth = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await healthService.getHealthReport();
      setReport(data);
      setLastChecked(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown diagnostic error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, pollIntervalMs);
    return () => clearInterval(interval);
  }, [refreshHealth, pollIntervalMs]);

  return { report, isLoading, lastChecked, error, refreshHealth };
}
