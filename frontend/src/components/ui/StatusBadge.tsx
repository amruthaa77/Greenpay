import React from 'react';
import { Badge } from './Badge';
import { CheckCircle2, Clock, AlertTriangle, XCircle, ShieldAlert } from 'lucide-react';

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const norm = (status || '').toUpperCase();

  switch (norm) {
    case 'PROCESSED':
    case 'VERIFIED':
    case 'RESOLVED':
    case 'ACTIVE':
      return (
        <Badge variant="emerald" dot className={className}>
          {status}
        </Badge>
      );

    case 'CLAIMED':
    case 'COMPLETED':
      return (
        <Badge variant="sky" dot className={className}>
          {status}
        </Badge>
      );

    case 'PENDING':
    case 'IN_REVIEW':
      return (
        <Badge variant="amber" dot className={className}>
          {status}
        </Badge>
      );

    case 'FLAGGED':
    case 'HIGH':
    case 'CRITICAL':
      return (
        <Badge variant="rose" dot className={className}>
          {status}
        </Badge>
      );

    case 'MEDIUM':
      return (
        <Badge variant="amber" dot className={className}>
          {status}
        </Badge>
      );

    case 'LOW':
      return (
        <Badge variant="neutral" dot className={className}>
          {status}
        </Badge>
      );

    case 'REJECTED':
    case 'CANCELLED':
      return (
        <Badge variant="rose" dot className={className}>
          {status}
        </Badge>
      );

    default:
      return (
        <Badge variant="neutral" className={className}>
          {status}
        </Badge>
      );
  }
};
