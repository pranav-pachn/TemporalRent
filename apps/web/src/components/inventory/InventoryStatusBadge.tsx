import React from 'react';
import { InventoryStatus } from '@/types/inventory';
import { Badge } from '@/components/ui/Badge'; // I need to make sure Badge exists, if not I'll just use a span.

export function InventoryStatusBadge({ status }: { status: InventoryStatus }) {
  const getBadgeStyle = () => {
    switch (status) {
      case 'HEALTHY':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'MAINTENANCE':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'DAMAGED':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'MISSING':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'OUT_OF_STOCK':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const formattedStatus = status.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyle()}`}>
      {formattedStatus}
    </span>
  );
}
