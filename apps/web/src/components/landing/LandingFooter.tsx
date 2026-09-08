import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xl tracking-tight text-text">TemporalRent</span>
        </div>
        
        <div className="text-sm text-text-muted">
          &copy; {new Date().getFullYear()} TemporalRent. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
