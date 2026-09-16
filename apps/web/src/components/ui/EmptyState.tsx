import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center rounded-lg border border-dashed border-border/80 bg-surface-subtle/50 ${className}`}>
      <div className="bg-surface-raised border border-border p-3.5 rounded-xl mb-3 text-text-muted">
        <Icon className="h-6 w-6 text-text-muted" />
      </div>
      <h3 className="text-base font-medium text-text mb-1">{title}</h3>
      <p className="text-xs text-text-muted max-w-sm mb-5 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
