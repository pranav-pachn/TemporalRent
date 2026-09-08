export function ProblemSection() {
  return (
    <section id="product" className="py-24 px-6 bg-surface">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <h2 className="text-sm font-bold tracking-widest text-primary uppercase">
          The Real Problem
        </h2>
        <p className="text-3xl md:text-5xl font-bold leading-tight text-text">
          Packages hide physical inventory. <br />
          <span className="text-text-muted">TemporalRent exposes the actual demand.</span>
        </p>
        <p className="text-lg text-text-muted max-w-2xl mx-auto leading-relaxed pt-4">
          Most software lets you book a "Wedding Package". But they don't tell you that both packages require the exact same VIP sofa, which you only have 10 of. When two events overlap, you overbook. We fix that.
        </p>
      </div>
    </section>
  );
}
