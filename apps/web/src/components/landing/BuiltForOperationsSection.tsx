'use client';

import { Clock, ShieldCheck, History, Building2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export function BuiltForOperationsSection() {
  const shouldReduceMotion = useReducedMotion();

  const principles = [
    {
      icon: Clock,
      label: 'TIME-AWARE COMMITMENTS',
      title: 'Know what is genuinely available.',
      desc: 'Stock is reserved across setup, delivery buffers, event hours, and post-event teardowns &mdash; never just a simple calendar check.'
    },
    {
      icon: ShieldCheck,
      label: 'ATOMIC SAFETY',
      title: 'Promise stock with absolute certainty.',
      desc: 'When simultaneous requests compete for the same inventory, the engine deterministically resolves who can commit to prevent double-booking.'
    },
    {
      icon: History,
      label: 'TRACEABLE ACCOUNTABILITY',
      title: 'Maintain a complete chain of custody.',
      desc: 'Confirmations, dispatches, driver pickups, damage reports, and maintenance states stay locked in an immutable operational ledger.'
    },
    {
      icon: Building2,
      label: 'WORKSPACE ISOLATION',
      title: 'Keep multi-depot operations clean.',
      desc: 'Each rental business operates inside its own secure workspace with isolated inventory, pricing tiers, and warehouse teams.'
    }
  ];

  return (
    <section className="py-24 px-4 sm:px-6 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Editorial Lead Quote (Integrated from WhyItMatters) */}
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="font-mono text-xs font-semibold tracking-widest text-primary uppercase">
            OPERATIONAL FOUNDATION
          </div>
          <blockquote className="text-2xl sm:text-3xl md:text-4xl font-bold leading-snug text-text">
            TemporalRent treats rental inventory as something <br className="hidden sm:inline" />
            <span className="text-primary">occupied across time</span> &mdash; not merely counted on shelves.
          </blockquote>
          <p className="text-base text-text-muted max-w-2xl mx-auto">
            Traditional tools assume inventory stays in the warehouse until sold. Event rentals require software engineered for circulating physical assets.
          </p>
        </div>

        {/* 4 Architectural Principles */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {principles.map((p, idx) => {
            const Icon = p.icon;
            return (
              <motion.div 
                key={p.label}
                initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: idx * 0.06 }}
                className="bg-surface border border-border p-6 rounded-xl space-y-4 hover:border-primary/40 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-surface-raised border border-border flex items-center justify-center text-primary">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="font-mono text-[11px] font-bold text-primary tracking-wider uppercase">
                    {p.label}
                  </div>
                  <h3 className="text-base font-bold text-text leading-snug">
                    {p.title}
                  </h3>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  {p.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
