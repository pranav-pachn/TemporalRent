import React, { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  tag?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  tag,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border/60 ${className}`}>
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-text">
            {title}
          </h1>
          {tag && <div>{tag}</div>}
        </div>
        {description && (
          <p className="mt-1 text-sm text-text-muted">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
