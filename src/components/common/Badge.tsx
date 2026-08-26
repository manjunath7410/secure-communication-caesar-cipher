import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'accent' | 'warning' | 'muted' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'sm',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-3 py-1 text-xs';

  const variantClasses = {
    primary: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800/50',
    accent: 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
    warning: 'bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
    muted: 'bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400',
    outline: 'border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300',
  }[variant];

  return (
    <span
      className={`inline-flex items-center uppercase tracking-wider rounded-md ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};
