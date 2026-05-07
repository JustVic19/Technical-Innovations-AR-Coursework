import React from 'react';
import { motion } from 'framer-motion';
import { SEVERITY_COLORS } from '@/lib/permissions';

export default function SchematicView({ site, faults, onSelect }) {
  return (
    <div className="rounded-lg border border-border bg-card/60 overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono">Schematic mode</div>
          <div className="font-display font-semibold">
            {site ? `${site.code} — ${site.name}` : 'All sites overview'}
          </div>
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          {faults.length} marker{faults.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="relative aspect-[16/9] bg-[hsl(220_30%_5%)] grid-bg overflow-hidden">
        {/* Simulated infrastructure schematic */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 562" preserveAspectRatio="xMidYMid meet">
          {/* Tracks */}
          <line x1="50" y1="200" x2="950" y2="200" stroke="hsl(220 18% 25%)" strokeWidth="3" strokeDasharray="6 8" />
          <line x1="50" y1="280" x2="950" y2="280" stroke="hsl(220 18% 25%)" strokeWidth="3" strokeDasharray="6 8" />
          <line x1="50" y1="380" x2="950" y2="380" stroke="hsl(220 18% 25%)" strokeWidth="3" strokeDasharray="6 8" />
          {/* Platforms */}
          <rect x="100" y="220" width="280" height="40" fill="hsl(220 24% 13%)" stroke="hsl(220 18% 22%)" />
          <rect x="450" y="220" width="280" height="40" fill="hsl(220 24% 13%)" stroke="hsl(220 18% 22%)" />
          <rect x="200" y="400" width="500" height="40" fill="hsl(220 24% 13%)" stroke="hsl(220 18% 22%)" />
          {/* Service rooms */}
          <rect x="800" y="80" width="120" height="80" fill="hsl(220 24% 12%)" stroke="hsl(220 18% 22%)" />
          <rect x="80" y="80" width="100" height="80" fill="hsl(220 24% 12%)" stroke="hsl(220 18% 22%)" />
          <text x="140" y="125" fill="hsl(215 15% 50%)" fontSize="10" fontFamily="monospace" textAnchor="middle">PLANT</text>
          <text x="860" y="125" fill="hsl(215 15% 50%)" fontSize="10" fontFamily="monospace" textAnchor="middle">SIGNAL ROOM</text>
          <text x="240" y="247" fill="hsl(215 15% 50%)" fontSize="10" fontFamily="monospace" textAnchor="middle">PLATFORM 1</text>
          <text x="590" y="247" fill="hsl(215 15% 50%)" fontSize="10" fontFamily="monospace" textAnchor="middle">PLATFORM 2</text>
        </svg>

        {/* Scan line */}
        <motion.div
          className="absolute inset-x-0 h-32 scan-line pointer-events-none"
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />

        {/* Fault markers */}
        {faults.map(f => (
          <FaultMarker key={f.id} fault={f} onClick={() => onSelect(f)} />
        ))}

        {faults.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-mono">No faults</div>
              <div className="text-sm text-muted-foreground mt-1">All systems nominal.</div>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-border flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] font-mono text-muted-foreground">
        {Object.entries(SEVERITY_COLORS).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: v }} />
            {k}
          </div>
        ))}
      </div>
    </div>
  );
}

function FaultMarker({ fault, onClick }) {
  const x = fault.position?.x ?? 50;
  const y = fault.position?.y ?? 50;
  const color = SEVERITY_COLORS[fault.severity];
  const isCritical = fault.severity === 'critical';

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
      onClick={onClick}
      className="absolute -translate-x-1/2 -translate-y-1/2 group"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className="relative">
        <div
          className={`w-3 h-3 rounded-full ${isCritical ? 'pulse-ring-critical' : 'pulse-ring'}`}
          style={{ background: color, boxShadow: `0 0 12px ${color}` }}
        />
        <div className="absolute left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-popover border border-border rounded px-2 py-1 text-xs whitespace-nowrap shadow-xl">
            <div className="font-medium">{fault.title}</div>
            <div className="text-[10px] text-muted-foreground font-mono uppercase">{fault.marker_id} · {fault.severity}</div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}