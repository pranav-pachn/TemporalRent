import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, className = '' }: ErrorStateProps) {
  return (
    <div className={`p-6 rounded-lg border border-urgency-critical/20 bg-urgency-critical/5 flex flex-col items-center text-center ${className}`}>
      <AlertTriangle className="h-10 w-10 text-urgency-critical mb-3" />
      <h3 className="text-lg font-medium text-text mb-1">{title}</h3>
      <p className="text-sm text-text-muted mb-4 max-w-sm">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-surface border border-border rounded-md text-sm font-medium hover:bg-surfaceHover transition-colors text-text"
        >
          Try again
        </button>
      )}
    </div>
  );
}
