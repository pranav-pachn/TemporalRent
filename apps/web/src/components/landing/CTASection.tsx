import Link from 'next/link';

export function CTASection() {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
      <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
        <h2 className="text-4xl md:text-5xl font-bold">Ready to take control?</h2>
        <p className="text-xl text-text-muted max-w-2xl mx-auto">
          Join operations teams that safely promise their inventory, every time.
        </p>
        <div className="pt-8">
          <Link 
            href="/login" 
            className="inline-block bg-primary text-white px-10 py-5 rounded-lg font-bold text-lg hover:bg-primaryHover transition-transform hover:scale-105"
          >
            Start using TemporalRent
          </Link>
        </div>
      </div>
    </section>
  );
}
