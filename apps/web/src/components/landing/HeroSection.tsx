'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { temporalDemo } from './data/temporal-demo';

export function HeroSection() {
  return (
    <section className="relative pt-28 pb-16 md:pt-48 md:pb-32 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        {/* Text Content */}
        <div className="flex flex-col gap-6 sm:gap-8 relative z-10">
          <div className="font-mono text-xs font-semibold tracking-widest text-text-muted uppercase">
            Temporal Inventory Platform
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08] text-text">
            Know what's <br />
            available. <br />
            Know what you <br />
            <span className="text-primary">can promise.</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-text-muted max-w-xl leading-relaxed">
            Plan event inventory across bookings, operational buffers, and fulfillment — without double-booking the same physical stock.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
            <Link 
              href="/signup" 
              className="bg-primary text-primary-foreground px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg font-bold hover:bg-primaryHover transition-colors text-base sm:text-lg flex items-center justify-center gap-2 text-center shadow-lg"
            >
              Get started &rarr;
            </Link>
            <Link 
              href="#how-it-works" 
              className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg font-semibold border border-border hover:bg-surface transition-colors text-base sm:text-lg text-center"
            >
              See how it works
            </Link>
          </div>
        </div>

        {/* Animated CSS Mockup */}
        <div className="relative w-full max-w-md mx-auto lg:ml-auto z-10">
          <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full" />
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative bg-surface border border-border rounded-xl shadow-2xl overflow-hidden p-4 sm:p-6"
          >
            <div className="mb-6 pb-6 border-b border-border space-y-6">
              <h3 className="font-mono text-sm font-semibold tracking-widest text-text-muted uppercase">
                {temporalDemo.scenario} &middot; {temporalDemo.bookingA.eventName.toUpperCase()}
              </h3>
              
              <div className="space-y-6">
                {/* Subtle Timeline */}
                <div className="relative pt-2 pb-2">
                  <div className="absolute top-3 left-0 right-0 h-[1px] bg-border" />
                  <div className="absolute top-3 left-[30%] right-[30%] h-[1px] bg-status-operational" />
                  <div className="flex justify-between relative z-10 font-mono text-[10px] text-text-muted">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-border" />
                      4 PM
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-status-operational shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                      6 PM
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-status-operational shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                      11 PM
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-border" />
                      11 AM
                    </div>
                  </div>
                </div>

                <div>
                  <div className="font-mono text-xs text-text-muted mb-1.5">{temporalDemo.bookingA.event.label.toUpperCase()}</div>
                  <div className="text-sm font-medium tracking-wide">{temporalDemo.bookingA.event.display}</div>
                </div>
                
                <div className="relative pl-4 border-l-2 border-status-operational">
                  <div className="font-mono text-xs text-status-operational mb-1.5">{temporalDemo.bookingA.operational.label.toUpperCase()}</div>
                  <div className="text-sm font-medium tracking-wide">{temporalDemo.bookingA.operational.display}</div>
                  <div className="mt-3">
                    <div className="font-mono text-xs text-status-operational border border-status-operational/30 bg-status-operational/10 px-2 py-1 rounded inline-block">
                      BUFFER: {temporalDemo.bookingA.buffer.label}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center group">
                <span className="font-mono text-sm font-medium text-text-muted group-hover:text-text transition-colors">{temporalDemo.inventory.primaryItem.name}</span>
                <div className="font-mono text-sm">{temporalDemo.inventory.primaryItem.bookingACommitted} / {temporalDemo.inventory.primaryItem.totalCapacity}</div>
              </div>
              
              <div className="flex justify-between items-center group">
                <span className="font-mono text-sm font-medium text-text-muted group-hover:text-text transition-colors">{temporalDemo.inventory.secondaryItem.name}</span>
                <div className="font-mono text-sm">{temporalDemo.inventory.secondaryItem.bookingACommitted} / {temporalDemo.inventory.secondaryItem.totalCapacity}</div>
              </div>
            </div>

            <div className="mt-8 pt-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-available animate-pulse" />
              <span className="font-mono text-sm font-semibold text-status-available">AVAILABLE &middot; BUFFER COMMITTED</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
