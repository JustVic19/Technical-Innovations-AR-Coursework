import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SEVERITY_COLORS } from '@/lib/permissions';

export default function SeverityDonut({ faults }) {
  const data = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    faults.forEach(f => { if (counts[f.severity] !== undefined) counts[f.severity]++; });
    return Object.entries(counts).map(([k, v]) => ({ name: k, value: v }));
  }, [faults]);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-lg border border-border bg-card/60 backdrop-blur-sm p-5 h-full">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono">Distribution</div>
      <div className="font-display text-lg font-semibold mt-1 mb-2">Severity mix</div>

      <div className="h-48 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2} stroke="none">
              {data.map(entry => (
                <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="font-display text-3xl font-bold">{total}</div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono">Total</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        {data.map(d => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: SEVERITY_COLORS[d.name] }} />
              <span className="capitalize text-muted-foreground">{d.name}</span>
            </div>
            <span className="font-mono">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}