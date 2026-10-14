'use client';

import { CalendarDays, PackageSearch, Warehouse, ClipboardCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export function FeaturesSection() {
  const shouldReduceMotion = useReducedMotion();

  const features = [
    {
      icon: PackageSearch,
      title: 'Physical Inventory',
      description: 'Track stock counts, package decompositions, damaged items, and maintenance quarantine states with real-time accuracy.'
    },
    {
      icon: CalendarDays,
      title: 'Temporal Calendar',
      description: 'Visualize event bookings, dispatch turnarounds, and return buffers on an interactive multi-day timeline.'
    },
    {
      icon: ClipboardCheck,
      title: 'Reservation Engine',
      description: 'Create draft quotes, confirm client reservations, and automatically lock stock against concurrent demand.'
    },
    {
      icon: Warehouse,
      title: 'Depot Operations',
      description: 'Streamline warehouse dispatch queues, digital picking lists, and post-event return inspection tallies.'
    }
  ];

  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6 bg-surface border-t border-border">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h2 className="font-mono text-xs font-semibold tracking-widest text-primary uppercase">
            OPERATIONAL MODULES
          </h2>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-text">
            Four core modules. One unified inventory truth.
          </p>
          <p className="text-sm sm:text-base text-text-muted leading-relaxed">
            Engineered to coordinate your office coordinators, sales teams, and warehouse staff on one shared platform.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div 
                key={idx}
                initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: idx * 0.06 }}
                className="p-6 border border-border rounded-xl bg-surface-raised hover:border-primary/40 hover:shadow-lg transition-all space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-primary shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-text">{feature.title}</h3>
                </div>
                <p className="text-text-muted text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
