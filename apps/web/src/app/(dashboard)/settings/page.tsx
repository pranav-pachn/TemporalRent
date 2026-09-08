import { EmptyState } from '@/components/ui/EmptyState';
import { Construction } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-text mb-6 capitalize">settings</h1>
      <div className="bg-surface border border-border rounded-lg min-h-[400px] flex items-center justify-center">
        <EmptyState 
          icon={Construction}
          title="Coming Soon"
          description="The settings module is currently under construction and will be available in a future update."
        />
      </div>
    </div>
  );
}
