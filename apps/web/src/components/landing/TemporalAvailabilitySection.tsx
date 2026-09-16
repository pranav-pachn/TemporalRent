'use client';

import { motion } from 'framer-motion';
import { temporalDemo, timelinePosition } from './data/temporal-demo';

export function TemporalAvailabilitySection() {
  const { startMinutes, endMinutes, midnightMinutes } = temporalDemo.timelineBounds;

  // Calculate proportional coordinates for all bars
  const posAOp = timelinePosition(
    temporalDemo.bookingA.operational.startMinutes,
    temporalDemo.bookingA.operational.endMinutes,
    startMinutes,
    endMinutes
  );

  const posAEvent = timelinePosition(
    temporalDemo.bookingA.event.startMinutes,
    temporalDemo.bookingA.event.endMinutes,
    startMinutes,
    endMinutes
  );

  const posBEvent = timelinePosition(
    temporalDemo.bookingB.event.startMinutes,
    temporalDemo.bookingB.event.endMinutes,
    startMinutes,
    endMinutes
  );

  const posOverlap = timelinePosition(
    temporalDemo.bookingB.event.startMinutes,
    temporalDemo.bookingA.operational.endMinutes,
    startMinutes,
    endMinutes
  );

  const midnightLeft = `${((midnightMinutes - startMinutes) / (endMinutes - startMinutes)) * 100}%`;

  return (
    <section id="availability" className="pb-24 pt-8 px-4 sm:px-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-12 sm:space-y-16">
        
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="font-mono text-xs font-semibold tracking-widest text-primary uppercase">
            TEMPORAL AVAILABILITY
          </h2>
          <p className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.1] text-text">
            See the commitment, <br />
            <span className="text-text-muted">not just the event.</span>
          </p>
          <p className="text-base sm:text-lg text-text-muted leading-relaxed">
            TemporalRent accounts for the full period in which inventory is occupied, not just the hours an event is running.
          </p>
        </div>
        
        {/* Mobile scroll hint */}
        <div className="md:hidden flex items-center justify-end gap-1.5 text-xs font-mono text-text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span>Scroll to inspect timeline &rarr;</span>
        </div>

        {/* Schematic Timeline Container */}
        <div className="w-full overflow-x-auto pb-4 snap-x">
          <div className="min-w-[820px] bg-surface border border-border rounded-xl p-5 sm:p-8 lg:p-12 space-y-10 relative overflow-hidden font-mono text-sm shadow-2xl">
            
            {/* Header / Day Boundary Marker */}
            <div className="relative border-b border-border pb-3">
              <div className="flex text-xs font-semibold tracking-widest uppercase">
                <div style={{ width: midnightLeft }} className="text-text-muted">
                  NOV 12 &middot; 2:00 PM &rarr; 11:59 PM
                </div>
                <div style={{ width: `calc(100% - ${midnightLeft})` }} className="text-text-muted pl-4 border-l border-border/80">
                  NOV 13 &middot; 12:00 AM &rarr; 2:00 PM
                </div>
              </div>

              {/* Vertical guideline for midnight */}
              <div 
                style={{ left: midnightLeft }} 
                className="absolute top-8 bottom-[-520px] w-[1px] border-l border-dashed border-border pointer-events-none -z-10" 
              />
            </div>

            <div className="space-y-10 relative z-10">

              {/* 1. BOOKING A: Wedding Reception */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs tracking-wider">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text uppercase">{temporalDemo.bookingA.name}</span>
                    <span className="text-text-muted">&middot; {temporalDemo.bookingA.eventName}</span>
                  </div>
                  <span className="text-text-muted hidden sm:inline">{temporalDemo.bookingA.buffer.label}</span>
                </div>

                {/* Booking A Timeline Track */}
                <div className="relative h-28 bg-surface-raised/40 border border-border/50 rounded-lg p-3 overflow-hidden">
                  
                  {/* Event Bar */}
                  <div className="relative h-9">
                    <motion.div
                      style={{ left: posAEvent.left, width: posAEvent.width }}
                      initial={{ opacity: 0, y: -4 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                      className="absolute h-7 bg-primary text-primary-foreground rounded flex items-center justify-center text-[11px] font-bold tracking-wider uppercase shadow-md px-2 z-20"
                    >
                      <span>EVENT &middot; {temporalDemo.bookingA.event.start} &rarr; {temporalDemo.bookingA.event.end}</span>
                    </motion.div>
                  </div>

                  {/* Operational Reservation Bar */}
                  <div className="relative h-12">
                    <motion.div
                      style={{ left: posAOp.left, width: posAOp.width }}
                      initial={{ scaleX: 0, opacity: 0 }}
                      whileInView={{ scaleX: 1, opacity: 1 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
                      className="origin-left absolute h-9 bg-status-operational/15 border border-status-operational/70 rounded flex items-center justify-between px-3 text-[11px] text-status-operational z-10"
                    >
                      <span className="font-bold tracking-wider uppercase flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-operational animate-pulse" />
                        OPERATIONAL RESERVATION
                      </span>
                      <span className="font-mono text-[10px] hidden md:inline opacity-90">
                        {temporalDemo.bookingA.operational.start} ({temporalDemo.bookingA.operational.startDate}) &rarr; {temporalDemo.bookingA.operational.end} ({temporalDemo.bookingA.operational.endDate})
                      </span>
                    </motion.div>
                  </div>

                </div>
              </div>

              {/* 2. ALIGNED VIP SOFA COMMITMENT */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs tracking-wider">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text uppercase">{temporalDemo.inventory.primaryItem.name}</span>
                    <span className="text-text-muted">&mdash; Committed Inventory</span>
                  </div>
                  <span className="text-text-muted text-[11px]">Physical capacity: {temporalDemo.inventory.primaryItem.totalCapacity} units</span>
                </div>

                <div className="relative h-12 bg-surface-raised/40 border border-border/50 rounded-lg p-2">
                  <motion.div
                    style={{ left: posAOp.left, width: posAOp.width }}
                    initial={{ scaleX: 0, opacity: 0 }}
                    whileInView={{ scaleX: 1, opacity: 1 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.6, delay: 0.45, ease: 'easeOut' }}
                    className="origin-left absolute top-1.5 h-8 bg-text/10 border border-text/40 rounded flex items-center justify-between px-3 text-text"
                  >
                    <span className="font-mono text-xs font-bold tracking-wider">
                      {temporalDemo.inventory.primaryItem.bookingACommitted} / {temporalDemo.inventory.primaryItem.totalCapacity} RESERVED
                    </span>
                    <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider hidden sm:inline">
                      Locked to Booking A Operational Window
                    </span>
                  </motion.div>
                </div>
              </div>

              {/* 3. BOOKING B & CONFLICT OVERLAP */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs tracking-wider">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text uppercase">{temporalDemo.bookingB.name}</span>
                    <span className="text-text-muted">&middot; {temporalDemo.bookingB.eventName}</span>
                  </div>
                  <span className="text-status-conflict text-xs font-semibold">
                    Requests {temporalDemo.inventory.primaryItem.bookingBRequired} &times; {temporalDemo.inventory.primaryItem.name}
                  </span>
                </div>

                <div className="relative h-20 bg-surface-raised/40 border border-border/50 rounded-lg p-3">
                  
                  {/* Overlap Visual Indicator (Warning zone) */}
                  <motion.div
                    style={{ left: posOverlap.left, width: posOverlap.width }}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.4, delay: 0.8 }}
                    className="absolute inset-y-1 bg-status-conflict/15 border-x-2 border-status-conflict/80 z-0 pointer-events-none"
                  >
                    <div className="absolute -top-1 left-1 text-[9px] font-bold text-status-conflict tracking-widest uppercase">
                      COLLISION
                    </div>
                  </motion.div>

                  {/* Booking B Event Bar */}
                  <motion.div
                    style={{ left: posBEvent.left, width: posBEvent.width }}
                    initial={{ opacity: 0, y: 4 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.5, delay: 0.65, ease: 'easeOut' }}
                    className="absolute top-3 h-10 bg-status-conflict/20 border-2 border-dashed border-status-conflict rounded flex flex-col justify-center items-center px-2 text-center z-10"
                  >
                    <span className="text-[10px] font-bold text-status-conflict uppercase tracking-wider">
                      {temporalDemo.bookingB.event.start} &rarr; {temporalDemo.bookingB.event.end}
                    </span>
                    <span className="text-[9px] text-status-conflict/80 font-mono">
                      Needs {temporalDemo.inventory.primaryItem.bookingBRequired} Sofas
                    </span>
                  </motion.div>

                </div>
              </div>

              {/* 4. Conflict Evaluation Summary Card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: 1.0, ease: 'easeOut' }}
                className="mt-8 bg-status-conflict/10 border-l-4 border-status-conflict p-6 rounded-r-xl max-w-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-status-conflict font-bold tracking-widest text-xs uppercase flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-status-conflict animate-pulse" />
                    TEMPORAL CONFLICT DETECTED
                  </div>
                  <span className="font-mono text-xs text-text-muted">Overlapping 2h teardown buffer</span>
                </div>

                <div className="text-sm text-text mb-4">
                  {temporalDemo.bookingB.name} ({temporalDemo.bookingB.eventName}) overlaps with {temporalDemo.bookingA.name}&apos;s post-event teardown buffer until {temporalDemo.bookingA.operational.end}.
                </div>

                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border font-mono text-xs">
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase">Available</span>
                    <span className="text-text font-bold text-base">{temporalDemo.inventory.primaryItem.availableDuringOverlap}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase">Required</span>
                    <span className="text-text font-bold text-base">{temporalDemo.inventory.primaryItem.bookingBRequired}</span>
                  </div>
                  <div>
                    <span className="text-status-conflict block text-[10px] uppercase font-bold">Shortage</span>
                    <span className="text-status-conflict font-bold text-base">+{temporalDemo.inventory.primaryItem.shortage}</span>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

