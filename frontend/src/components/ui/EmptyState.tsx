import React from 'react';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`p-8 sm:p-12 text-center rounded-2xl sm:rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 flex items-center justify-center mb-4 shadow-xs">
        {icon}
      </div>
      <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">
        {title}
      </h4>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
