import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const GreenPayLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const sizeMap = {
    sm: { icon: 28, text: 'text-lg', sub: 'text-[9px]' },
    md: { icon: 38, text: 'text-xl', sub: 'text-[10px]' },
    lg: { icon: 52, text: 'text-3xl', sub: 'text-xs' },
  };

  const { icon, text, sub } = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Civic-Tech Circular Shield + Recycling Arrows + Currency Leaf Icon */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm transition-transform hover:scale-105 duration-300"
      >
        <defs>
          <linearGradient id="gpGradOuter" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0F382A" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>
          <linearGradient id="gpGradInner" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
        </defs>

        {/* Outer Circular Eco-Shield */}
        <circle cx="50" cy="50" r="46" fill="url(#gpGradOuter)" stroke="#10B981" strokeWidth="2.5" />

        {/* Circular Recycling Arc Track */}
        <path
          d="M 28 32 A 30 30 0 0 1 78 36"
          stroke="#34D399"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray="6 4"
        />
        <path
          d="M 72 68 A 30 30 0 0 1 22 64"
          stroke="#34D399"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray="6 4"
        />

        {/* Central Currency Leaf Symbol (combining rupee curve with sustainable leaf) */}
        <path
          d="M 40 34 L 62 34 M 40 44 L 58 44 M 40 34 L 40 66 C 40 66 48 68 56 60 C 64 52 64 42 40 42"
          stroke="#FFFFFF"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 52 56 L 64 68"
          stroke="#FFFFFF"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Small Golden Reward Sparkle */}
        <circle cx="68" cy="30" r="4.5" fill="#FBBF24" />
      </svg>

      {showText && (
        <div className="flex flex-col text-left leading-none">
          <span className={`font-bold tracking-tight text-emerald-950 dark:text-emerald-50 ${text}`}>
            GREEN<span className="text-emerald-600">PAY</span>
          </span>
          <span className={`hidden sm:inline-block font-medium tracking-wider text-emerald-700 uppercase ${sub}`}>
            Bengaluru Civic-Tech
          </span>
        </div>
      )}
    </div>
  );
};
