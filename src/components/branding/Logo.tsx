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
  const gradIdShield = `${id}-shield`;
  const gradIdShieldRight = `${id}-shield-right`;
  const gradIdSilver = `${id}-silver`;
  const gradIdGlow = `${id}-glow`;

  const isMonochrome = variant === 'monochrome';
  const isWhite = variant === 'white';
  const isDark = variant === 'dark';
  const isLight = variant === 'light';
  const isAccent = variant === 'accent';
  const isDefault = variant === 'default';

  let shieldFill = `url(#${gradIdShield})`;
  let wheelStroke = `url(#${gradIdSilver})`;
  let lockFill = `url(#${gradIdGlow})`;

  if (!isDefault) {
    shieldFill = isWhite ? 'rgba(255,255,255,0.15)' : 
                 isDark ? 'rgba(15,23,42,0.15)' : 
                 isLight ? 'rgba(30,58,138,0.15)' : 
                 isAccent ? 'rgba(16,185,129,0.15)' :
                 'currentColor';
                 
    wheelStroke = isWhite ? 'rgba(255,255,255,0.7)' : 
                  isDark ? 'rgba(15,23,42,0.7)' : 
                  isLight ? 'rgba(30,58,138,0.7)' : 
                  isAccent ? 'rgba(16,185,129,0.7)' :
                  'currentColor';
                  
    lockFill = isWhite ? '#FFFFFF' : 
               isDark ? '#0F172A' : 
               isLight ? '#1E3A8A' : 
               isAccent ? '#10B981' :
               'currentColor';
  }

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
        {/* Left Shield Half (Darker Indigo) */}
        <linearGradient id={gradIdShield} x1="8" y1="4" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#312E81" />
        </linearGradient>

        {/* Right Shield Half (Vibrant Blue) */}
        <linearGradient id={gradIdShieldRight} x1="24" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>

        {/* Silver Cipher Wheel Accents */}
        <linearGradient id={gradIdSilver} x1="11" y1="11" x2="37" y2="37" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>

        {/* Cyan Lock Glow */}
        <linearGradient id={gradIdGlow} x1="18" y1="18" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>

      {/* Background Shield - Full (For outlines in monochrome, or full solid in simple colored variants) */}
      {!isDefault && (
        <path
          d="M 24 4 L 8 10 L 8 22 C 8 33 15 40 24 44 C 33 40 40 33 40 22 L 40 10 Z"
          fill={isMonochrome ? 'none' : shieldFill}
          stroke={isMonochrome ? 'currentColor' : 'none'}
          strokeWidth={isMonochrome ? 2.5 : 0}
          strokeLinejoin="round"
        />
      )}

      {/* Background Shield - Split Halves (For default vibrant gradient fold effect) */}
      {isDefault && (
        <>
          <path
            d="M 24 4 L 8 10 L 8 22 C 8 33 15 40 24 44 Z"
            fill={`url(#${gradIdShield})`}
          />
          <path
            d="M 24 4 L 40 10 L 40 22 C 40 33 33 40 24 44 Z"
            fill={`url(#${gradIdShieldRight})`}
          />
        </>
      )}

      {/* Cipher Wheels */}
      <circle 
        cx="24" cy="24" r="13" 
        stroke={wheelStroke} 
        strokeWidth="1.5" 
        fill="none" 
        strokeDasharray="4 4" 
      />
      <circle 
        cx="24" cy="24" r="9.5" 
        stroke={wheelStroke} 
        strokeWidth="2.5" 
        fill="none" 
        strokeDasharray="14 3" 
      />

      {/* Center Lock */}
      <path
        d="M 24 18 A 4 4 0 0 0 20 22 L 20 23 A 2 2 0 0 0 18 25 L 18 29 A 2 2 0 0 0 20 31 L 28 31 A 2 2 0 0 0 30 29 L 30 25 A 2 2 0 0 0 28 23 L 28 22 A 4 4 0 0 0 24 18 Z M 24 20.5 A 1.5 1.5 0 0 1 25.5 22 L 25.5 23 L 22.5 23 L 22.5 22 A 1.5 1.5 0 0 1 24 20.5 Z"
        fill={lockFill}
        fillRule="evenodd"
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
