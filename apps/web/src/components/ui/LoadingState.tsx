export function LoadingState({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col space-y-4 animate-pulse ${className}`}>
      <div className="h-8 bg-surfaceHover rounded-md w-1/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-surface border border-border rounded-md w-full"></div>
        <div className="h-4 bg-surface border border-border rounded-md w-5/6"></div>
        <div className="h-4 bg-surface border border-border rounded-md w-4/6"></div>
      </div>
    </div>
  );
}
