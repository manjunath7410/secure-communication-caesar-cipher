import React from 'react';
import { LearnPage } from './LearnPage';
import { AppView } from '../types/navigation';

interface AboutPageProps {
  onNavigate: (view: AppView) => void;
  onToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate, onToast }) => {
  return <LearnPage onNavigate={onNavigate} onToast={onToast} />;
};
