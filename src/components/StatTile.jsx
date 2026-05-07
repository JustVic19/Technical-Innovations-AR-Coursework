import React from 'react';

export default function StatTile({ label, value, sublabel, icon: Icon, accent = 'primary', trend }) {
  const accentMap = {
    primary: 'text-primary border-primary/30 bg-primary/5',
    danger: 'text-red-400 border-red-500/30 bg-red-500/5',
    success: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
    info: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5',
    muted: 'text-muted-foreground border-border bg-secondary/40',
  };
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card/60 backdrop-blur-sm p-5 group hover:border-primary/30 transition-colors">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="relative flex items-start justify-between mb-3">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono">{label}</div>
        {Icon && (
          <div className={`p-2 rounded border ${accentMap[accent]}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="relative">
        <div className="font-display text-3xl font-bold tracking-tight">{value}</div>
        {sublabel && <div className="text-xs text-muted-foreground mt-1">{sublabel}</div>}
        {trend && <div className="text-xs mt-2 font-mono text-emerald-400">{trend}</div>}
      </div>
    </div>
  );
}