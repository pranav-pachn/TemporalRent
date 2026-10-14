'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, ShieldCheck, XCircle } from 'lucide-react';
import { temporalDemo } from './data/temporal-demo';

export function SafeConfirmationSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="conflict-prevention" className="py-20 sm:py-24 px-4 sm:px-6 bg-surface border-t border-border scroll-mt-20">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Header */}
        <div className="max-w-3xl space-y-4">
          <div className="font-mono text-xs font-semibold tracking-widest text-primary uppercase flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            SAFE CONFIRMATION
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.1] text-text">
            A booking isn&apos;t confirmed until <br />
            <span className="text-primary">the inventory is safely committed.</span>
          </h2>
          <p className="text-base sm:text-lg text-text-muted leading-relaxed">
            When multiple bookings compete for the same stock, TemporalRent evaluates operational windows so two requests cannot safely claim the same physical inventory.
          </p>
        </div>

        {/* Visual Convergence Flow */}
        <div className="bg-background border border-border rounded-xl p-5 sm:p-8 lg:p-10 shadow-2xl relative overflow-hidden">
          
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-border/80">
            <span className="font-mono text-xs uppercase tracking-wider text-text-muted">
              Atomic Conflict Resolution Flow
            </span>
            <span className="font-mono text-[10px] text-text-muted bg-surface-raised border border-border px-2 py-0.5 rounded tracking-wider uppercase">
              Operational Simulation
            </span>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Step 1: Competing Bookings (4 cols) */}
            <motion.div 
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="lg:col-span-4 flex flex-col justify-between space-y-4"
            >
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted pb-2 border-b border-border flex items-center justify-between">
                <span>1. Competing Requests</span>
                <span className="text-status-operational">Simultaneous</span>
              </div>
              
              <div className="space-y-3 flex-1 flex flex-col justify-center">
                <div className="bg-surface border border-border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-text uppercase">{temporalDemo.bookingA.name}</span>
                    <span className="text-[11px] font-mono text-primary font-semibold">{temporalDemo.bookingA.eventName}</span>
                  </div>
                  <div className="text-xs text-text-muted flex justify-between font-mono">
                    <span>Target: {temporalDemo.inventory.primaryItem.name}</span>
                    <span className="text-text font-bold">10 units</span>
                  </div>
                  <div className="text-[11px] text-text-muted">Nov 12 &middot; 4 PM &rarr; Nov 13 &middot; 11 AM (Inc. Buffer)</div>
                </div>

                <div className="bg-surface border border-border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-text uppercase">{temporalDemo.bookingB.name}</span>
                    <span className="text-[11px] font-mono text-status-conflict font-semibold">{temporalDemo.bookingB.eventName}</span>
                  </div>
                  <div className="text-xs text-text-muted flex justify-between font-mono">
                    <span>Target: {temporalDemo.inventory.primaryItem.name}</span>
                    <span className="text-status-conflict font-bold">4 units</span>
                  </div>
                  <div className="text-[11px] text-text-muted">Nov 13 &middot; 9 AM &rarr; 12 PM (Overlap Window)</div>
                </div>
              </div>
            </motion.div>

            {/* Step 2: Capacity Evaluation Gate (4 cols) */}
            <motion.div 
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: 0.12 }}
              className="lg:col-span-4 flex flex-col justify-between space-y-4 py-4 lg:py-0 border-y lg:border-y-0 lg:border-x border-border/80 lg:px-6"
            >
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted pb-2 border-b border-border flex items-center justify-between">
                <span>2. Capacity Gate</span>
                <span className="text-text font-mono font-bold">Total Stock: 10</span>
              </div>

              <div className="bg-surface border border-border rounded-lg p-4 space-y-4 font-mono text-xs flex-1 flex flex-col justify-center">
                {/* Visual Bar representation */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-text">Booking A Allocation</span>
                    <span className="text-status-available font-bold">10/10 (100%)</span>
                  </div>
                  <div className="h-4 w-full bg-surface-subtle border border-border rounded overflow-hidden flex">
                    <div className="h-full bg-status-available w-full" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-status-conflict">Booking B Demand</span>
                    <span className="text-status-conflict font-bold">+4 units (Overflow)</span>
                  </div>
                  <div className="h-4 w-full bg-surface-subtle border border-status-conflict/40 rounded overflow-hidden flex">
                    <div className="h-full bg-status-conflict/40 border-r-2 border-status-conflict w-[40%] flex items-center justify-center text-[9px] text-white font-bold">
                      SHORTAGE
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-surface-raised border border-border rounded text-[11px] text-text-muted space-y-1">
                  <div className="flex justify-between">
                    <span>Committed:</span>
                    <span className="text-text font-bold">10 units</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining during window:</span>
                    <span className="text-text font-bold">0 units</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border/60 text-status-conflict font-bold">
                    <span>Requested shortage:</span>
                    <span>4 units</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Step 3: Definitive Deterministic Outcomes (4 cols) */}
            <motion.div 
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="lg:col-span-4 flex flex-col justify-between space-y-4"
            >
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted pb-2 border-b border-border flex items-center justify-between">
                <span>3. Deterministic Outcome</span>
                <span className="text-status-available font-bold">&check; Zero Double-Booking</span>
              </div>

              <div className="space-y-3 flex-1 flex flex-col justify-center">
                {/* Success Result */}
                <div className="bg-status-available/10 border border-status-available/40 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-status-available font-bold text-xs uppercase font-mono">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>CONFIRMED &middot; {temporalDemo.bookingA.name}</span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    10 units locked across full operational window ({temporalDemo.bookingA.operational.start} &rarr; {temporalDemo.bookingA.operational.end}). Guaranteed stock protection.
                  </p>
                </div>

                {/* Conflict Result */}
                <div className="bg-status-conflict/10 border border-status-conflict/40 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-status-conflict font-bold text-xs uppercase font-mono">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>BLOCKED &middot; {temporalDemo.bookingB.name}</span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Insufficient capacity during overlap. Rejection protects physical commitments without manual spreadsheet auditing.
                  </p>
                </div>
              </div>
            </motion.div>

          </div>

        </div>

      </div>
    </section>
  );
}
