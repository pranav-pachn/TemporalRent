import Link from 'next/link';

export function CTASection() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 bg-background border-t border-border">
      <div className="max-w-4xl mx-auto text-center space-y-7">
        <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold tracking-widest text-primary uppercase bg-surface border border-border px-3 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          PLAN WITH CONFIDENCE
        </div>
        
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-text tracking-tight">
          Know before you promise.
        </h2>
        
        <p className="text-base sm:text-lg md:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
          See what&apos;s available across time, commit it safely with atomic conflict evaluation, and take every booking from request to returned inventory.
        </p>

        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/signup" 
            className="w-full sm:w-auto bg-primary text-primary-foreground px-8 py-4 rounded-lg font-bold text-base sm:text-lg hover:bg-primaryHover transition-all shadow-xl shadow-primary/10 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Get started &rarr;
          </Link>
          <Link 
            href="#how-it-works" 
            className="w-full sm:w-auto border border-border px-8 py-4 rounded-lg font-semibold text-base sm:text-lg text-text hover:bg-surface-raised transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            See how it works
          </Link>
        </div>
      </div>
    </section>
  );
}
