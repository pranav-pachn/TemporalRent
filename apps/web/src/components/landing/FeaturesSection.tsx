import { CalendarDays, PackageSearch, Warehouse, ClipboardCheck } from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      icon: PackageSearch,
      title: 'Inventory',
      description: 'Track physical items, damaged stock, and maintenance states with precision.'
    },
    {
      icon: CalendarDays,
      title: 'Calendar',
      description: 'Visualize bookings, dispatches, and returns on a temporal timeline.'
    },
    {
      icon: ClipboardCheck,
      title: 'Bookings',
      description: 'Create draft quotes, confirm reservations, and automatically lock inventory.'
    },
    {
      icon: Warehouse,
      title: 'Warehouse',
      description: 'Manage dispatch workflows, picking lists, and return inspections seamlessly.'
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
            Everything you need to run your rental warehouse.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div 
                key={idx} 
                className="p-6 border border-border rounded-xl bg-surface-raised hover:border-border-active transition-colors space-y-4"
              >
                <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text mb-1.5">{feature.title}</h3>
                  <p className="text-text-muted text-xs leading-relaxed">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
