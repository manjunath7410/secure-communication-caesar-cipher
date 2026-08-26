import React from 'react';

export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
export type LogoVariant = 'default' | 'monochrome' | 'dark' | 'light' | 'white' | 'accent';

export interface LogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  showWordmark?: boolean;
  showSubtitle?: boolean;
  iconOnly?: boolean;
  className?: string;
  id?: string;
  animated?: boolean;
}

const SIZE_MAP: Record<string, { icon: number; text: string; sub: string; gap: string }> = {
  xs: { icon: 18, text: 'text-xs font-bold', sub: 'text-[9px]', gap: 'gap-1.5' },
  sm: { icon: 24, text: 'text-sm font-bold', sub: 'text-[10px]', gap: 'gap-2' },
  md: { icon: 32, text: 'text-base font-bold', sub: 'text-xs', gap: 'gap-2.5' },
  lg: { icon: 40, text: 'text-lg font-bold', sub: 'text-xs', gap: 'gap-3' },
  xl: { icon: 48, text: 'text-xl font-bold', sub: 'text-sm', gap: 'gap-3.5' },
  '2xl': { icon: 64, text: 'text-2xl font-bold', sub: 'text-sm', gap: 'gap-4' },
};

/**
 * Modern geometric brand logo for "Secure Communication"
 * Abstract geometric symbol representing communication, transformation, encryption, and connection.
 * Constructed from 3 flowing geometric segments with a central connection core.
 */
export const LogoSymbol: React.FC<{
  size?: number;
  variant?: LogoVariant;
  className?: string;
  id?: string;
}> = ({ size = 32, variant = 'default', className = '', id = 'brand-logo-symbol' }) => {
  // Generate unique IDs for SVG gradients to prevent DOM collisions
  const gradId1 = `${id}-g1`;
  const gradId2 = `${id}-g2`;
  const gradIdCore = `${id}-core`;

  // Color configurations based on variant
  const isDefault = variant === 'default';
  const isMonochrome = variant === 'monochrome';
  const isWhite = variant === 'white';
  const isDark = variant === 'dark';
  const isLight = variant === 'light';
  const isAccent = variant === 'accent';

  return (
    <svg
      id={id}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 ${className}`}
      aria-label="Secure Communication logo"
      role="img"
    >
      <defs>
        {/* Primary Arc Gradient (Electric Cobalt to Bright Indigo) */}
        <linearGradient id={gradId1} x1="6" y1="6" x2="42" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="60%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        {/* Secondary Return Arc Gradient (Indigo to Vivid Violet) */}
        <linearGradient id={gradId2} x1="42" y1="20" x2="6" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>

        {/* Core Transformation Node Gradient */}
        <linearGradient id={gradIdCore} x1="20" y1="20" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>

        {/* Accent / Emerald Gradient */}
        <linearGradient id={`${id}-acc`} x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>

      {/* Segment 1: Outer Transmission Wave (Initiation / Message Stream) */}
      <path
        d="M 12 18 C 14 10.5 20.5 6 27.5 6 C 36 6 42.5 12.5 42.5 21 C 42.5 24.5 41.3 27.8 39.2 30.5"
        stroke={
          isMonochrome
            ? 'currentColor'
            : isWhite
            ? '#FFFFFF'
            : isDark
            ? '#0F172A'
            : isLight
            ? '#1E40AF'
            : isAccent
            ? `url(#${id}-acc)`
            : `url(#${gradId1})`
        }
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Segment 2: Base Transformation Arc (Shift / Cryptographic Circle Return) */}
      <path
        d="M 36.5 35.5 C 33.5 39.5 28.8 42 23.5 42 C 14 42 6 34 6 24 C 6 20.5 7.2 17.2 9.3 14.5"
        stroke={
          isMonochrome
            ? 'currentColor'
            : isWhite
            ? '#FFFFFF'
            : isDark
            ? '#0F172A'
            : isLight
            ? '#1E40AF'
            : isAccent
            ? `url(#${id}-acc)`
            : `url(#${gradId2})`
        }
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Segment 3: Inner Orbital Key Bridge (Encryption convergence) */}
      <path
        d="M 23 16 A 8 8 0 0 1 31 24"
        stroke={
          isMonochrome
            ? 'currentColor'
            : isWhite
            ? 'rgba(255,255,255,0.7)'
            : isDark
            ? 'rgba(15,23,42,0.6)'
            : isLight
            ? '#3B82F6'
            : isAccent
            ? '#34D399'
            : '#38BDF8'
        }
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Core Node: Central Secure Connection Nucleus (Focal Point of Intelligence) */}
      <circle
        cx="23.5"
        cy="24"
        r="3.5"
        fill={
          isMonochrome
            ? 'currentColor'
            : isWhite
            ? '#FFFFFF'
            : isDark
            ? '#0F172A'
            : isLight
            ? '#2563EB'
            : isAccent
            ? '#10B981'
            : `url(#${gradIdCore})`
        }
      />
    </svg>
  );
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'default',
  showWordmark = false,
  showSubtitle = false,
  iconOnly,
  className = '',
  id = 'brand-logo',
}) => {
  const isNumericSize = typeof size === 'number';
  const sizeKey = isNumericSize ? 'md' : (size as string);
  const sizeConfig = SIZE_MAP[sizeKey] || SIZE_MAP.md;
  const iconPixelSize = isNumericSize ? (size as number) : sizeConfig.icon;

  const shouldShowWordmark = iconOnly !== undefined ? !iconOnly : showWordmark;

  return (
    <div
      id={id}
      className={`inline-flex items-center ${sizeConfig.gap} select-none ${className}`}
    >
      <LogoSymbol size={iconPixelSize} variant={variant} id={`${id}-symbol`} />

      {shouldShowWordmark && (
        <div className="flex flex-col min-w-0 leading-tight">
          <span
            className={`${sizeConfig.text} tracking-tight text-neutral-900 dark:text-neutral-100 font-semibold truncate`}
          >
            Secure Communication
          </span>
          {showSubtitle && (
            <span
              className={`${sizeConfig.sub} text-neutral-500 dark:text-neutral-400 font-normal tracking-normal truncate`}
            >
              Caesar Cipher Educational Tool
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
