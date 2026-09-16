import React from 'react';

export type OperationalStatus = 
  | 'DRAFT'
  | 'CONFIRMED'
  | 'DISPATCHED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ACTIVE'
  | 'MAINTENANCE'
  | 'RETIRED'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'GOOD'
  | 'DAMAGED'
  | 'MISSING'
  | string;

interface StatusBadgeProps {
  status: OperationalStatus;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({
  status,
  label,
  size = 'md',
  className = '',
}: StatusBadgeProps) {
  const normalized = (status || '').toUpperCase();
  const displayLabel = label || normalized.replace(/_/g, ' ');

  let colorClasses = 'bg-surface-active text-text-muted border-border';
  let dotColor = 'bg-text-dim';

  switch (normalized) {
    case 'CONFIRMED':
    case 'COMPLETED':
    case 'ACTIVE':
    case 'GOOD':
    case 'RESOLVED':
      colorClasses = 'bg-status-safe/10 text-status-safe border-status-safe/25';
      dotColor = 'bg-status-safe';
      break;

    case 'DRAFT':
    case 'PENDING':
    case 'IN_PROGRESS':
    case 'MAINTENANCE':
    case 'DAMAGED':
      colorClasses = 'bg-status-warning/10 text-status-warning border-status-warning/25';
      dotColor = 'bg-status-warning';
      break;

    case 'DISPATCHED':
      colorClasses = 'bg-status-info/10 text-status-info border-status-info/25';
      dotColor = 'bg-status-info';
      break;

    case 'CANCELLED':
    case 'RETIRED':
    case 'MISSING':
    case 'CONFLICT':
      colorClasses = 'bg-status-danger/10 text-status-danger border-status-danger/25';
      dotColor = 'bg-status-danger';
      break;

    default:
      colorClasses = 'bg-surfaceHover text-text-muted border-border';
      dotColor = 'bg-text-dim';
  }

  const sizeClasses = size === 'sm' 
    ? 'text-[11px] px-2 py-0.5 gap-1.5' 
    : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${sizeClasses} ${colorClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
      <span className="tracking-wide uppercase text-[10px] font-semibold">{displayLabel}</span>
    </span>
  );
}
