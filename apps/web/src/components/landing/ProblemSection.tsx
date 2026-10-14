'use client';

import { motion, useReducedMotion } from 'framer-motion';

export function ProblemSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="problem" className="pt-24 pb-20 px-4 sm:px-6 border-t border-border bg-background scroll-mt-20">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="font-mono text-xs font-semibold tracking-widest text-primary uppercase">
            The Operational Reality
          </h2>
          <p className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.15] text-text">
            Rental inventory isn&apos;t simply <br />
            <span className="text-text-muted">available or unavailable.</span>
          </p>
          <p className="text-base sm:text-lg text-text-muted leading-relaxed max-w-2xl mx-auto">
            Traditional inventory software tracks static stock counts. Rental businesses manage physical items moving across competing time windows, turnarounds, and bundles.
          </p>
        </div>

        {/* 3 Distinct Concept Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          
          {/* Card 01 - TIME OVERLAP */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="bg-surface border border-border p-6 sm:p-7 rounded-xl flex flex-col justify-between space-y-6 hover:border-primary/40 hover:shadow-xl transition-all"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-text-muted">01</span>
                <span className="font-mono text-xs text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  TIME WINDOWS
                </span>
              </div>
              <h3 className="text-lg font-bold text-text">Same item. Multiple events.</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                A sofa committed to a Saturday gala cannot physically serve a Sunday morning brunch &mdash; even if the warehouse shows it in stock on paper.
              </p>
            </div>

            {/* Inline Visual: Overlapping Windows */}
            <div className="bg-background border border-border/80 rounded-lg p-4 font-mono text-[11px] space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-text-muted text-[10px]">
                  <span className="font-bold text-text">SATURDAY GALA</span>
                  <span>6 PM &ndash; 11 PM</span>
                </div>
                <div className="h-5 bg-primary/80 rounded w-full flex items-center px-2 text-primary-foreground font-bold text-[10px]">
                  Committed &middot; 10 Sofas
                </div>
              </div>

              <div className="space-y-1.5 pt-1 border-t border-border/40">
                <div className="flex justify-between text-text-muted text-[10px]">
                  <span className="font-bold text-status-conflict">SUNDAY BRUNCH</span>
                  <span>9 AM &ndash; 1 PM</span>
                </div>
                <div className="h-5 bg-status-conflict/20 border border-status-conflict/60 rounded w-full flex items-center justify-between px-2 text-status-conflict font-bold text-[10px]">
                  <span>Requested 4 Sofas</span>
                  <span className="text-[9px] uppercase tracking-wider">Conflict</span>
                </div>
              </div>

              <div className="pt-1 text-[10px] text-text-muted flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-status-conflict" />
                <span>Availability is time-bound, not a static count.</span>
              </div>
            </div>
          </motion.div>

          {/* Card 02 - OPERATIONAL BUFFER */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-surface border border-border p-6 sm:p-7 rounded-xl flex flex-col justify-between space-y-6 hover:border-primary/40 hover:shadow-xl transition-all"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-text-muted">02</span>
                <span className="font-mono text-xs text-status-operational bg-status-operational/10 border border-status-operational/20 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  TURNAROUND BUFFERS
                </span>
              </div>
              <h3 className="text-lg font-bold text-text">The event isn&apos;t the whole commitment.</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Staging, transport, teardown, and cleaning hold physical assets hostage long after guests go home.
              </p>
            </div>

            {/* Inline Visual: Proportional Buffer Anatomy */}
            <div className="bg-background border border-border/80 rounded-lg p-4 font-mono text-[11px] space-y-3">
              <div className="text-[10px] text-text-muted flex justify-between">
                <span>PREP (2h)</span>
                <span className="font-bold text-text">EVENT (5h)</span>
                <span>TEARDOWN &amp; RETURN (12h)</span>
              </div>
              
              <div className="flex items-center gap-1 h-7">
                <div className="h-full bg-status-operational/25 border border-status-operational/50 text-status-operational rounded text-[9px] font-bold flex items-center justify-center flex-[2]">
                  2h
                </div>
                <div className="h-full bg-primary text-primary-foreground rounded text-[10px] font-bold flex items-center justify-center flex-[5] shadow">
                  EVENT
                </div>
                <div className="h-full bg-status-operational/25 border border-status-operational/50 text-status-operational rounded text-[9px] font-bold flex items-center justify-center flex-[12]">
                  12h TEARDOWN
                </div>
              </div>

              <div className="pt-1 text-[10px] text-text-muted flex items-center justify-between">
                <span>Total Commitment: 19h</span>
                <span className="text-status-operational font-bold">Buffers = 74% of lock-in</span>
              </div>
            </div>
          </motion.div>

          {/* Card 03 - COMPETING PACKAGES */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="bg-surface border border-border p-6 sm:p-7 rounded-xl flex flex-col justify-between space-y-6 hover:border-primary/40 hover:shadow-xl transition-all"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-text-muted">03</span>
                <span className="font-mono text-xs text-text bg-surface-raised border border-border px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  PACKAGE DECOMPOSITION
                </span>
              </div>
              <h3 className="text-lg font-bold text-text">Packages hide real inventory bottlenecks.</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                A customer books one package line item, but fulfillment requires committing concrete physical SKUs across your warehouse.
              </p>
            </div>

            {/* Inline Visual: Package Breakdown */}
            <div className="bg-background border border-border/80 rounded-lg p-3.5 font-mono text-[11px] space-y-2">
              <div className="flex items-center justify-between font-bold text-text pb-1.5 border-b border-border/60">
                <span>Wedding Package</span>
                <span className="text-primary text-[10px] bg-primary/10 px-2 py-0.5 rounded">1 PACKAGE</span>
              </div>
              <div className="space-y-1.5 text-text-muted text-[10px]">
                <div className="flex justify-between items-center bg-surface/50 px-2 py-1 rounded">
                  <span>VIP Sofa</span>
                  <span className="text-text font-bold">8 units required</span>
                </div>
                <div className="flex justify-between items-center bg-surface/50 px-2 py-1 rounded">
                  <span>Urli Decor Accents</span>
                  <span className="text-text font-bold">6 units required</span>
                </div>
                <div className="flex justify-between items-center bg-surface/50 px-2 py-1 rounded">
                  <span>Banquet Chairs</span>
                  <span className="text-text font-bold">20 units required</span>
                </div>
              </div>
              <div className="pt-1 text-[10px] text-text-muted flex items-center justify-between">
                <span>Decomposed automatically</span>
                <span className="text-status-available font-bold">&check; Exact SKU mapping</span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
