import React from 'react';
import { HomePage } from './HomePage';
import { AppView } from '../types/navigation';

interface DashboardPageProps {
  onNavigate: (view: AppView) => void;
  onToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onToast }) => {
  return <HomePage onNavigate={onNavigate} onToast={onToast} />;
};
