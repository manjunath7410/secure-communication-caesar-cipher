import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatMetricCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'olive' | 'emerald' | 'amber' | 'neutral';
  badgeText?: string;
  className?: string;
}

export const StatMetricCard: React.FC<StatMetricCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'olive',
  badgeText,
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return {
          border: 'border-emerald-200 dark:border-emerald-800/40',
          text: 'text-emerald-700 dark:text-emerald-400',
          iconBg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
          badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
        };
      case 'amber':
        return {
          border: 'border-amber-200 dark:border-amber-800/40',
          text: 'text-amber-700 dark:text-amber-400',
          iconBg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
          badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
        };
      case 'neutral':
        return {
          border: 'border-neutral-200 dark:border-neutral-800',
          text: 'text-neutral-800 dark:text-neutral-200',
          iconBg: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
          badge: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700',
        };
      case 'olive':
      default:
        return {
          border: 'border-neutral-200 dark:border-neutral-800',
          text: 'text-blue-600 dark:text-blue-400',
          iconBg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
          badge: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      id={id}
      className={`p-4 sm:p-5 bg-white dark:bg-neutral-900 border ${styles.border} rounded-2xl flex flex-col justify-between space-y-3 transition-colors shadow-xs hover:shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          {title}
        </span>
        <div className={`p-2 rounded-xl ${styles.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${styles.text}`}>
          {value}
        </span>
        {badgeText && (
          <span className={`text-[10px] px-2 py-0.5 border font-semibold uppercase rounded-md ${styles.badge}`}>
            {badgeText}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-800 pt-2 font-sans">
          {subtitle}
        </p>
      )}
    </div>
  );
};
