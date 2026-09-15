'use client';

import { motion } from 'framer-motion';

export function ProblemSection() {
  return (
    <section id="problem" className="pt-24 pb-16 px-4 sm:px-6 border-t border-border bg-background">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h2 className="font-mono text-xs font-semibold tracking-widest text-primary uppercase">
            The Problem
          </h2>
          <p className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.1] text-text">
            Rental inventory isn&apos;t simply <br />
            <span className="text-text-muted">available or unavailable.</span>
          </p>
          <p className="text-base sm:text-lg text-text-muted leading-relaxed max-w-2xl mx-auto">
            The same physical item can be committed to different events across overlapping operational windows.
          </p>
        </div>

        {/* 3 Editorial Concept Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Card 01 - TIME */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-surface border border-border p-6 sm:p-8 rounded-xl flex flex-col justify-between space-y-6 hover:border-border/80 transition-colors"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-text-muted">01</span>
                <span className="font-mono text-xs text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  TIME
                </span>
              </div>
              <h3 className="text-xl font-bold text-text">Same item. Multiple windows.</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                A sofa used for one event may still be unavailable for another event happening the next morning.
              </p>
            </div>

            {/* Inline Visual: Overlapping Windows */}
            <div className="bg-background border border-border/80 rounded-lg p-4 font-mono text-[11px] space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-text-muted text-[10px]">
                  <span>EVENT A</span>
                  <span>SAT NIGHT</span>
                </div>
                <div className="h-4 bg-primary/80 rounded w-3/4 flex items-center px-2 text-primary-foreground font-bold text-[9px]">
                  6 PM &ndash; 11 PM
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-text-muted text-[10px]">
                  <span>EVENT B</span>
                  <span>SUN MORNING</span>
                </div>
                <div className="h-4 bg-status-conflict/80 rounded w-1/2 ml-auto flex items-center justify-end px-2 text-white font-bold text-[9px]">
                  9 AM &ndash; 12 PM
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 02 - BUFFER */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-surface border border-border p-6 sm:p-8 rounded-xl flex flex-col justify-between space-y-6 hover:border-border/80 transition-colors"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-text-muted">02</span>
                <span className="font-mono text-xs text-status-operational bg-status-operational/10 border border-status-operational/20 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  BUFFER
                </span>
              </div>
              <h3 className="text-xl font-bold text-text">The event isn&apos;t the whole commitment.</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Setup, transport, pickup, and reconciliation can keep inventory committed beyond the event itself.
              </p>
            </div>

            {/* Inline Visual: Event + Buffer */}
            <div className="bg-background border border-border/80 rounded-lg p-4 font-mono text-[11px] space-y-2.5">
              <div className="text-[10px] text-text-muted flex justify-between">
                <span>SETUP BUFFER</span>
                <span className="font-bold text-text">EVENT</span>
                <span>TEARDOWN</span>
              </div>
              
              <div className="flex items-center gap-1 h-7">
                <div className="h-full bg-status-operational/20 border border-status-operational/50 text-status-operational rounded text-[9px] font-bold flex items-center justify-center flex-1">
                  2h before
                </div>
                <div className="h-full bg-primary text-primary-foreground rounded text-[10px] font-bold flex items-center justify-center flex-[2] shadow">
                  EVENT
                </div>
                <div className="h-full bg-status-operational/20 border border-status-operational/50 text-status-operational rounded text-[9px] font-bold flex items-center justify-center flex-1">
                  12h after
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 03 - DEMAND */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-surface border border-border p-6 sm:p-8 rounded-xl flex flex-col justify-between space-y-6 hover:border-border/80 transition-colors"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-text-muted">03</span>
                <span className="font-mono text-xs text-text bg-border/80 border border-border px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  DEMAND
                </span>
              </div>
              <h3 className="text-xl font-bold text-text">Packages hide real inventory.</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                A package may look like one line item, but fulfillment depends on the physical inventory inside it.
              </p>
            </div>

            {/* Inline Visual: Package Breakdown */}
            <div className="bg-background border border-border/80 rounded-lg p-3.5 font-mono text-[11px] space-y-2">
              <div className="flex items-center justify-between font-bold text-text pb-1 border-b border-border/60">
                <span>Wedding Package</span>
                <span className="text-primary text-[10px]">1 PACKAGE</span>
              </div>
              <div className="space-y-1.5 pt-0.5 text-text-muted text-[10px]">
                <div className="flex justify-between">
                  <span>&rarr; VIP Sofa</span>
                  <span className="text-text font-bold">8 units</span>
                </div>
                <div className="flex justify-between">
                  <span>&rarr; Urli Accents</span>
                  <span className="text-text font-bold">6 units</span>
                </div>
                <div className="flex justify-between">
                  <span>&rarr; Dining Chairs</span>
                  <span className="text-text font-bold">20 units</span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
