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
    <section className="py-24 px-6 bg-surface">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-sm font-bold tracking-widest text-primary uppercase">
            Built for Operations
          </h2>
          <p className="text-3xl md:text-4xl font-bold">Everything you need to run the warehouse</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="p-6 border border-border rounded-xl bg-background hover:border-primary/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <Icon className="text-primary w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
