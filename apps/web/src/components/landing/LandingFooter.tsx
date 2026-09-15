import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-surface/50 py-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-2">
          <span className="font-bold text-xl tracking-tight text-text font-mono">TemporalRent</span>
          <p className="text-sm text-text-muted max-w-sm">
            Temporal inventory management for event rental operations.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-8 text-sm">
          <div className="space-y-2 flex flex-col">
            <span className="font-mono text-xs uppercase font-semibold text-text">Product</span>
            <Link href="#problem" className="text-text-muted hover:text-text transition-colors">Problem</Link>
            <Link href="#how-it-works" className="text-text-muted hover:text-text transition-colors">How it works</Link>
            <Link href="#operations" className="text-text-muted hover:text-text transition-colors">Operations</Link>
            <Link href="#audit" className="text-text-muted hover:text-text transition-colors">Audit</Link>
          </div>

          <div className="space-y-2 flex flex-col">
            <span className="font-mono text-xs uppercase font-semibold text-text">Account</span>
            <Link href="/login" className="text-text-muted hover:text-text transition-colors">Sign in</Link>
            <Link href="/signup" className="text-text-muted hover:text-text transition-colors">Get started</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-10 mt-10 border-t border-border/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-text-muted">
        <div>
          &copy; {new Date().getFullYear()} TemporalRent. All rights reserved.
        </div>
        <div className="font-mono">
          Engineered for temporal correctness.
        </div>
      </div>
    </footer>
  );
}
