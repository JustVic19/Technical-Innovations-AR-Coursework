import React from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Wrench } from 'lucide-react';

const STATUS_CLR = {
  available: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  checked_out: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  in_use: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  missing: 'bg-red-500/15 text-red-400 border-red-500/30',
  maintenance: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
};

export default function ToolsList({ tools, canEdit, onEdit, onDelete }) {
  if (tools.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card/60 p-12 text-center">
        <Wrench className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
        <div className="text-sm text-muted-foreground">No tools registered yet.</div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {tools.map(t => (
        <div key={t.id} className="rounded-lg border border-border bg-card/60 p-4 hover:border-primary/30 transition-colors">
          <div className="flex items-start justify-between mb-2">
            <div className="min-w-0">
              <div className="font-medium truncate">{t.name}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] font-mono text-muted-foreground mt-0.5">
                {t.tool_id} · {t.category}
              </div>
            </div>
            <span className={`shrink-0 px-1.5 py-0.5 text-[10px] uppercase font-mono rounded border ${STATUS_CLR[t.status] || ''}`}>
              {(t.status || '').replace('_', ' ')}
            </span>
          </div>
          <div className="text-xs text-muted-foreground space-y-1 mt-3">
            {t.serial_number && <div>S/N: <span className="font-mono">{t.serial_number}</span></div>}
            {t.assigned_kit && <div>Kit: <span className="font-mono">{t.assigned_kit}</span></div>}
            {t.checked_out_by && <div>Out to: <span className="font-mono">{t.checked_out_by}</span></div>}
          </div>
          {canEdit && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-border">
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5" onClick={() => onEdit(t)}>
                <Pencil className="w-3 h-3" /> Edit
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5 text-red-400" onClick={() => onDelete(t.id)}>
                <Trash2 className="w-3 h-3" /> Delete
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}