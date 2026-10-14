'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { temporalDemo } from './data/temporal-demo';

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative pt-28 pb-16 md:pt-40 md:pb-28 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Text Content */}
        <div className="flex flex-col gap-6 sm:gap-8 relative z-10">
          <div className="inline-flex items-center gap-2 self-start font-mono text-xs font-semibold tracking-widest text-text-muted uppercase bg-surface-raised border border-border px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Temporal Inventory Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-text">
            Know what&apos;s available. <br className="hidden sm:inline" />
            Know what you <span className="text-primary">can promise.</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-text-muted max-w-xl leading-relaxed">
            Plan event inventory across bookings, operational buffers, and fulfillment &mdash; without double-booking the same physical stock.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
            <Link 
              href="/signup" 
              className="bg-primary text-primary-foreground px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg font-bold hover:bg-primaryHover transition-all text-base sm:text-lg flex items-center justify-center gap-2 text-center shadow-lg shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Get started &rarr;
            </Link>
            <Link 
              href="#how-it-works" 
              className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg font-semibold border border-border text-text hover:bg-surface-raised transition-colors text-base sm:text-lg text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              See how it works
            </Link>
          </div>
        </div>

        {/* Operational Preview Mockup */}
        <div className="relative w-full max-w-lg mx-auto lg:ml-auto z-10">
          <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
          <motion.div 
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative bg-surface border border-border rounded-xl shadow-2xl overflow-hidden p-5 sm:p-7"
          >
            {/* Header with preview badge */}
            <div className="flex items-center justify-between gap-2 pb-4 mb-5 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-operational" />
                <span className="font-mono text-xs font-bold tracking-wider text-text uppercase">
                  {temporalDemo.bookingA.name}: {temporalDemo.bookingA.eventName}
                </span>
              </div>
              <span className="font-mono text-[10px] text-text-muted bg-surface-raised border border-border px-2 py-0.5 rounded tracking-wider uppercase">
                Simulated Preview
              </span>
            </div>
            
            <div className="space-y-5">
              {/* Timeline diagram */}
              <div className="space-y-2">
                <div className="flex justify-between items-center font-mono text-[11px] text-text-muted">
                  <span>DISPATCH &amp; PREP</span>
                  <span className="text-text font-semibold">EVENT</span>
                  <span>RETURN &amp; TEARDOWN</span>
                </div>

                <div className="relative pt-1 pb-2">
                  <div className="grid grid-cols-12 gap-1 h-8 items-center font-mono text-[10px]">
                    <div className="col-span-3 h-full bg-status-operational/15 border border-status-operational/40 rounded flex items-center justify-center text-status-operational text-[9px] font-bold">
                      4 PM &ndash; 6 PM
                    </div>
                    <div className="col-span-5 h-full bg-primary text-primary-foreground rounded flex items-center justify-center font-bold text-[10px] shadow">
                      6 PM &ndash; 11 PM
                    </div>
                    <div className="col-span-4 h-full bg-status-operational/15 border border-status-operational/40 rounded flex items-center justify-center text-status-operational text-[9px] font-bold">
                      11 PM &ndash; 11 AM
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center font-mono text-[10px] text-text-muted pt-1">
                  <span>Nov 12 &middot; 4:00 PM</span>
                  <span className="text-status-operational font-bold">2h setup + 12h teardown buffer</span>
                  <span>Nov 13 &middot; 11:00 AM</span>
                </div>
              </div>

              {/* Physical Inventory commitments */}
              <div className="pt-3 border-t border-border/80 space-y-3.5">
                <div className="font-mono text-xs text-text-muted uppercase tracking-wider">
                  Committed Physical Inventory
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center font-mono text-xs">
                    <span className="text-text font-medium">{temporalDemo.inventory.primaryItem.name}</span>
                    <span className="text-text font-bold">
                      {temporalDemo.inventory.primaryItem.bookingACommitted} / {temporalDemo.inventory.primaryItem.totalCapacity} Committed
                    </span>
                  </div>
                  <div className="h-2 w-full bg-surface-subtle border border-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full w-full" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center font-mono text-xs">
                    <span className="text-text font-medium">{temporalDemo.inventory.secondaryItem.name}</span>
                    <span className="text-text font-bold">
                      {temporalDemo.inventory.secondaryItem.bookingACommitted} / {temporalDemo.inventory.secondaryItem.totalCapacity} Committed
                    </span>
                  </div>
                  <div className="h-2 w-full bg-surface-subtle border border-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full w-full" />
                  </div>
                </div>
              </div>

              {/* Status banner */}
              <div className="pt-3 border-t border-border/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-status-available" />
                  <span className="font-mono text-xs font-semibold text-status-available">
                    COMMITTED ACROSS OPERATIONAL WINDOW
                  </span>
                </div>
                <span className="font-mono text-[11px] text-text-muted">
                  Nov 12 &ndash; 13
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
