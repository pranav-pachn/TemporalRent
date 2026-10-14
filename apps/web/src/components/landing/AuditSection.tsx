'use client';

import { ShieldCheck, History } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export function AuditSection() {
  const shouldReduceMotion = useReducedMotion();

  const logs = [
    { time: '14:32:08', action: 'CONFIRMED', user: 'Rahul', detail: 'Booking #B-104 (10 Sofas locked)', badge: 'bg-status-available/10 text-status-available border-status-available/30' },
    { time: '14:41:17', action: 'PICKING BEGUN', user: 'Warehouse Team', detail: 'Dispatch #D-129 staged in Bay 3', badge: 'bg-status-operational/10 text-status-operational border-status-operational/30' },
    { time: '14:45:03', action: 'DISPATCHED', user: 'Driver Marcus', detail: 'Van #04 outbound to venue', badge: 'bg-primary/10 text-primary border-primary/30' },
    { time: '16:18:42', action: 'RETURNED', user: 'Receiving Dock', detail: 'Inbound inspection initiated', badge: 'bg-surface-raised text-text border-border' },
    { time: '16:19:07', action: 'DAMAGE LOGGED', user: 'Inspector Priya', detail: 'VIP Sofa × 2 flagged for repair', badge: 'bg-status-conflict/15 text-status-conflict border-status-conflict/40 font-bold' }
  ];

  return (
    <section id="audit" className="py-20 sm:py-24 px-4 sm:px-6 bg-surface border-t border-border scroll-mt-20">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        
        {/* Audit Log Card */}
        <motion.div 
          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4 }}
          className="order-2 lg:order-1 bg-[#09090c] border border-border rounded-xl p-5 sm:p-7 overflow-x-auto shadow-2xl"
        >
          <div className="font-mono text-xs tracking-widest text-text-muted mb-5 uppercase flex items-center justify-between border-b border-border pb-3">
            <span className="flex items-center gap-2 text-text font-bold">
              <History className="w-3.5 h-3.5 text-primary" />
              Operational Audit Ledger
            </span>
            <span className="text-[10px] font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded uppercase">
              Immutable Trail
            </span>
          </div>

          <div className="font-mono text-xs space-y-2.5 min-w-[380px]">
            {logs.map((log, i) => (
              <div 
                key={i} 
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border/40 bg-surface/40 hover:bg-surface-raised transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-text-muted text-[11px] w-14 sm:w-16 shrink-0">{log.time}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] border font-bold uppercase tracking-wider shrink-0 ${log.badge}`}>
                    {log.action}
                  </span>
                </div>
                <div className="text-right truncate font-sans text-xs">
                  <span className="text-text font-medium block truncate">{log.detail}</span>
                  <span className="text-text-muted text-[10px] font-mono">{log.user}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between font-mono text-[11px] text-text-muted">
            <span className="flex items-center gap-1.5 text-status-available">
              <ShieldCheck className="w-3.5 h-3.5 text-status-available" />
              Cryptographic integrity active
            </span>
            <span>All events logged</span>
          </div>
        </motion.div>

        {/* Narrative Side */}
        <div className="order-1 lg:order-2 space-y-6">
          <div className="font-mono text-xs font-semibold tracking-widest text-primary uppercase">
            OPERATIONAL TRACEABILITY
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-text">
            Every critical transition <br />
            <span className="text-text-muted">leaves an audit trail.</span>
          </h2>
          <p className="text-base sm:text-lg text-text-muted leading-relaxed">
            Confirmations, dispatches, returns, damage reports, and maintenance quarantines are recorded in an immutable operational history.
          </p>
          <p className="text-sm text-text-muted leading-relaxed">
            Eliminate finger-pointing between sales coordinators and warehouse managers. You always know who committed, dispatched, and inspected every item across time.
          </p>
        </div>

      </div>
    </section>
  );
}
