interface LoadingStateProps {
  className?: string;
  variant?: 'page' | 'table' | 'cards';
  rows?: number;
}

export function LoadingState({ className = '', variant = 'page', rows = 5 }: LoadingStateProps) {
  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 bg-surface border border-border rounded-lg p-5">
            <div className="h-3.5 bg-surface-raised rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-surface-raised rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`space-y-2 animate-pulse ${className}`}>
        <div className="h-10 bg-surface border border-border rounded-lg mb-3"></div>
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="h-12 bg-surface/60 border border-border/60 rounded-md"></div>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-col space-y-4 animate-pulse ${className}`}>
      <div className="h-7 bg-surface-raised rounded-md w-48 mb-2"></div>
      <div className="space-y-2.5">
        <div className="h-4 bg-surface border border-border rounded-md w-full"></div>
        <div className="h-4 bg-surface border border-border rounded-md w-5/6"></div>
        <div className="h-4 bg-surface border border-border rounded-md w-3/4"></div>
      </div>
    </div>
  );
}
