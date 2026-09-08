export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How TemporalRent Works</h2>
          <p className="text-text-muted text-lg">A simple pipeline from what you sell to what you actually have.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-1/6 right-1/6 h-0.5 bg-border -z-10 transform -translate-y-1/2" />
          
          {/* Step 1 */}
          <div className="bg-surface border border-border p-8 rounded-xl relative group hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-xl font-bold mb-6">1</div>
            <h3 className="text-xl font-bold mb-3">Package</h3>
            <p className="text-text-muted">Define your logical offerings. Create packages like "Platinum Wedding Decor" that clients understand.</p>
          </div>

          {/* Step 2 */}
          <div className="bg-surface border border-border p-8 rounded-xl relative group hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-xl font-bold mb-6">2</div>
            <h3 className="text-xl font-bold mb-3">Inventory</h3>
            <p className="text-text-muted">Break packages down into Bills of Materials (BOM). Map them to physical items in your warehouse.</p>
          </div>

          {/* Step 3 */}
          <div className="bg-surface border border-border p-8 rounded-xl relative group hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-xl font-bold mb-6">3</div>
            <h3 className="text-xl font-bold mb-3">Availability</h3>
            <p className="text-text-muted">Query real-time availability across time. Never double-book a physical item again.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
