import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-xs',
    lg: 'px-7 py-3.5 text-sm',
  }[size];

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs',
    secondary: 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700',
    outline: 'bg-transparent border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40',
    ghost: 'bg-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800',
  }[variant];

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  accentBorder?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  accentBorder = false,
}) => {
  return (
    <div
      className={`bg-white dark:bg-neutral-900 border ${
        accentBorder
          ? 'border-l-4 border-l-blue-600 border-neutral-200 dark:border-neutral-800'
          : 'border-neutral-200 dark:border-neutral-800'
      } p-5 rounded-2xl shadow-xs transition-colors ${className}`}
    >
      {title && (
        <div className="mb-3">
          <h3 className="text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold">{title}</h3>
          {subtitle && <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};
