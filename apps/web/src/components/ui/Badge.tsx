import { ReactNode } from 'react';

type BadgeUrgency = 'normal' | 'attention' | 'critical' | 'success';

interface BadgeProps {
  children: ReactNode;
  urgency?: BadgeUrgency;
  className?: string;
}

export function Badge({ children, urgency = 'normal', className = '' }: BadgeProps) {
  const styles = {
    normal: 'bg-surfaceHover text-text-muted border-border',
    attention: 'bg-urgency-attention/10 text-urgency-attention border-urgency-attention/20',
    critical: 'bg-urgency-critical/10 text-urgency-critical border-urgency-critical/20',
    success: 'bg-green-500/10 text-green-500 border-green-500/20'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[urgency]} ${className}`}>
      {children}
    </span>
  );
}
