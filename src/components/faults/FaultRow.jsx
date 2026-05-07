import React from 'react';
import { SeverityBadge, StatusBadge } from '@/components/SeverityBadge';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Hash } from 'lucide-react';

export default function FaultRow({ fault, site, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full grid grid-cols-12 gap-4 px-5 py-4 border-b border-border/60 last:border-0 hover:bg-secondary/30 transition-colors text-left"
    >
      <div className="col-span-5 md:col-span-4 min-w-0">
        <div className="flex items-center gap-2">
          {fault.severity === 'critical' && <span className="w-1.5 h-1.5 rounded-full bg-red-400 pulse-ring-critical shrink-0" />}
          <div className="font-medium truncate">{fault.title}</div>
        </div>
        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mt-1 flex items-center gap-2">
          <Hash className="w-3 h-3" />{fault.marker_id || '—'}
          <span className="opacity-50">·</span>
          <span>{(fault.category || '').replace(/_/g, ' ')}</span>
        </div>
      </div>
      <div className="col-span-3 md:col-span-2 min-w-0">
        <div className="text-sm truncate flex items-center gap-1">
          <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
          {site?.code || '—'}
        </div>
        <div className="text-[10px] text-muted-foreground truncate">{site?.name}</div>
      </div>
      <div className="hidden md:flex md:col-span-2 items-center"><SeverityBadge severity={fault.severity} /></div>
      <div className="col-span-2 md:col-span-2 flex items-center"><StatusBadge status={fault.status} /></div>
      <div className="col-span-2 md:col-span-2 text-right text-xs text-muted-foreground font-mono">
        {fault.created_date && formatDistanceToNow(new Date(fault.created_date), { addSuffix: true })}
      </div>
    </button>
  );
}