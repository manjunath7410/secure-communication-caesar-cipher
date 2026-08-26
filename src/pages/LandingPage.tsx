import React from 'react';
import { HomePage } from './HomePage';
import { AppView } from '../types/navigation';

interface LandingPageProps {
  onNavigate: (view: AppView) => void;
  onToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onToast }) => {
  return <HomePage onNavigate={onNavigate} onToast={onToast} />;
};
