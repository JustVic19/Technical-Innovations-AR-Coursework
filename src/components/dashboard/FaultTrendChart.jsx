import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { TrendingUp } from 'lucide-react';

export default function FaultTrendChart({ faults }) {
  const data = useMemo(() => {
    const days = Array.from({ length: 14 }).map((_, i) => {
      const d = startOfDay(subDays(new Date(), 13 - i));
      return { date: d, label: format(d, 'd MMM'), reported: 0, resolved: 0 };
    });
    faults.forEach(f => {
      const created = startOfDay(new Date(f.created_date));
      const bucket = days.find(d => d.date.getTime() === created.getTime());
      if (bucket) bucket.reported++;
      if (f.status === 'resolved' && f.updated_date) {
        const upd = startOfDay(new Date(f.updated_date));
        const rb = days.find(d => d.date.getTime() === upd.getTime());
        if (rb) rb.resolved++;
      }
    });
    return days;
  }, [faults]);

  return (
    <div className="rounded-lg border border-border bg-card/60 backdrop-blur-sm p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono">14-day trend</div>
          <div className="font-display text-lg font-semibold mt-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Fault activity
          </div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Line type="monotone" dataKey="reported" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Reported" />
            <Line type="monotone" dataKey="resolved" stroke="hsl(142 70% 45%)" strokeWidth={2} dot={false} name="Resolved" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}