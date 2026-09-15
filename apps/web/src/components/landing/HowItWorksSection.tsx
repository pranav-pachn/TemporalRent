'use client';

import { motion } from 'framer-motion';

export function HowItWorksSection() {
  const steps = [
    { 
      id: '01', 
      title: 'Booking', 
      desc: 'Customer selects event dates and requested inventory items.' 
    },
    { 
      id: '02', 
      title: 'Demand', 
      desc: 'Packages become concrete physical inventory requirements.' 
    },
    { 
      id: '03', 
      title: 'Availability', 
      desc: 'The system checks the requested time window with operational buffers.' 
    },
    { 
      id: '04', 
      title: 'Reservation', 
      desc: 'Inventory is safely committed and locked to the booking.' 
    },
    { 
      id: '05', 
      title: 'Fulfillment', 
      desc: 'Warehouse staff picks, dispatches, and returns the physical stock.' 
    }
  ];

  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 bg-surface border-t border-border overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="font-mono text-xs font-semibold tracking-widest text-primary uppercase">
            HOW IT WORKS
          </h2>
          <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-text leading-tight">
            From customer request to physical fulfillment.
          </p>
        </div>

        <div className="relative">
          {/* Desktop Connecting Guideline */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -z-0 -translate-y-1/2" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
            {steps.map((step, idx) => (
              <motion.div 
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-background border border-border p-6 rounded-xl flex flex-col justify-between h-full space-y-6 hover:border-primary/40 transition-colors"
              >
                <div>
                  <div className="font-mono text-xs font-bold text-primary mb-3">
                    {step.id}
                  </div>
                  <h3 className="text-lg font-bold text-text mb-2">{step.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
