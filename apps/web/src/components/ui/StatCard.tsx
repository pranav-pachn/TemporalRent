import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  accent?: 'default' | 'safe' | 'warning' | 'danger';
  href?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = 'default',
  href,
  className = '',
}: StatCardProps) {
  const accentBorder = {
    default: 'hover:border-border-active',
    safe: 'border-l-2 border-l-status-safe',
    warning: 'border-l-2 border-l-status-warning',
    danger: 'border-l-2 border-l-status-danger',
  }[accent];

  const content = (
    <div
      className={`bg-surface border border-border rounded-lg p-4 sm:p-5 transition-colors ${accentBorder} ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-text-muted tracking-wide uppercase">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-md bg-surface-raised border border-border text-text-muted">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-bold text-text tabular-nums tracking-tight">
          {value}
        </div>
        {subtitle && (
          <div className="mt-1 text-xs text-text-muted">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-transform active:scale-[0.99]">
        {content}
      </Link>
    );
  }

  return content;
}
