export function AuditSection() {
  const logs = [
    { time: '14:32:08', action: 'CONFIRMED', user: 'Rahul', detail: 'Wedding Reception', color: 'text-status-available' },
    { time: '14:41:17', action: 'STARTED PICKING', user: 'Rahul', detail: 'Dispatch #D129', color: 'text-status-operational' },
    { time: '14:45:03', action: 'DISPATCHED', user: 'Rahul', detail: 'Wedding Reception', color: 'text-primary' },
    { time: '16:18:42', action: 'RETURNED', user: 'Rahul', detail: 'Wedding Reception', color: 'text-text' },
    { time: '16:19:07', action: 'DAMAGE REPORTED', user: 'Rahul', detail: 'VIP Sofa × 2', color: 'text-status-conflict' }
  ];

  return (
    <section id="audit" className="py-20 sm:py-24 px-4 sm:px-6 bg-surface border-t border-border">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        
        {/* Audit Log Card */}
        <div className="order-2 lg:order-1 bg-[#0a0a0c] border border-border rounded-xl p-5 sm:p-8 overflow-x-auto shadow-2xl">
          <div className="font-mono text-xs tracking-widest text-text-muted mb-6 uppercase flex items-center justify-between border-b border-border pb-3">
            <span>Operational History</span>
            <span className="text-[10px] font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
              IMMUTABLE
            </span>
          </div>
          <div className="font-mono text-xs sm:text-sm space-y-3 sm:space-y-4 whitespace-nowrap min-w-[460px]">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-4 sm:gap-6 border-b border-border/40 pb-3 last:border-0 last:pb-0 hover:bg-white/[0.02] transition-colors -mx-2 px-2 py-1.5 rounded">
                <div className="text-text-muted w-16 sm:w-20 text-xs">{log.time}</div>
                <div className={`w-36 sm:w-40 font-bold ${log.color}`}>{log.action}</div>
                <div className="w-16 sm:w-20 text-text-muted">{log.user}</div>
                <div className="text-text-muted font-sans text-xs flex-1">{log.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Narrative Side */}
        <div className="order-1 lg:order-2 space-y-6 sm:space-y-8">
          <h2 className="font-mono text-xs font-semibold tracking-widest text-primary uppercase">
            OPERATIONAL HISTORY
          </h2>
          <p className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-text">
            Every important action <br />
            <span className="text-text-muted">leaves a record.</span>
          </p>
          <p className="text-base sm:text-lg text-text-muted leading-relaxed">
            Confirmations, dispatches, returns, damage reports, and privileged changes are recorded in an immutable operational history.
          </p>
          <p className="text-sm text-text-muted leading-relaxed">
            Trace exactly who handled what physical inventory and when, ensuring accountability and full reconciliation across operations.
          </p>
        </div>

      </div>
    </section>
  );
}
