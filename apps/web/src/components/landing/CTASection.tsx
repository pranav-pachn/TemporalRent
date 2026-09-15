import Link from 'next/link';

export function CTASection() {
  return (
    <section className="py-28 sm:py-36 px-4 sm:px-6 bg-background border-t border-border">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="font-mono text-xs font-semibold tracking-widest text-primary uppercase">
          PLAN WITH CONFIDENCE
        </div>
        
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-text tracking-tight">
          Know before you promise.
        </h2>
        
        <p className="text-base sm:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
          See what&apos;s available, commit it safely, and take every booking from request to return.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/signup" 
            className="w-full sm:w-auto bg-primary text-primary-foreground px-8 py-4 rounded-lg font-bold text-lg hover:bg-primaryHover transition-transform hover:scale-[1.02] shadow-xl text-center"
          >
            Get started &rarr;
          </Link>
          <Link 
            href="#how-it-works" 
            className="w-full sm:w-auto border border-border px-8 py-4 rounded-lg font-semibold text-lg text-text hover:bg-surface transition-colors text-center"
          >
            See how it works
          </Link>
        </div>
      </div>
    </section>
  );
}
