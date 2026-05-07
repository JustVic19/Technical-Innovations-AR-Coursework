import React from 'react';
import { SEVERITY_CLASSES, STATUS_CLASSES } from '@/lib/permissions';

export function SeverityBadge({ severity }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono rounded border ${SEVERITY_CLASSES[severity] || ''}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {severity}
    </span>
  );
}

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono rounded border ${STATUS_CLASSES[status] || ''}`}>
      {(status || '').replace(/_/g, ' ')}
    </span>
  );
}