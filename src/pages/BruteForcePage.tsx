import React from 'react';
import { LearnPage } from './LearnPage';
import { AppView } from '../types/navigation';

interface BruteForcePageProps {
  onNavigate: (view: AppView) => void;
  onToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
}

export const BruteForcePage: React.FC<BruteForcePageProps> = ({ onNavigate, onToast }) => {
  return <LearnPage onNavigate={onNavigate} onToast={onToast} />;
};
