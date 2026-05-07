import React, { useMemo } from 'react';
import { Cpu, AlertTriangle } from 'lucide-react';
import { SEVERITY_CLASSES } from '@/lib/permissions';

// Lightweight predictive model: scores faults by severity, age, category recurrence
function predict(faults) {
  const open = faults.filter(f => !['resolved', 'rejected'].includes(f.status));
  const categoryCounts = faults.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1;
    return acc;
  }, {});

  return open.map(f => {
    const ageDays = (Date.now() - new Date(f.created_date).getTime()) / 86400000;
    const sevWeight = { low: 0.1, medium: 0.3, high: 0.6, critical: 0.95 }[f.severity] || 0.3;
    const recurrence = Math.min(1, (categoryCounts[f.category] || 0) / 8);
    const ageFactor = Math.min(1, ageDays / 14);
    const risk = Math.round((sevWeight * 0.55 + recurrence * 0.25 + ageFactor * 0.2) * 100);
    const days = Math.max(1, Math.round((1 - risk / 100) * 30));
    return { ...f, risk, days };
  }).sort((a, b) => b.risk - a.risk).slice(0, 6);
}

export default function PredictiveInsights({ faults }) {
  const predictions = useMemo(() => predict(faults), [faults]);

  return (
    <div className="rounded-lg border border-border bg-card/60 backdrop-blur-sm p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono flex items-center gap-2">
            <Cpu className="w-3 h-3" /> ML Risk model · v0.3
          </div>
          <div className="font-display text-lg font-semibold mt-1">Predicted failure risk</div>
        </div>
      </div>

      {predictions.length === 0 && (
        <div className="text-sm text-muted-foreground font-mono py-8 text-center">
          No open faults to score.
        </div>
      )}

      <div className="space-y-2">
        {predictions.map(p => (
          <div key={p.id} className="flex items-center gap-3 p-2.5 rounded border border-border/60 hover:border-primary/30 bg-secondary/30 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-1.5 py-0.5 text-[10px] uppercase font-mono rounded border ${SEVERITY_CLASSES[p.severity]}`}>
                  {p.severity}
                </span>
                <span className="text-xs font-medium truncate">{p.title}</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                {p.category?.replace(/_/g, ' ')} · est. {p.days}d to escalation
              </div>
            </div>
            <div className="text-right">
              <div className={`font-display font-bold text-lg ${p.risk > 70 ? 'text-red-400' : p.risk > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {p.risk}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono uppercase">risk</div>
            </div>
            <div className="w-1 h-10 rounded-full bg-secondary overflow-hidden">
              <div className={`w-full ${p.risk > 70 ? 'bg-red-400' : p.risk > 40 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ height: `${p.risk}%`, marginTop: `${100 - p.risk}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}