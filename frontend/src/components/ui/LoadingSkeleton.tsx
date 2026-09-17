import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200/80 rounded-xl ${className}`} />
);

export const StatCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <Skeleton className="w-20 h-3" />
        <Skeleton className="w-28 h-8" />
      </div>
      <Skeleton className="w-12 h-12 rounded-2xl" />
    </div>
    <div className="pt-3 border-t border-slate-100 flex justify-between">
      <Skeleton className="w-24 h-3" />
      <Skeleton className="w-12 h-3" />
    </div>
  </div>
);

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <tr className="border-b border-slate-100">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="p-4">
        <Skeleton className="w-full h-4" />
      </td>
    ))}
  </tr>
);

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = 'h-64' }) => (
  <div className={`w-full ${height} bg-slate-100/60 rounded-2xl flex items-center justify-center`}>
    <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      <span>Loading visual analytics...</span>
    </div>
  </div>
);
