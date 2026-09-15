'use client';

import { motion } from 'framer-motion';

export function WarehouseWorkflowSection() {
  const workflow = [
    { status: 'CONFIRMED', color: 'bg-status-available', text: 'text-status-available', desc: 'Inventory is committed to the booking.' },
    { status: 'READY', color: 'bg-blue-500', text: 'text-blue-500', desc: 'Warehouse preparation is ready to begin.' },
    { status: 'PICKING', color: 'bg-status-operational', text: 'text-status-operational', desc: 'Staff prepares the physical items.' },
    { status: 'DISPATCHED', color: 'bg-purple-500', text: 'text-purple-500', desc: 'Inventory leaves the warehouse.' },
    { status: 'RETURNED', color: 'bg-text-muted', text: 'text-text', desc: 'Returned items are inspected and reconciled.' }
  ];

  return (
    <section id="operations" className="py-20 sm:py-24 px-4 sm:px-6 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="font-mono text-xs font-semibold tracking-widest text-primary uppercase">
            OPERATIONS
          </h2>
          <p className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-text">
            From confirmed booking to returned inventory.
          </p>
          <p className="text-base sm:text-lg text-text-muted">
            TemporalRent isn&apos;t just a reservation engine &mdash; it manages the physical lifecycle of stock.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Warehouse Progression (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="font-mono text-xs font-semibold tracking-wider text-text-muted uppercase mb-4">
              Warehouse Progression
            </div>
            
            {workflow.map((step, i) => (
              <motion.div 
                key={step.status}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className="flex gap-4 sm:gap-6 items-stretch group"
              >
                <div className="flex flex-col items-center pt-2">
                  <div className={`w-3 h-3 rounded-full ${step.color} group-hover:scale-125 transition-transform shrink-0`} />
                  {i !== workflow.length - 1 && (
                    <div className="flex-1 w-0.5 bg-border my-2 min-h-[2.5rem]" />
                  )}
                </div>
                <div className="flex-1 bg-surface border border-border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group-hover:border-primary/50 transition-colors">
                  <div className={`font-mono font-bold tracking-widest text-sm ${step.text}`}>
                    {step.status}
                  </div>
                  <div className="text-text-muted text-sm leading-relaxed">
                    {step.desc}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Column: Dedicated Return & Reconciliation Visual (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="font-mono text-xs font-semibold tracking-wider text-text-muted uppercase mb-4">
              Physical State Reconciliation
            </div>

            <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex justify-between items-center border-b border-border pb-4">
                <div>
                  <div className="font-mono text-xs font-bold text-primary uppercase tracking-wider">
                    RETURN INSPECTION
                  </div>
                  <div className="text-base font-bold text-text mt-1">VIP Sofa</div>
                </div>
                <div className="font-mono text-xs text-text-muted bg-background border border-border px-2.5 py-1 rounded">
                  DISPATCH #D129
                </div>
              </div>

              {/* Tally Numbers */}
              <div className="space-y-3 font-mono text-sm">
                <div className="flex justify-between items-center text-text-muted text-xs pb-2 border-b border-border/50">
                  <span>Expected Units</span>
                  <span className="text-text font-bold">10</span>
                </div>
                <div className="flex justify-between items-center text-text-muted text-xs pb-2 border-b border-border/50">
                  <span>Returned Units</span>
                  <span className="text-text font-bold">10</span>
                </div>
              </div>

              {/* Categorization Grid */}
              <div className="grid grid-cols-3 gap-2.5 pt-2 text-center font-mono">
                <div className="bg-status-available/10 border border-status-available/40 p-3 rounded-lg">
                  <div className="text-[10px] text-status-available uppercase font-bold tracking-wider mb-1">GOOD</div>
                  <div className="text-xl font-bold text-status-available">8</div>
                </div>
                <div className="bg-status-conflict/10 border border-status-conflict/40 p-3 rounded-lg">
                  <div className="text-[10px] text-status-conflict uppercase font-bold tracking-wider mb-1">DAMAGED</div>
                  <div className="text-xl font-bold text-status-conflict">2</div>
                </div>
                <div className="bg-background border border-border p-3 rounded-lg">
                  <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-1">MISSING</div>
                  <div className="text-xl font-bold text-text-muted">0</div>
                </div>
              </div>

              {/* Plain English Explanation */}
              <div className="pt-4 border-t border-border space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs text-status-available font-semibold">
                  <span className="w-2 h-2 rounded-full bg-status-available animate-pulse" />
                  Inventory state updated
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Returned inventory is automatically reconciled into usable, damaged, and missing quantities &mdash; keeping physical stock truthful for future reservations.
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
