/**
 * @file useOperationsLog.ts
 * @description React hook for subscribing to real-time operations stats, activities, and current shift.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getOperationStats,
  getRecentActivities,
  getSelectedShift,
  setSelectedShift as storeSetSelectedShift,
  logOperation as storeLogOperation,
  clearActivityLog as storeClearActivityLog,
  resetToDemoActivity as storeResetToDemo,
  subscribeToOperations,
  OperationStats,
  OperationActivity,
  OperationType,
} from '../services/activityStore';

export function useOperationsLog() {
  const [stats, setStats] = useState<OperationStats>(getOperationStats);
  const [activities, setActivities] = useState<OperationActivity[]>(getRecentActivities);
  const [currentShift, setCurrentShiftState] = useState<number>(getSelectedShift);

  useEffect(() => {
    // Initial sync
    setStats(getOperationStats());
    setActivities(getRecentActivities());
    setCurrentShiftState(getSelectedShift());

    // Subscribe to store updates
    const unsubscribe = subscribeToOperations(() => {
      setStats(getOperationStats());
      setActivities(getRecentActivities());
      setCurrentShiftState(getSelectedShift());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const setCurrentShift = useCallback((shift: number) => {
    storeSetSelectedShift(shift);
    setCurrentShiftState(((shift % 26) + 26) % 26);
  }, []);

  const logOp = useCallback(
    (type: OperationType, shift: number, input: string, output: string, notes?: string) => {
      return storeLogOperation(type, shift, input, output, notes);
    },
    []
  );

  const clearLog = useCallback(() => {
    storeClearActivityLog();
  }, []);

  const resetToDemo = useCallback(() => {
    storeResetToDemo();
  }, []);

  return {
    stats,
    activities,
    currentShift,
    setCurrentShift,
    logOperation: logOp,
    clearLog,
    resetToDemo,
  };
}
