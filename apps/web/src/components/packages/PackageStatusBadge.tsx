import React from 'react';
import { PackageVersionStatus } from '@/types/package';

export function PackageStatusBadge({ status }: { status: PackageVersionStatus }) {
  const getBadgeStyle = () => {
    switch (status) {
      case 'DRAFT':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'ARCHIVED':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'ACTIVE':
        return 'PUBLISHED';
      case 'DRAFT':
        return 'DRAFT';
      case 'ARCHIVED':
        return 'ARCHIVED';
      default:
        return status;
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle()}`}>
      {getLabel()}
    </span>
  );
}
