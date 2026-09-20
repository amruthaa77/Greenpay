import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'sky' | 'purple' | 'slate';
  trend?: {
    value: number | string;
    isPositive?: boolean;
    label?: string;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'emerald',
  trend,
  className = '',
}) => {
  const iconBgStyles = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    amber: 'bg-amber-50 text-amber-800 border-amber-200/80',
    sky: 'bg-sky-50 text-sky-800 border-sky-200/80',
    purple: 'bg-purple-50 text-purple-800 border-purple-200/80',
    slate: 'bg-slate-100 text-slate-800 border-slate-200/80',
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 min-w-0 ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate">
              {value}
            </h3>
          </div>
        </div>

        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border shrink-0 ${iconBgStyles[variant]}`}
        >
          {icon}
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-500 dark:text-slate-400 font-medium truncate">{subtitle}</span>}
          {trend && (
            <span
              className={`inline-flex items-center gap-1 font-bold ${
                trend.isPositive ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{trend.value}</span>
              {trend.label && <span className="text-slate-400 font-normal">{trend.label}</span>}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
