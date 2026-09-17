import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'emerald' | 'amber' | 'rose' | 'sky' | 'purple' | 'neutral';
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'emerald',
  size = 'sm',
  dot = false,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    xs: 'text-[10px] px-2 py-0.5 rounded-full gap-1',
    sm: 'text-xs px-2.5 py-0.5 rounded-full gap-1.5',
    md: 'text-xs px-3 py-1 rounded-full gap-1.5 font-bold',
  };

  const variantStyles = {
    emerald: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
    amber: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    rose: 'bg-rose-50 text-rose-800 border border-rose-200/80',
    sky: 'bg-sky-50 text-sky-800 border border-sky-200/80',
    purple: 'bg-purple-50 text-purple-800 border border-purple-200/80',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200/80',
  };

  const dotStyles = {
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-600',
    rose: 'bg-rose-600',
    sky: 'bg-sky-600',
    purple: 'bg-purple-600',
    neutral: 'bg-slate-500',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold tracking-wide select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]} shrink-0`} />}
      <span>{children}</span>
    </span>
  );
};
