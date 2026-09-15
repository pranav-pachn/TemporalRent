'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { temporalDemo } from './data/temporal-demo';

export function SafeConfirmationSection() {
  return (
    <section id="conflict-prevention" className="py-20 sm:py-24 px-4 sm:px-6 bg-surface border-t border-border">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Header */}
        <div className="max-w-3xl space-y-5">
          <div className="font-mono text-xs font-semibold tracking-widest text-primary uppercase flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            SAFE CONFIRMATION
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.1] text-text">
            A booking isn&apos;t confirmed until <br />
            <span className="text-primary">the inventory is safely committed.</span>
          </h2>
          <p className="text-base sm:text-lg text-text-muted leading-relaxed">
            When multiple bookings compete for the same inventory, TemporalRent resolves the competition during confirmation so two requests cannot safely claim the same physical stock.
          </p>
        </div>

        {/* Visual Convergence Flow */}
        <div className="bg-background border border-border rounded-xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            {/* Step 1: Competing Bookings (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted pb-2 border-b border-border flex items-center justify-between">
                <span>1. Competing Requests</span>
                <span className="text-status-operational">Simultaneous</span>
              </div>
              
              <div className="bg-surface border border-border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-bold text-text uppercase">{temporalDemo.bookingA.name}</span>
                  <span className="text-[11px] font-mono text-text-muted">{temporalDemo.bookingA.eventName}</span>
                </div>
                <div className="text-xs text-text-muted flex justify-between">
                  <span>Needs {temporalDemo.inventory.primaryItem.name}</span>
                  <span className="text-text font-mono font-bold">10 units</span>
                </div>
              </div>

              <div className="bg-surface border border-border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-bold text-text uppercase">{temporalDemo.bookingB.name}</span>
                  <span className="text-[11px] font-mono text-text-muted">{temporalDemo.bookingB.eventName}</span>
                </div>
                <div className="text-xs text-text-muted flex justify-between">
                  <span>Needs {temporalDemo.inventory.primaryItem.name}</span>
                  <span className="text-text font-mono font-bold">4 units</span>
                </div>
              </div>
            </div>

            {/* Step 2: Atomic Verification Flow (4 cols) */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center space-y-4 py-4 lg:py-0 border-y lg:border-y-0 lg:border-x border-border/80 lg:px-6">
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted pb-2 border-b border-border w-full text-center">
                2. Confirmation Gate
              </div>

              <div className="w-full space-y-3 font-mono text-xs text-center">
                <div className="bg-surface border border-border rounded-lg p-3 text-text-muted">
                  Check temporal availability
                </div>
                
                <div className="text-primary text-sm flex justify-center">&darr;</div>

                <div className="bg-surface border border-border rounded-lg p-3 text-text-muted">
                  Lock &amp; verify requested item
                </div>

                <div className="text-primary text-sm flex justify-center">&darr;</div>

                <div className="bg-primary/10 border border-primary/40 rounded-lg p-3 text-primary font-bold">
                  Safe Confirmation Evaluation
                </div>
              </div>
            </div>

            {/* Step 3: Definitive Outcomes (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted pb-2 border-b border-border flex items-center justify-between">
                <span>3. Deterministic Outcome</span>
                <span className="text-primary">Zero Double-Booking</span>
              </div>

              {/* Success Result */}
              <div className="bg-status-available/10 border border-status-available/40 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-status-available font-bold text-xs uppercase font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>CONFIRMED &middot; {temporalDemo.bookingA.name}</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Requested 10 units safely committed across full operational buffer ({temporalDemo.bookingA.operational.start} &rarr; {temporalDemo.bookingA.operational.end}).
                </p>
              </div>

              {/* Conflict Result */}
              <div className="bg-status-conflict/10 border border-status-conflict/40 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-status-conflict font-bold text-xs uppercase font-mono">
                  <AlertTriangle className="w-4 h-4" />
                  <span>CONFLICT PREVENTED &middot; {temporalDemo.bookingB.name}</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Shortage of 4 units detected during overlap. System rejects hold to protect already committed physical assets.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
