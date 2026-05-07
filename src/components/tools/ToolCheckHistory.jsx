import React from 'react';
import { format } from 'date-fns';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const RESULT = {
  pass: { c: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10', i: CheckCircle2 },
  warning: { c: 'border-amber-500/30 text-amber-400 bg-amber-500/10', i: AlertTriangle },
  fail: { c: 'border-red-500/30 text-red-400 bg-red-500/10', i: XCircle },
};

export default function ToolCheckHistory({ checks }) {
  if (checks.length === 0) {
    return <div className="rounded-lg border border-border bg-card/60 p-12 text-center text-sm text-muted-foreground">No checks recorded yet.</div>;
  }
  return (
    <div className="rounded-lg border border-border bg-card/60 overflow-hidden">
      {checks.map(c => {
        const r = RESULT[c.result] || RESULT.pass;
        const Icon = r.i;
        return (
          <div key={c.id} className="flex items-center gap-4 p-4 border-b border-border/60 last:border-0 hover:bg-secondary/30 transition-colors">
            <div className={`p-2 rounded border ${r.c}`}><Icon className="w-4 h-4" /></div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">Kit {c.kit_id} · {c.check_type?.replace('_', ' ')}</div>
              <div className="text-xs text-muted-foreground font-mono">
                {c.technician} · {c.created_date && format(new Date(c.created_date), 'd MMM yyyy HH:mm')}
              </div>
            </div>
            <div className="text-right text-xs font-mono">
              <div>{c.scanned_tools?.length || 0}/{c.expected_tools?.length || 0} verified</div>
              {c.missing_tools?.length > 0 && (
                <div className="text-red-400">{c.missing_tools.length} missing</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}