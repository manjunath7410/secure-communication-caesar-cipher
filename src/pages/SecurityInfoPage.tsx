import React from 'react';
import { LearnPage } from './LearnPage';
import { AppView } from '../types/navigation';

interface SecurityInfoPageProps {
  onNavigate: (view: AppView) => void;
  onToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
}

export const SecurityInfoPage: React.FC<SecurityInfoPageProps> = ({ onNavigate, onToast }) => {
  return <LearnPage onNavigate={onNavigate} onToast={onToast} />;
};
