'use client';

import { motion, useReducedMotion } from 'framer-motion';

export function HowItWorksSection() {
  const shouldReduceMotion = useReducedMotion();

  const steps = [
    { 
      id: '01', 
      title: 'Booking Request', 
      desc: 'Customer selects event dates, operational times, and requested items or packages.' 
    },
    { 
      id: '02', 
      title: 'Demand Expansion', 
      desc: 'Packages and bundles automatically decompose into exact physical SKU requirements.' 
    },
    { 
      id: '03', 
      title: 'Temporal Check', 
      desc: 'The engine evaluates turnaround buffers, transit times, and maintenance windows.' 
    },
    { 
      id: '04', 
      title: 'Safe Reservation', 
      desc: 'Physical inventory is safely locked to the booking to prevent double-booking.' 
    },
    { 
      id: '05', 
      title: 'Fulfillment & Return', 
      desc: 'Warehouse picks, dispatches, and reconciles returned items into usable or damaged states.' 
    }
  ];

  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 bg-surface border-t border-border overflow-hidden scroll-mt-20">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="font-mono text-xs font-semibold tracking-widest text-primary uppercase">
            HOW IT WORKS
          </h2>
          <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-text leading-tight">
            From customer quote to reconciled inventory.
          </p>
          <p className="text-base sm:text-lg text-text-muted leading-relaxed">
            Every step is designed to guarantee physical inventory truth from initial reservation through warehouse return.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 sm:gap-6">
          {steps.map((step, idx) => (
            <motion.div 
              key={step.id}
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: idx * 0.06 }}
              className="bg-background border border-border p-6 rounded-xl flex flex-col justify-between space-y-5 hover:border-primary/40 hover:shadow-lg transition-all"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-4">
                  <span className="font-mono text-2xl font-bold text-primary">
                    {step.id}
                  </span>
                  <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">
                    Step {idx + 1}
                  </span>
                </div>
                <h3 className="text-base font-bold text-text mb-2 tracking-tight">{step.title}</h3>
                <p className="text-text-muted text-xs leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
