import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Text Content */}
        <div className="flex flex-col gap-8 relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-text">
            KNOW WHAT YOU CAN <br />
            <span className="text-primary">SAFELY PROMISE.</span>
          </h1>
          <p className="text-lg md:text-xl text-text-muted max-w-xl leading-relaxed">
            Temporal inventory planning for event rental businesses. Know what's available, what's committed, and what you can safely book.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link 
              href="/login" 
              className="bg-primary text-white px-8 py-4 rounded-lg font-semibold hover:bg-primaryHover transition-colors text-lg"
            >
              Get Started
            </Link>
            <Link 
              href="#how-it-works" 
              className="px-8 py-4 rounded-lg font-semibold border border-border hover:bg-surface transition-colors text-lg"
            >
              See how it works
            </Link>
          </div>
        </div>

        {/* Animated CSS Mockup */}
        <div className="relative w-full max-w-md mx-auto lg:ml-auto z-10">
          <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
          <div className="relative bg-surface border border-border rounded-xl shadow-2xl overflow-hidden p-6 hover:border-primary/50 transition-colors duration-500 transform hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <h3 className="font-semibold text-lg">Booking Availability</h3>
              <span className="text-sm px-2 py-1 bg-green-500/10 text-green-500 rounded-full flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Available
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-border flex items-center justify-center">🛋️</div>
                  <span className="font-medium text-text-muted group-hover:text-text transition-colors">VIP Sofa</span>
                </div>
                <div className="text-right">
                  <div className="font-mono">8 / 10</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-border flex items-center justify-center">🏺</div>
                  <span className="font-medium text-text-muted group-hover:text-text transition-colors">Urli</span>
                </div>
                <div className="text-right">
                  <div className="font-mono">4 / 6</div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-border flex justify-between items-center text-sm text-text-muted">
              <span>Nov 12</span>
              <span className="text-border">→</span>
              <span>Nov 13</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
