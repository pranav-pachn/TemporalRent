export function BuiltForOperationsSection() {
  const principles = [
    {
      label: 'TIME-AWARE',
      title: 'Know what is actually available.',
      desc: 'Inventory is committed across setup, event, pickup, and return windows — not just event hours.'
    },
    {
      label: 'SAFE',
      title: 'Promise inventory with confidence.',
      desc: 'When bookings compete for the same stock, only a valid commitment can be confirmed.'
    },
    {
      label: 'TRACEABLE',
      title: 'Know what happened.',
      desc: 'Confirmations, dispatches, returns, and damage inspections remain part of the operational history.'
    },
    {
      label: 'WORKSPACES',
      title: 'Keep every business\'s inventory separate.',
      desc: 'Each rental business operates inside its own workspace, with its own inventory, bookings, and operations.'
    }
  ];

  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h2 className="font-mono text-xs font-semibold tracking-widest text-primary uppercase">
            BUILT FOR REAL OPERATIONS
          </h2>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-text">
            Built around how rental businesses actually work.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {principles.map((p) => (
            <div 
              key={p.label}
              className="bg-surface border border-border p-6 rounded-xl space-y-3 hover:border-primary/40 transition-colors"
            >
              <div className="font-mono text-xs font-bold text-primary tracking-wider">
                {p.label}
              </div>
              <h3 className="text-base font-bold text-text">
                {p.title}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
